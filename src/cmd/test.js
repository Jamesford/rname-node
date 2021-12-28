import { Command } from "commander";
import { errors } from "../lib/errors.js";
import { getConfig, writeConfig, updateConfig } from "../lib/config.js";

const program = new Command()
  .option("-f, --force", "force an action", false)
  .action(errors(main))
  .parse();

async function main(options, cmd) {
  const opts = cmd.opts();
  console.log({ opts });
  console.log(await getConfig());
}
