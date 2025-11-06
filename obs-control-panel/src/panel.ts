import { Select } from "@cliffy/prompt";
import { Input } from "@cliffy/prompt";
import { Confirm } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { tty } from "@cliffy/ansi";
import { colors } from "@std/fmt/colors";
import type { Agent, Order, PanelState } from "./types.ts";
import { AgentManager } from "./agent.ts";
import { PlaywrightController } from "./playwright-controller.ts";

/**
 * OBS Control Panel - TUI for managing agents and browser automation
 */
export class ControlPanel {
  private agentManager: AgentManager;
  private playwrightController: PlaywrightController;
  private state: PanelState;
  private updateInterval?: number;
  private isUpdating = false;

  constructor() {
    this.agentManager = new AgentManager();
    this.playwrightController = new PlaywrightController();
    this.state = {
      agents: [],
      isRunning: false,
      browserConnected: false,
    };

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for agent activity
   */
  private setupEventListeners(): void {
    this.agentManager.on("agentCreated", () => {
      this.updateState();
    });

    this.agentManager.on("orderStarted", () => {
      this.updateState();
    });

    this.agentManager.on("taskStarted", () => {
      this.updateState();
    });

    this.agentManager.on("taskCompleted", () => {
      this.updateState();
    });

    this.agentManager.on("orderCompleted", () => {
      this.updateState();
    });

    this.agentManager.on("orderFailed", () => {
      this.updateState();
    });
  }

  /**
   * Update panel state
   */
  private updateState(): void {
    this.state.agents = this.agentManager.getAllAgents();
    this.state.browserConnected = this.playwrightController.isReady();
  }

  /**
   * Start the control panel
   */
  async start(): Promise<void> {
    this.state.isRunning = true;

    // Clear screen and show header
    this.showHeader();

    // Main menu loop
    while (this.state.isRunning) {
      try {
        const action = await this.showMainMenu();
        await this.handleAction(action);
      } catch (error) {
        if (error instanceof Deno.errors.Interrupted) {
          this.state.isRunning = false;
          break;
        }
        console.error(colors.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await this.pause();
      }
    }

    await this.cleanup();
  }

  /**
   * Show header with logo and status
   */
  private showHeader(): void {
    console.clear();
    console.log(colors.cyan(colors.bold("╔════════════════════════════════════════════════════════╗")));
    console.log(colors.cyan(colors.bold("║       OBS AGENT CONTROL PANEL - Powered by Cliffy     ║")));
    console.log(colors.cyan(colors.bold("╚════════════════════════════════════════════════════════╝")));
    console.log();
  }

  /**
   * Show main menu
   */
  private async showMainMenu(): Promise<string> {
    // Show current status
    this.displayStatus();

    return await Select.prompt({
      message: "What would you like to do?",
      options: [
        { name: "Create Agent", value: "create_agent" },
        { name: "View Agents", value: "view_agents" },
        { name: "Create Order", value: "create_order" },
        { name: "Execute Order", value: "execute_order" },
        { name: "Initialize Browser (Playwright)", value: "init_browser" },
        { name: "Run Example Play", value: "run_play" },
        { name: "View Agent History", value: "view_history" },
        Select.separator("────────────"),
        { name: "Exit", value: "exit" },
      ],
    });
  }

  /**
   * Display current status
   */
  private displayStatus(): void {
    const statusTable = new Table()
      .header([
        colors.bold("Status"),
        colors.bold("Value"),
      ])
      .body([
        [
          "Agents",
          colors.cyan(String(this.state.agents.length)),
        ],
        [
          "Browser",
          this.state.browserConnected
            ? colors.green("Connected")
            : colors.red("Disconnected"),
        ],
        [
          "Active Orders",
          colors.yellow(
            String(this.state.agents.filter((a) => a.status === "busy").length),
          ),
        ],
      ])
      .border();

    console.log(statusTable.toString());
    console.log();
  }

  /**
   * Handle menu action
   */
  private async handleAction(action: string): Promise<void> {
    switch (action) {
      case "create_agent":
        await this.createAgent();
        break;
      case "view_agents":
        await this.viewAgents();
        break;
      case "create_order":
        await this.createOrderInteractive();
        break;
      case "execute_order":
        await this.executeOrderInteractive();
        break;
      case "init_browser":
        await this.initializeBrowser();
        break;
      case "run_play":
        await this.runExamplePlay();
        break;
      case "view_history":
        await this.viewAgentHistory();
        break;
      case "exit":
        this.state.isRunning = false;
        break;
    }

    if (this.state.isRunning) {
      this.showHeader();
    }
  }

  /**
   * Create a new agent
   */
  private async createAgent(): Promise<void> {
    const name = await Input.prompt({
      message: "Enter agent name:",
      default: `Agent-${this.state.agents.length + 1}`,
    });

    const agent = this.agentManager.createAgent(name);
    console.log(colors.green(`✓ Agent "${agent.name}" created successfully!`));
    await this.pause();
  }

  /**
   * View all agents
   */
  private async viewAgents(): Promise<void> {
    if (this.state.agents.length === 0) {
      console.log(colors.yellow("No agents found. Create one first!"));
      await this.pause();
      return;
    }

    const table = new Table()
      .header([
        colors.bold("ID"),
        colors.bold("Name"),
        colors.bold("Status"),
        colors.bold("Current Order"),
        colors.bold("Completed"),
      ])
      .border();

    for (const agent of this.state.agents) {
      const stats = this.agentManager.getStats(agent.id);
      table.push([
        agent.id.substring(0, 8),
        agent.name,
        this.getStatusColor(agent.status),
        agent.currentOrder?.name ?? "-",
        String(stats.completedOrders),
      ]);
    }

    console.log(table.toString());
    await this.pause();
  }

  /**
   * Get colored status text
   */
  private getStatusColor(status: string): string {
    switch (status) {
      case "idle":
        return colors.green(status);
      case "busy":
        return colors.yellow(status);
      case "error":
        return colors.red(status);
      default:
        return status;
    }
  }

  /**
   * Create order interactively
   */
  private async createOrderInteractive(): Promise<void> {
    console.log(colors.yellow("Note: For complex orders, use the programmatic API"));
    console.log(colors.dim("This demo creates a simple order with predefined tasks\n"));

    const name = await Input.prompt({
      message: "Order name:",
      default: "Demo Order",
    });

    // For demo purposes, create a simple order
    console.log(colors.green(`✓ Order "${name}" template created!`));
    console.log(colors.dim("Use the programmatic API to add custom tasks"));
    await this.pause();
  }

  /**
   * Execute order interactively
   */
  private async executeOrderInteractive(): Promise<void> {
    if (this.state.agents.length === 0) {
      console.log(colors.yellow("No agents available. Create one first!"));
      await this.pause();
      return;
    }

    // Select agent
    const agentChoices = this.state.agents.map((a) => ({
      name: `${a.name} (${a.status})`,
      value: a.id,
    }));

    const agentId = await Select.prompt({
      message: "Select agent:",
      options: agentChoices,
    });

    console.log(colors.green("Order execution would start here"));
    console.log(colors.dim("Use examples/sample-play.ts for a complete demo"));
    await this.pause();
  }

  /**
   * Initialize Playwright browser
   */
  private async initializeBrowser(): Promise<void> {
    if (this.state.browserConnected) {
      console.log(colors.yellow("Browser already connected!"));
      await this.pause();
      return;
    }

    console.log(colors.cyan("Initializing browser..."));
    console.log(colors.dim("This will open a browser window for OBS capture"));

    try {
      await this.playwrightController.initialize({
        headless: false,
        viewport: { width: 1920, height: 1080 },
      });
      this.updateState();
      console.log(colors.green("✓ Browser initialized successfully!"));
      console.log(colors.dim("You can now capture this browser window in OBS"));
    } catch (error) {
      console.log(colors.red(`✗ Failed to initialize browser`));
      console.log(colors.red(`${error instanceof Error ? error.message : String(error)}`));
    }

    await this.pause();
  }

  /**
   * Run an example play
   */
  private async runExamplePlay(): Promise<void> {
    if (!this.state.browserConnected) {
      console.log(colors.yellow("Browser not initialized. Initialize it first!"));
      await this.pause();
      return;
    }

    console.log(colors.cyan("Running example play..."));
    console.log(colors.dim("See examples/sample-play.ts for custom plays\n"));

    try {
      // Simple example play
      await this.playwrightController.navigate("https://example.com");
      console.log(colors.green("✓ Navigated to example.com"));

      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(colors.green("✓ Example play completed!"));
    } catch (error) {
      console.log(colors.red(`✗ Play failed: ${error instanceof Error ? error.message : String(error)}`));
    }

    await this.pause();
  }

  /**
   * View agent history
   */
  private async viewAgentHistory(): Promise<void> {
    if (this.state.agents.length === 0) {
      console.log(colors.yellow("No agents available"));
      await this.pause();
      return;
    }

    const agentChoices = this.state.agents.map((a) => ({
      name: a.name,
      value: a.id,
    }));

    const agentId = await Select.prompt({
      message: "Select agent:",
      options: agentChoices,
    });

    const agent = this.agentManager.getAgent(agentId);
    if (!agent) return;

    const stats = this.agentManager.getStats(agentId);

    console.log(colors.bold(`\n${agent.name} Statistics:`));
    console.log(`Total Orders: ${stats.totalOrders}`);
    console.log(`Completed: ${colors.green(String(stats.completedOrders))}`);
    console.log(`Failed: ${colors.red(String(stats.failedOrders))}`);
    console.log(`Total Tasks: ${stats.totalTasks}\n`);

    if (agent.orderHistory.length > 0) {
      const table = new Table()
        .header([
          colors.bold("Order"),
          colors.bold("Status"),
          colors.bold("Tasks"),
          colors.bold("Date"),
        ])
        .border();

      for (const order of agent.orderHistory.slice(-10)) {
        table.push([
          order.name,
          order.status === "completed" ? colors.green(order.status) : colors.red(order.status),
          String(order.tasks.length),
          order.createdAt.toLocaleString(),
        ]);
      }

      console.log(table.toString());
    }

    await this.pause();
  }

  /**
   * Pause for user input
   */
  private async pause(): Promise<void> {
    console.log();
    await Input.prompt({ message: colors.dim("Press Enter to continue...") });
  }

  /**
   * Get agent manager (for programmatic access)
   */
  getAgentManager(): AgentManager {
    return this.agentManager;
  }

  /**
   * Get Playwright controller (for programmatic access)
   */
  getPlaywrightController(): PlaywrightController {
    return this.playwrightController;
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    console.log(colors.cyan("\nShutting down..."));

    if (this.state.browserConnected) {
      console.log(colors.dim("Closing browser..."));
      await this.playwrightController.close();
    }

    console.log(colors.green("✓ Goodbye!"));
  }
}
