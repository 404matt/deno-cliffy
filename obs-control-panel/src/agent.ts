import type { Agent, Order, Task } from "./types.ts";

/**
 * Agent Manager - handles agent lifecycle and order execution
 */
export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  /**
   * Create a new agent
   */
  createAgent(name: string): Agent {
    const id = crypto.randomUUID();
    const agent: Agent = {
      id,
      name,
      status: "idle",
      orderHistory: [],
    };
    this.agents.set(id, agent);
    this.emit("agentCreated", agent);
    return agent;
  }

  /**
   * Get an agent by ID
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Create an order for an agent
   */
  createOrder(
    name: string,
    description: string,
    tasks: Omit<Task, "id" | "status">[],
  ): Order {
    const orderId = crypto.randomUUID();
    const order: Order = {
      id: orderId,
      name,
      description,
      tasks: tasks.map((task) => ({
        ...task,
        id: crypto.randomUUID(),
        status: "pending" as const,
      })),
      createdAt: new Date(),
      status: "pending",
    };
    return order;
  }

  /**
   * Assign an order to an agent and execute it
   */
  async executeOrder(agentId: string, order: Order): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status === "busy") {
      throw new Error(`Agent ${agent.name} is already busy`);
    }

    agent.currentOrder = order;
    agent.status = "busy";
    order.status = "in_progress";
    this.emit("orderStarted", { agent, order });

    try {
      for (const task of order.tasks) {
        await this.executeTask(agent, task);
        if (task.status === "failed") {
          throw new Error(`Task ${task.name} failed: ${task.error}`);
        }
      }
      order.status = "completed";
      this.emit("orderCompleted", { agent, order });
    } catch (error) {
      order.status = "failed";
      agent.status = "error";
      this.emit("orderFailed", { agent, order, error });
      throw error;
    } finally {
      agent.orderHistory.push(order);
      agent.currentOrder = undefined;
      if (agent.status !== "error") {
        agent.status = "idle";
      }
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(agent: Agent, task: Task): Promise<void> {
    task.status = "running";
    task.startTime = new Date();
    this.emit("taskStarted", { agent, task });

    try {
      await task.action();
      task.status = "completed";
      task.result = "Success";
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : String(error);
    } finally {
      task.endTime = new Date();
      this.emit("taskCompleted", { agent, task });
    }
  }

  /**
   * Event system for monitoring agent activity
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Get agent statistics
   */
  getStats(agentId: string): {
    totalOrders: number;
    completedOrders: number;
    failedOrders: number;
    totalTasks: number;
  } {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const totalOrders = agent.orderHistory.length;
    const completedOrders = agent.orderHistory.filter(
      (o) => o.status === "completed",
    ).length;
    const failedOrders = agent.orderHistory.filter((o) => o.status === "failed")
      .length;
    const totalTasks = agent.orderHistory.reduce(
      (sum, order) => sum + order.tasks.length,
      0,
    );

    return { totalOrders, completedOrders, failedOrders, totalTasks };
  }
}
