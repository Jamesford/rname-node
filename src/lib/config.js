import os from "os";
import path from "path";
import fs from "fs/promises";
import prompts from "prompts";

function getConfigPath() {
  return path.join(os.homedir(), ".rname");
}

export async function readAPIKey() {
  const { value } = await prompts({
    type: "text",
    name: "value",
    message: `Enter your TMDb API key (v3 auth)`,
  });
  return value || "";
}

export async function setupConfig() {
  const apiKey = await readAPIKey();
  const config = { apiKey };
  await writeConfig(config);
  return config;
}

let configCache = null;

export async function getConfig() {
  if (configCache !== null) {
    return configCache;
  }

  try {
    const config = await fs.readFile(getConfigPath(), "utf-8");
    const json = JSON.parse(config);
    configCache = json;
    return json;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    console.warn("Configuration file not found");
    return setupConfig();
  }
}

export async function writeConfig(config) {
  configCache = config;
  const data = JSON.stringify(config);
  return fs.writeFile(getConfigPath(), data, "utf-8");
}

export async function updateConfig(changes) {
  const config = await getConfig();
  return writeConfig({ ...config, ...changes });
}
