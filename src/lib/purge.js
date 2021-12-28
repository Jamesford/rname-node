import fs from "fs/promises";
import path from "path";

export async function purge(dir, renames) {
  const files = await fs.readdir(dir);
  const purgeFiles = files
    .filter((file) => !renames.has(file))
    .map((file) =>
      fs.rm(path.join(dir, file), { recursive: true, force: true })
    );
  const results = await Promise.allSettled(purgeFiles);
  results.forEach(({ status, reason }) => {
    if (status === "rejected") console.error(reason);
  });
}
