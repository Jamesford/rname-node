import { Command } from "commander";
import { extname, join } from "path";
import prompts from "prompts";
import kleur from "kleur";
import fs from "fs/promises";
import { errors } from "../lib/errors.js";
import {
  removeTrailingSlash,
  clean,
  cleanFilename,
  cleanPath,
  generateRenameTable,
} from "../lib/utils.js";
import { getShowByID, getShowByQuery, getEpisodeTitles } from "../lib/tmdb.js";
import { purge } from "../lib/purge.js";

const program = new Command()
  .usage("[directory] [options]")
  .argument(
    "[directory]",
    "directory with files to rename",
    removeTrailingSlash,
    "."
  )
  .option("-q, --query <show name...>", "manually enter tv show name")
  .option("-i, --id <TMDb id>", "manually provide tv show id (overrides -q)")
  .option("-n, --none", "do not add episode names to the filenames", false)
  .option("-p, --purge", "delete files within directory that are not renamed")
  .action(errors(main))
  .parse();

async function main(dirName, opts) {
  const regex = new RegExp(/(.+?)s?(\d+)[ex](\d+)[ex-]{0,2}(\d+)?/i);

  const dir = join(process.cwd(), dirName);
  const parent = join(dir, "..");
  const files = await fs.readdir(dir);

  const names = new Map();
  const seasons = new Set();

  const filesMetadata = files
    .filter((file) => regex.test(file))
    .map((file) => {
      const [_, rawName, rawSeason, startEpisode, endEpisode] =
        file.match(regex);
      const name = clean(rawName);
      const season = parseInt(rawSeason, 10);
      names.set(name, names.has(name) ? names.get(name) + 1 : 1);
      seasons.add(season);
      return {
        file,
        season,
        startEpisode: parseInt(startEpisode, 10),
        endEpisode: endEpisode ? parseInt(endEpisode, 10) : false,
        ext: extname(file),
      };
    })
    .sort((a, b) => a.startEpisode - b.startEpisode);
  // console.log({ filesMetadata });

  if (filesMetadata.length === 0) {
    console.log("No tv show files found");
    process.exit(0);
  }

  const query = opts.query
    ? opts.query.join(" ") // user provided query
    : [...names.entries()].sort((a, b) => b[1] - a[1])[0][0]; // most common name

  if (seasons.size !== 1) {
    throw new Error(
      "Multiple seasons found, changing multiple seasons at once is not supported"
    );
  }
  const season = [...seasons.values()][0];
  // console.log({ query, season });

  const { id, name, overview, year } = opts.id
    ? await getShowByID(opts.id)
    : await getShowByQuery(query);
  // console.log({ id, name, overview });

  console.log(
    `${kleur
      .bold()
      .underline(name)} (${year}) - https://www.themoviedb.org/tv/${id}`
  );
  console.log(overview);

  const episodeTitles = opts.none ? {} : await getEpisodeTitles(id, season);

  const renames = filesMetadata.map((meta) => {
    const epSeason = season.toString().padStart(2, "0");
    const epStart = meta.startEpisode.toString().padStart(2, "0");

    // Base rename
    let rename = `${name} (${year}) - s${epSeason}e${epStart}`;

    // Handle dual-episode files (eg. Stargate SG-1 Season 1 Ep 1 & 2)
    if (meta.endEpisode) {
      const epEnd = meta.endEpisode.toString().padStart(2, "0");
      rename = `${rename}-e${epEnd}`;
    }

    // Add the episode title if found
    const epTitle = episodeTitles[meta.startEpisode];
    if (epTitle) {
      rename = `${rename} - ${epTitle}`;
    }

    // Finally append the file extension
    rename = `${rename}${meta.ext}`;

    return {
      file: meta.file,
      rename: cleanFilename(rename),
    };
  });

  console.log(generateRenameTable(renames));

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "Rename files as shown above?",
    initial: false,
  });

  if (confirm) {
    const seasonDir = `Season ${season.toString().padStart(2, "0")}`;
    await fs.mkdir(join(dir, seasonDir));

    const renamePromises = renames.map(({ file, rename }) =>
      fs.rename(join(dir, file), join(dir, seasonDir, rename))
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
      const renamesSet = new Set([seasonDir]);
      await purge(dir, renamesSet);
    }

    const parentFiles = new Set(await fs.readdir(parent));
    const showDir = cleanPath(`${name} (${year}) {tmdb-${id}}`);
    if (parentFiles.has(showDir)) {
      // Move season to already existing show dir
      await fs.rename(join(dir, seasonDir), join(parent, showDir, seasonDir));
      // Delete original dir if empty
      const isEmpty = (await fs.readdir(dir)).length === 0 ? true : false;
      if (isEmpty) {
        await fs.rm(dir, { recursive: true, force: true });
      }
    } else {
      // Rename original dir to show dir
      await fs.rename(dir, join(parent, showDir));
    }
  }
}
