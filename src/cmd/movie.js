import { Command } from "commander";
import { extname, join } from "path";
import prompts from "prompts";
import kleur from "kleur";
import fs from "fs/promises";
import { errors } from "../lib/errors.js";
import { clean, generateRenameTable } from "../lib/utils.js";
import { getMovieByID, getMovieByQuery } from "../lib/tmdb.js";
import { purge } from "../lib/purge.js";

const program = new Command()
  .option("-q, --query <movie name...>", "manually enter movie name")
  .option("-i, --id <TMDb id>", "manually provide movie id (overrides -q)")
  .option("-p, --purge", "delete files within directory that are not renamed")
  .action(errors(main))
  .parse();

async function main(options, cmd) {
  const opts = cmd.opts();
  // console.log({ opts });

  const regex = new RegExp(/(.+)[._](\d{4})[._](?!\d{4})?/i);
  // https://support.plex.tv/articles/203824396-what-media-formats-are-supported/
  // plus additional common containers
  const videoExts = new Set([
    ".asf",
    ".avi",
    ".flv",
    ".ogg",
    ".ogv",
    ".mkv",
    ".mov",
    ".mp4",
    ".webm",
    ".wmv",
  ]);

  const dir = process.cwd();
  const files = await fs.readdir(dir);

  const filesMetadata = files
    .filter((file) => regex.test(file))
    .filter((file) => videoExts.has(extname(file)))
    .map((file) => {
      const [_, rawName, year] = file.match(regex);
      return {
        file,
        year,
        name: clean(rawName),
        ext: extname(file),
      };
    });

  if (filesMetadata.length === 0) {
    console.log("No movie files found");
    process.exit(0);
  }

  let meta = filesMetadata[0];
  if (filesMetadata.length > 1) {
    const { index } = await prompts({
      type: "select",
      name: "index",
      message: "Multiple movie files found",
      choices: filesMetadata.map((meta, i) => ({
        title: meta.file,
        description: `${meta.name} (${meta.year})`,
        value: i,
      })),
      initial: 0,
    });
    meta = filesMetadata[index];
  }

  const query = opts.query
    ? opts.query.join(" ") // user provided query
    : `${meta.name} y:${meta.year}`; // generated query

  const { id, title, overview, year } = opts.id
    ? await getMovieByID(opts.id)
    : await getMovieByQuery(query);

  console.log(
    `${kleur
      .bold()
      .underline(title)} (${year}) - https://www.themoviedb.org/movie/${id}`
  );
  console.log(overview);

  let renames = [
    {
      file: meta.file,
      rename: `${title} (${year})${meta.ext}`,
    },
  ];

  const subtitleDir = files.find((file) => /^subs?(titles?)?$/i.test(file));
  if (subtitleDir) {
    let subDirStat = await fs.stat(subtitleDir);
    if (!subDirStat.isFile()) {
      const subtitleRenames = (await fs.readdir(join(dir, subtitleDir)))
        .filter(
          (file) =>
            extname(file) === ".srt" && /^[\d\_\-\.]*en.*.srt/i.test(file)
        )
        .map((file, i, arr) => ({
          file: `${subtitleDir}/${file}`,
          rename: `${title} (${year})${
            arr.length > 1 ? "_" + (i + 1) : ""
          }.en.srt`,
        }));

      if (subtitleRenames.length > 0) {
        renames = [...renames, ...subtitleRenames];
      }
    }
  }

  console.log(generateRenameTable(renames));

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "Rename files as shown above?",
    initial: false,
  });

  if (confirm) {
    const renamePromises = renames.map(({ file, rename }) =>
      fs.rename(join(dir, file), join(dir, rename))
    );
    const results = await Promise.allSettled(renamePromises);
    results.forEach(({ status, reason }) => {
      if (status === "rejected") console.error(reason);
    });
    // Exit if a rename error occurs
    if (results.find((r) => r.status === "rejected")) {
      process.exit(1);
    }

    if (opts.purge) {
      const renamesSet = new Set(renames.map((m) => m.rename));
      await purge(dir, renamesSet);
    }
  }
}