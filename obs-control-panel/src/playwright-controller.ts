import type { Play, PlayStep } from "./types.ts";

/**
 * Playwright Browser Controller
 * Handles browser automation for OBS streaming
 */
export class PlaywrightController {
  private browser: any = null;
  private page: any = null;
  private isConnected = false;

  /**
   * Initialize Playwright and launch browser
   * Note: Requires Playwright to be installed: npm install -D playwright
   */
  async initialize(options?: {
    headless?: boolean;
    viewport?: { width: number; height: number };
  }): Promise<void> {
    try {
      // Dynamic import of playwright
      // Users need to install: npm install -D playwright
      // or deno install npm:playwright
      const playwright = await import("npm:playwright@1.40.1");

      this.browser = await playwright.chromium.launch({
        headless: options?.headless ?? false, // Default to visible for OBS capture
        args: [
          "--window-position=0,0",
          ...(options?.headless ? [] : ["--start-maximized"]),
        ],
      });

      const context = await this.browser.newContext({
        viewport: options?.viewport ?? { width: 1920, height: 1080 },
        recordVideo: undefined, // Can enable for recording
      });

      this.page = await context.newPage();
      this.isConnected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Playwright: ${error instanceof Error ? error.message : String(error)}\n` +
          `Make sure Playwright is installed: npm install -D playwright`,
      );
    }
  }

  /**
   * Execute a play (sequence of browser actions)
   */
  async executePlay(play: Play): Promise<void> {
    if (!this.isConnected || !this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    // Navigate to the play URL
    await this.page.goto(play.url, { waitUntil: "networkidle" });

    // Execute each step in sequence
    for (const step of play.steps) {
      await this.executeStep(step);
    }
  }

  /**
   * Execute a single play step
   */
  private async executeStep(step: PlayStep): Promise<void> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    switch (step.type) {
      case "navigate":
        if (step.value) {
          await this.page.goto(step.value, { waitUntil: "networkidle" });
        }
        break;

      case "click":
        if (step.selector) {
          await this.page.click(step.selector);
          await this.page.waitForTimeout(500); // Small delay after click
        }
        break;

      case "type":
        if (step.selector && step.value) {
          await this.page.fill(step.selector, step.value);
        }
        break;

      case "wait":
        await this.page.waitForTimeout(step.duration ?? 1000);
        break;

      case "screenshot":
        await this.page.screenshot({
          path: step.value ?? `screenshot-${Date.now()}.png`,
        });
        break;

      case "custom":
        if (step.action) {
          await step.action(this.page);
        }
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }
    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  /**
   * Get the current page object (for custom actions)
   */
  getPage(): any {
    return this.page;
  }

  /**
   * Take a screenshot
   */
  async screenshot(path?: string): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }
    await this.page.screenshot({
      path: path ?? `screenshot-${Date.now()}.png`,
    });
  }

  /**
   * Check if browser is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isConnected = false;
    }
  }
}
