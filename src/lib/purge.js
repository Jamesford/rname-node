import fs from "fs/promises";
import path from "path";

export async function purge(dir, files) {
  const purgeFiles = files
    .filter((file) => /\.(?:txt|exe)$/i.test(file))
    .map((file) => fs.unlink(path.join(dir, file)));
  const results = await Promise.allSettled(purgeFiles);
  results.forEach(({ status, reason }) => {
    if (status === "rejected") console.error(reason);
  });
}
