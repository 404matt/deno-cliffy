#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-run

/**
 * Sample Play - Example of creating and executing orders with agents
 *
 * This example demonstrates:
 * - Creating agents
 * - Defining custom tasks
 * - Creating orders with multiple tasks
 * - Executing plays with Playwright
 * - Monitoring execution in real-time
 */

import { ControlPanel } from "../src/panel.ts";
import type { Play } from "../src/types.ts";
import { colors } from "@std/fmt/colors";

console.log(colors.bold(colors.cyan("═══════════════════════════════════════════════════════")));
console.log(colors.bold(colors.cyan("   OBS Control Panel - Sample Play Demonstration")));
console.log(colors.bold(colors.cyan("═══════════════════════════════════════════════════════\n")));

// Create control panel instance
const panel = new ControlPanel();
const agentManager = panel.getAgentManager();
const playwright = panel.getPlaywrightController();

// Step 1: Create an agent
console.log(colors.cyan("Step 1: Creating agent..."));
const agent = agentManager.createAgent("Demo Agent");
console.log(colors.green(`✓ Agent created: ${agent.name} (${agent.id.substring(0, 8)})\n`));

// Step 2: Define a play for browser automation
console.log(colors.cyan("Step 2: Defining play..."));
const demoPlay: Play = {
  name: "GitHub Search Demo",
  description: "Search for deno-cliffy on GitHub",
  url: "https://github.com",
  steps: [
    {
      type: "wait",
      duration: 2000,
      description: "Wait for page load",
    },
    {
      type: "click",
      selector: "[aria-label='Search or jump to…'], [data-target='qbsearch-input.inputButtonText']",
      description: "Click search box",
    },
    {
      type: "wait",
      duration: 1000,
      description: "Wait for search to expand",
    },
    {
      type: "type",
      selector: "#query-builder-test",
      value: "deno-cliffy",
      description: "Type search query",
    },
    {
      type: "wait",
      duration: 2000,
      description: "Wait for results",
    },
    {
      type: "screenshot",
      value: "github-search-result.png",
      description: "Take screenshot",
    },
  ],
};
console.log(colors.green(`✓ Play defined: ${demoPlay.name}\n`));

// Step 3: Create an order with tasks
console.log(colors.cyan("Step 3: Creating order with tasks..."));
const order = agentManager.createOrder(
  "Browser Automation Demo",
  "Demonstrate browser automation with Playwright",
  [
    {
      name: "Initialize Browser",
      description: "Launch Playwright browser for OBS capture",
      action: async () => {
        console.log(colors.dim("  → Launching browser..."));
        await playwright.initialize({
          headless: false, // Visible for OBS
          viewport: { width: 1920, height: 1080 },
        });
        console.log(colors.green("  ✓ Browser launched"));
      },
    },
    {
      name: "Execute Play",
      description: "Run the GitHub search play",
      action: async () => {
        console.log(colors.dim("  → Executing play..."));
        await playwright.executePlay(demoPlay);
        console.log(colors.green("  ✓ Play completed"));
      },
    },
    {
      name: "Wait for Observation",
      description: "Pause to allow OBS capture",
      action: async () => {
        console.log(colors.dim("  → Waiting 3 seconds for observation..."));
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log(colors.green("  ✓ Observation period complete"));
      },
    },
    {
      name: "Cleanup",
      description: "Close browser",
      action: async () => {
        console.log(colors.dim("  → Closing browser..."));
        await playwright.close();
        console.log(colors.green("  ✓ Browser closed"));
      },
    },
  ],
);
console.log(colors.green(`✓ Order created: ${order.name}\n`));

// Step 4: Execute the order
console.log(colors.cyan("Step 4: Executing order...\n"));
console.log(colors.yellow("Watch the browser window - it will be controlled automatically!"));
console.log(colors.dim("You can capture this window in OBS for streaming\n"));

try {
  await agentManager.executeOrder(agent.id, order);

  // Step 5: Show results
  console.log(colors.bold(colors.green("\n✓ Order completed successfully!\n")));

  console.log(colors.cyan("Order Summary:"));
  console.log(`  Name: ${order.name}`);
  console.log(`  Status: ${colors.green(order.status)}`);
  console.log(`  Tasks: ${order.tasks.length}`);
  console.log(`  Duration: ${
    order.tasks[order.tasks.length - 1].endTime!.getTime() -
    order.tasks[0].startTime!.getTime()
  }ms\n`);

  console.log(colors.cyan("Task Details:"));
  for (const task of order.tasks) {
    const duration = task.endTime && task.startTime
      ? task.endTime.getTime() - task.startTime.getTime()
      : 0;
    console.log(
      `  ${colors.green("✓")} ${task.name} (${duration}ms)`,
    );
  }

  // Agent stats
  const stats = agentManager.getStats(agent.id);
  console.log(colors.cyan("\nAgent Statistics:"));
  console.log(`  Total Orders: ${stats.totalOrders}`);
  console.log(`  Completed: ${stats.completedOrders}`);
  console.log(`  Failed: ${stats.failedOrders}`);
  console.log(`  Total Tasks: ${stats.totalTasks}`);
} catch (error) {
  console.log(colors.red("\n✗ Order failed!"));
  console.log(colors.red(`Error: ${error instanceof Error ? error.message : String(error)}`));

  // Show failed tasks
  console.log(colors.cyan("\nTask Status:"));
  for (const task of order.tasks) {
    const icon = task.status === "completed"
      ? colors.green("✓")
      : task.status === "failed"
      ? colors.red("✗")
      : colors.yellow("◦");
    console.log(`  ${icon} ${task.name} - ${task.status}`);
    if (task.error) {
      console.log(colors.red(`    Error: ${task.error}`));
    }
  }
} finally {
  // Ensure cleanup
  if (playwright.isReady()) {
    await playwright.close();
  }
}

console.log(colors.bold(colors.cyan("\n═══════════════════════════════════════════════════════")));
console.log(colors.cyan("Demo complete! Check out main.ts for the interactive TUI."));
console.log(colors.bold(colors.cyan("═══════════════════════════════════════════════════════\n")));
