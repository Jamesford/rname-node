import { Command } from "commander";
import { errors } from "../lib/errors.js";
import { setupConfig } from "../lib/config.js";

const program = new Command().action(errors(main)).parse();

async function main() {
  await setupConfig();
  console.log("Setup Complete");
}
