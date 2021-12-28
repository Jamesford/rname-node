import { Command } from "commander";
import { extname, join } from "path";
import prompts from "prompts";
import kleur from "kleur";
import fs from "fs/promises";
import { errors } from "../lib/errors.js";
import { clean, generateRenameTable } from "../lib/utils.js";
import { getShowByID, getShowByQuery, getEpisodeTitles } from "../lib/tmdb.js";

const program = new Command()
  .option("-q, --query <show name...>", "manually enter tv show name")
  .option("-i, --id <TMDb id>", "manually provide tv show id (overrides -q)")
  .option("-p, --purge", "delete .txt, .exe files within the directory")
  .action(errors(main))
  .parse();

async function main(options, cmd) {
  const opts = cmd.opts();
  // console.log({ opts });

  const regex = new RegExp(/(.+?)s?(\d+)[ex](\d+)[ex-]{0,2}(\d+)?/i);

  const dir = process.cwd();
  // const files = await fs.readdir(dir);

  const files = [
    "RARBG.txt",
    "RARBG_DO_NOT_MIRROR.exe",
    "Star.Wars.The.Bad.Batch.S01E09.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E01.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E10.720p.WEB.H264-EXPLOIT.mkv",
    "Star.Wars.The.Bad.Batch.S01E02.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E11.720p.WEB.H264-EXPLOIT.mkv",
    "Star.Wars.The.Bad.Batch.S01E03.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E12.720p.WEB.H264-EXPLOIT.mkv",
    "Star.Wars.The.Bad.Batch.S01E04.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E13.720p.WEB.H264-EXPLOIT.mkv",
    "Star.Wars.The.Bad.Batch.S01E05.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E14.720p.WEB.H264-EXPLOIT.mkv",
    "Star.Wars.The.Bad.Batch.S01E06.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E15.720p.WEB.H264-EMPATHY.mkv",
    "Star.Wars.The.Bad.Batch.S01E07.720p.WEB.h264-KOGi.mkv",
    "Star.Wars.The.Bad.Batch.S01E16.720p.WEB.H264-EMPATHY.mkv",
    "Star.Wars.The.Bad.Batch.S01E08.720p.WEB.h264-KOGi.mkv",
  ];

  if (opts.purge) {
    const purgeFiles = fss.filter((file) => /\.(?:txt|exe)$/i.test(file));
    // .map((file) => fs.unlink(path.join(dir, file)));
    // const results = await Promise.allSettled(purgeFiles);
    // results.forEach(({ status, reason }) => {
    //   if (status === "rejected") console.error(reason);
    // });
    console.log("PURGEFILES DISABLED");
  }

  const names = new Map();
  const seasons = new Set();

  const f = files
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
  // console.log({ f });

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

  const { id, name, overview } = opts.id
    ? await getShowByID(opts.id)
    : await getShowByQuery(query);
  // console.log({ id, name, overview });

  console.log(
    `${kleur.bold().underline(name)} (https://www.themoviedb.org/tv/${id})`
  );
  console.log(overview);

  const episodeTitles = await getEpisodeTitles(id, season);

  const renames = f.map((file) => {
    const epSeason = season.toString().padStart(2, "0");
    const epStart = file.startEpisode.toString().padStart(2, "0");

    // Base rename
    let rename = `${name} - s${epSeason}e${epStart}`;

    // Handle dual-episode files (eg. Stargate SG-1 Season 1 Ep 1 & 2)
    if (file.endEpisode) {
      const epEnd = file.endEpisode.toString().padStart(2, "0");
      rename = `${rename}-e${epEnd}`;
    }

    // Add the episode title if found
    const epTitle = episodeTitles[file.startEpisode];
    if (epTitle) {
      rename = `${rename} - ${epTitle}`;
    }

    // Finally append the file extension
    rename = `${rename}${file.ext}`;

    return {
      file: file.file,
      rename: rename,
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
    const renamePromises = renames.map(({ file, rename }) =>
      fs.rename(join(dir, file), join(dir, rename))
    );
    const results = await Promise.allSettled(renamePromises);
    results.forEach(({ status, reason }) => {
      if (status === "rejected") console.error(reason);
    });
  }
}
