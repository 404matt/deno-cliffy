# OBS Agent Control Panel

A powerful TUI (Terminal User Interface) application for controlling browser automation agents with OBS integration. Built with [deno-cliffy](https://cliffy.io) and [Playwright](https://playwright.dev).

## Features

- **Agent Management**: Create and manage multiple automation agents
- **Order System**: Define orders containing multiple tasks for agents to execute
- **Browser Automation**: Control browsers via Playwright for OBS streaming
- **Real-time TUI**: Interactive terminal interface with live status updates
- **Play System**: Create reusable "plays" - sequences of browser actions
- **OBS Ready**: Browser windows optimized for OBS capture (1920x1080)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Control Panel (TUI)                    │
│              Built with Cliffy Components                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐        ┌──────────────────┐        │
│  │  Agent Manager  │◄──────►│   Playwright     │        │
│  │                 │        │   Controller     │        │
│  │  - Create       │        │                  │        │
│  │  - Execute      │        │  - Initialize    │        │
│  │  - Monitor      │        │  - Execute Plays │        │
│  └─────────────────┘        │  - Control       │        │
│                              └──────────────────┘        │
│                                      │                   │
│                                      ▼                   │
│                              ┌──────────────┐            │
│                              │   Browser    │            │
│                              │   Window     │            │
│                              │ (OBS Capture)│            │
│                              └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

1. **Deno** (v1.37 or higher)
   ```bash
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

2. **Playwright** (for browser automation)
   ```bash
   # Install Playwright browsers
   npm install -D playwright
   npx playwright install chromium
   ```

### Setup

```bash
# Clone the repository
git clone https://github.com/c4spar/deno-cliffy.git
cd deno-cliffy/obs-control-panel

# Run the interactive control panel
deno task start

# Or run examples
deno task example
```

## Usage

### Interactive Mode

Launch the interactive TUI control panel:

```bash
deno task start
```

The control panel provides:
- Create and manage agents
- Initialize browser for OBS capture
- View agent history and statistics
- Execute orders and plays

### Programmatic Mode

Create custom plays and automation scripts:

```typescript
import { ControlPanel } from "./src/panel.ts";
import type { Play } from "./src/types.ts";

// Create control panel instance
const panel = new ControlPanel();
const agentManager = panel.getAgentManager();
const playwright = panel.getPlaywrightController();

// Create an agent
const agent = agentManager.createAgent("Demo Agent");

// Define a play
const play: Play = {
  name: "My Play",
  description: "Automated browser actions",
  url: "https://example.com",
  steps: [
    {
      type: "wait",
      duration: 2000,
      description: "Wait for page load",
    },
    {
      type: "click",
      selector: "button.primary",
      description: "Click primary button",
    },
    {
      type: "type",
      selector: "input[name='search']",
      value: "deno-cliffy",
      description: "Enter search term",
    },
    {
      type: "screenshot",
      value: "result.png",
      description: "Capture screenshot",
    },
  ],
};

// Create an order with tasks
const order = agentManager.createOrder(
  "Browser Demo",
  "Demonstrate browser automation",
  [
    {
      name: "Initialize Browser",
      description: "Launch Playwright browser",
      action: async () => {
        await playwright.initialize({
          headless: false,
          viewport: { width: 1920, height: 1080 },
        });
      },
    },
    {
      name: "Execute Play",
      description: "Run the automated play",
      action: async () => {
        await playwright.executePlay(play);
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

// Execute the order
await agentManager.executeOrder(agent.id, order);
```

## Examples

### Example 1: Sample Play

Run the included sample play that demonstrates GitHub search:

```bash
deno run --allow-net --allow-read --allow-write --allow-env --allow-run examples/sample-play.ts
```

This example shows:
- Creating an agent
- Defining a play with multiple steps
- Creating an order with tasks
- Executing browser automation
- Monitoring task progress

### Example 2: Custom Play

Create custom plays with advanced Playwright features:

```bash
deno run --allow-net --allow-read --allow-write --allow-env --allow-run examples/custom-play.ts
```

This demonstrates:
- Custom Playwright actions
- Direct page object access
- Advanced browser interactions
- Screenshot capture

## Play Step Types

Plays are composed of steps. Available step types:

| Type | Description | Parameters |
|------|-------------|------------|
| `navigate` | Navigate to URL | `value`: URL string |
| `click` | Click element | `selector`: CSS selector |
| `type` | Type text | `selector`: CSS selector, `value`: text |
| `wait` | Wait/pause | `duration`: milliseconds |
| `screenshot` | Capture screenshot | `value`: file path |
| `custom` | Custom action | `action`: async function with page object |

### Custom Actions

For advanced scenarios, use custom actions with full Playwright API access:

```typescript
{
  type: "custom",
  description: "Advanced interaction",
  action: async (page) => {
    // Full Playwright API available
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });

    const elements = await page.$$("div.item");
    console.log(`Found ${elements.length} items`);

    // Any Playwright operation
    await page.screenshot({ fullPage: true });
  },
}
```

## OBS Integration

### Setting up OBS Capture

1. **Launch the control panel** and initialize browser
2. **In OBS Studio**:
   - Add Source → Window Capture
   - Select the Chromium browser window
   - Adjust crop/transform as needed
3. **Run your plays** - the browser will be automated while OBS captures

### Optimal Settings

The browser launches with OBS-friendly defaults:
- **Resolution**: 1920x1080 (Full HD)
- **Window Mode**: Non-headless (visible)
- **Position**: Top-left of screen

Customize in code:

```typescript
await playwright.initialize({
  headless: false,
  viewport: { width: 1920, height: 1080 },
});
```

## API Reference

### ControlPanel

Main control panel class.

```typescript
const panel = new ControlPanel();
await panel.start(); // Launch interactive TUI

// Programmatic access
const agentManager = panel.getAgentManager();
const playwright = panel.getPlaywrightController();
```

### AgentManager

Manages agents and order execution.

**Methods**:
- `createAgent(name: string): Agent`
- `getAgent(id: string): Agent | undefined`
- `getAllAgents(): Agent[]`
- `createOrder(name, description, tasks): Order`
- `executeOrder(agentId, order): Promise<void>`
- `getStats(agentId): Stats`
- `on(event, callback): void` - Event listener

**Events**:
- `agentCreated`
- `orderStarted`
- `taskStarted`
- `taskCompleted`
- `orderCompleted`
- `orderFailed`

### PlaywrightController

Controls browser automation.

**Methods**:
- `initialize(options): Promise<void>`
- `executePlay(play): Promise<void>`
- `navigate(url): Promise<void>`
- `getPage(): Page` - Access Playwright page object
- `screenshot(path): Promise<void>`
- `isReady(): boolean`
- `close(): Promise<void>`

## Project Structure

```
obs-control-panel/
├── deno.json                 # Configuration
├── main.ts                   # Interactive TUI entry point
├── README.md                 # This file
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── agent.ts              # Agent management system
│   ├── playwright-controller.ts  # Browser automation
│   └── panel.ts              # TUI control panel
└── examples/
    ├── sample-play.ts        # Sample automation demo
    └── custom-play.ts        # Advanced custom play
```

## Cliffy Components Used

This project demonstrates various [Cliffy](https://cliffy.io) components:

- **@cliffy/prompt** - Interactive menus and user input
  - Select: Main menu navigation
  - Input: Text entry for names and values
  - Confirm: Yes/No prompts
- **@cliffy/table** - Status displays and data presentation
- **@cliffy/ansi** - Terminal control and screen management
- **@cliffy/command** - CLI framework and argument parsing

## Tips & Best Practices

### Creating Effective Plays

1. **Add wait steps** - Let pages load fully
2. **Use descriptive names** - Makes debugging easier
3. **Handle errors** - Wrap risky operations in try/catch
4. **Take screenshots** - Useful for debugging and demos
5. **Test selectors** - Verify CSS selectors work before automating

### OBS Streaming Tips

1. **Use non-headless mode** - Headless can't be captured
2. **Consistent resolution** - Stick to 1920x1080
3. **Add delays** - Give viewers time to see each action
4. **Consider window position** - Make sure it's in frame
5. **Test before streaming** - Run plays beforehand

### Performance

- **Reuse browser instances** - Don't initialize for every play
- **Use page pools** - For parallel operations
- **Clean up properly** - Always close browser when done
- **Monitor memory** - Long-running agents should restart periodically

## Troubleshooting

### "Playwright not found"

Install Playwright and browsers:
```bash
npm install -D playwright
npx playwright install chromium
```

### "Permission denied"

Ensure you run with proper permissions:
```bash
deno run --allow-net --allow-read --allow-write --allow-env --allow-run main.ts
```

### Browser doesn't appear in OBS

1. Make sure browser is not headless
2. Check window is visible and not minimized
3. Verify OBS window capture is set to correct window
4. Try clicking the browser window to bring it to focus

### Selector not found errors

1. Wait for page load before interacting
2. Use browser DevTools to verify selectors
3. Add longer wait durations
4. Check if page structure changed

## Contributing

This is a demonstration project built on deno-cliffy. Feel free to:
- Fork and customize for your use case
- Add more play types
- Create new examples
- Improve the TUI interface

## License

MIT License - see the main [deno-cliffy](https://github.com/c4spar/deno-cliffy) repository for details.

## Resources

- [Cliffy Documentation](https://cliffy.io)
- [Playwright Documentation](https://playwright.dev)
- [Deno Documentation](https://deno.land)
- [OBS Studio](https://obsproject.com)

## Credits

Built with:
- [deno-cliffy](https://cliffy.io) by @c4spar - Terminal UI framework
- [Playwright](https://playwright.dev) - Browser automation
- [Deno](https://deno.land) - Modern JavaScript runtime

---

**Happy Automating! 🎬🤖**
