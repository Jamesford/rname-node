#!/usr/bin/env node

import { Command } from "commander";
const program = new Command();
// const { version } = require("../package.json");

program
  .name("rname")
  .version("0.1.0", "-v, --version")
  .description("Rename plex media")
  .option("-d, --debug", "display logs", false)
  .command("setup", "setup rname before using", {
    executableFile: "cmd/setup",
  })
  .command("tv", "rename a tv show", {
    executableFile: "cmd/tv",
  })
  .alias("t")
  .command("movie", "rename a movie", {
    executableFile: "cmd/movie",
  })
  .alias("m")
  .command("test", "setup rname test directory", {
    executableFile: "cmd/test",
  });

program.parse(process.argv);
