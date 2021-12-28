#!/usr/bin/env node

import { Command } from "commander";
const program = new Command();
// const { version } = require("../package.json");

program
  .name("rname")
  .version("0.1.0", "-v, --version")
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
