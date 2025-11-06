#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-run

/**
 * Custom Play Example - Advanced Playwright automation
 *
 * This example shows how to create custom plays with advanced interactions
 * Perfect for creating demo scenarios for OBS streaming
 */

import { ControlPanel } from "../src/panel.ts";
import type { Play } from "../src/types.ts";
import { colors } from "@std/fmt/colors";

console.log(colors.bold(colors.cyan("Custom Play Example - Weather Dashboard\n")));

const panel = new ControlPanel();
const agentManager = panel.getAgentManager();
const playwright = panel.getPlaywrightController();

// Create agent
const agent = agentManager.createAgent("Weather Agent");

// Define a custom play with advanced interactions
const weatherPlay: Play = {
  name: "Weather Dashboard Demo",
  description: "Navigate to a weather site and display current conditions",
  url: "https://www.weather.gov",
  steps: [
    {
      type: "wait",
      duration: 2000,
      description: "Wait for page load",
    },
    {
      type: "custom",
      description: "Custom interaction - scroll and highlight",
      action: async (page: any) => {
        // Custom Playwright code - you have full control!
        await page.evaluate(() => {
          window.scrollTo(0, 300);
        });

        // You can do anything Playwright supports
        const title = await page.title();
        console.log(colors.dim(`  → Page title: ${title}`));

        // Take screenshot with custom options
        await page.screenshot({
          path: "weather-custom.png",
          fullPage: false,
        });
      },
    },
    {
      type: "wait",
      duration: 2000,
      description: "Pause for observation",
    },
  ],
};

// Create order
const order = agentManager.createOrder(
  "Custom Weather Demo",
  "Advanced Playwright automation example",
  [
    {
      name: "Initialize Browser",
      description: "Launch browser",
      action: async () => {
        console.log(colors.dim("Launching browser..."));
        await playwright.initialize({
          headless: false,
          viewport: { width: 1920, height: 1080 },
        });
      },
    },
    {
      name: "Execute Custom Play",
      description: "Run weather dashboard play",
      action: async () => {
        console.log(colors.dim("Executing custom play..."));
        await playwright.executePlay(weatherPlay);
      },
    },
    {
      name: "Additional Custom Actions",
      description: "More custom Playwright code",
      action: async () => {
        const page = playwright.getPage();

        // You can access the page object directly for any custom automation
        console.log(colors.dim("Running custom actions..."));

        // Example: Get all links on the page
        const links = await page.$$eval("a", (elements: any[]) =>
          elements.slice(0, 5).map((el: any) => el.textContent?.trim())
        );

        console.log(colors.dim(`Found ${links.length} links (showing first 5):`));
        links.forEach((link: string) => console.log(colors.dim(`  - ${link}`)));
      },
    },
    {
      name: "Cleanup",
      description: "Close browser",
      action: async () => {
        await playwright.close();
      },
    },
  ],
);

// Execute
try {
  console.log(colors.cyan("\nExecuting custom play...\n"));
  await agentManager.executeOrder(agent.id, order);
  console.log(colors.green("\n✓ Custom play completed successfully!\n"));
} catch (error) {
  console.log(colors.red(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}\n`));
} finally {
  if (playwright.isReady()) {
    await playwright.close();
  }
}

console.log(colors.dim("Pro tip: Use custom actions for complex scenarios!"));
console.log(colors.dim("You have full access to Playwright's API in custom steps.\n"));
