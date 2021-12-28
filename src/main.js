#!/usr/bin/env node

import { Command } from "commander";
const program = new Command();

// Experimental JSON import is behind a flag
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");

program
  .name("rname")
  .version(version, "-v, --version")
  .description("Rename TV and Movies for Plex, with the help of TMDb")
  .option("-d, --debug", "display logs", false)
  .command("movie", "rename a movie", {
    executableFile: "cmd/movie",
  })
  .alias("m")
  .command("tv", "rename a tv show", {
    executableFile: "cmd/tv",
  })
  .alias("t")
  .command("setup", "setup rname before using", {
    executableFile: "cmd/setup",
  })
  .command("test", "reset rname test directory", {
    executableFile: "cmd/test",
  });

program.parse(process.argv);
