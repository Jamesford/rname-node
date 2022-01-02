import { Command } from "commander";
import { errors } from "../lib/errors.js";
import { exec as execute } from "child_process";
import path from "path";
import fs from "fs/promises";

const program = new Command().action(errors(main)).parse();

async function main(_options, _cmd) {
  const tvFiles = [
    "s1/RARBG.txt",
    "s1/RARBG_DO_NOT_MIRROR.exe",
    "s1/Star.Wars.The.Bad.Batch.S01E09.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E01.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E10.720p.WEB.H264-EXPLOIT.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E02.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E11.720p.WEB.H264-EXPLOIT.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E03.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E12.720p.WEB.H264-EXPLOIT.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E04.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E13.720p.WEB.H264-EXPLOIT.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E05.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E14.720p.WEB.H264-EXPLOIT.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E06.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E15.720p.WEB.H264-EMPATHY.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E07.720p.WEB.h264-KOGi.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E16.720p.WEB.H264-EMPATHY.mkv",
    "s1/Star.Wars.The.Bad.Batch.S01E08.720p.WEB.h264-KOGi.mkv",
    "s2/RARBG.txt",
    "s2/RARBG_DO_NOT_MIRROR.exe",
    "s2/Star.Wars.The.Bad.Batch.S02E09.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E01.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E10.720p.WEB.H264-EXPLOIT.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E02.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E11.720p.WEB.H264-EXPLOIT.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E03.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E12.720p.WEB.H264-EXPLOIT.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E04.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E13.720p.WEB.H264-EXPLOIT.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E05.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E14.720p.WEB.H264-EXPLOIT.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E06.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E15.720p.WEB.H264-EMPATHY.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E07.720p.WEB.h264-KOGi.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E16.720p.WEB.H264-EMPATHY.mkv",
    "s2/Star.Wars.The.Bad.Batch.S02E08.720p.WEB.h264-KOGi.mkv",
  ];

  const movieFiles = [
    "RARBG.txt",
    "RARBG_DO_NOT_MIRROR.exe",
    "Jungle.Cruise.2021.1080p.WEBRip.x264-RARBG.mp4",
    "Free.Guy.2021.1080p.WEBRip.x264-RARBG.mp4",
  ];

  const subtitleFiles = [
    "3_German.srt",
    "4_English.srt",
    "5_English.srt",
    "6_English.srt",
    "7_French.srt",
  ];

  const dir = process.cwd();
  if (await exists(path.join(dir, "media"))) {
    await fs.rm(path.join(dir, "media"), { recursive: true, force: true });
  }
  await fs.mkdir(path.join(dir, "media"));
  await fs.mkdir(path.join(dir, "media", "s1"));
  await fs.mkdir(path.join(dir, "media", "s2"));
  await fs.mkdir(path.join(dir, "media", "movie"));
  await fs.mkdir(path.join(dir, "media", "movie", "Subs"));

  const tvPromises = tvFiles.map((file) =>
    exec(`touch ${path.join(dir, "media", file)}`)
  );
  const results_t = await Promise.allSettled(tvPromises);
  results_t.forEach(({ status, reason }) => {
    if (status === "rejected") console.error(reason);
  });

  const moviePromises = movieFiles.map((file) =>
    exec(`touch ${path.join(dir, "media", "movie", file)}`)
  );
  const results_m = await Promise.allSettled(moviePromises);
  results_m.forEach(({ status, reason }) => {
    if (status === "rejected") console.error(reason);
  });

  const subPromises = subtitleFiles.map((file) =>
    exec(`touch ${path.join(dir, "media", "movie", "Subs", file)}`)
  );
  const results_s = await Promise.allSettled(subPromises);
  results_s.forEach(({ status, reason }) => {
    if (status === "rejected") console.error(reason);
  });
}

async function exec(cmd, { ignore, ...options } = { ignore: false }) {
  return new Promise((resolve, reject) => {
    execute(cmd, options, (err, stdout, stderr) => {
      if (err && !ignore) return reject(err);
      return resolve([stdout, stderr]);
    });
  });
}

async function exists(path) {
  try {
    await fs.stat(path);
    return true;
  } catch (_err) {
    return false;
  }
}
