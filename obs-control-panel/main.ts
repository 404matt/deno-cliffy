#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-run

import { Command } from "@cliffy/command";
import { ControlPanel } from "./src/panel.ts";

/**
 * OBS Agent Control Panel - Main Entry Point
 *
 * A TUI application for controlling browser automation agents
 * that can be captured by OBS for streaming.
 */

await new Command()
  .name("obs-control-panel")
  .version("1.0.0")
  .description(
    "Interactive control panel for managing browser automation agents with OBS integration",
  )
  .action(async () => {
    const panel = new ControlPanel();
    await panel.start();
  })
  .parse(Deno.args);
