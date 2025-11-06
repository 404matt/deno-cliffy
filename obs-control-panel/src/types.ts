/**
 * Task status types
 */
export type TaskStatus = "pending" | "running" | "completed" | "failed";

/**
 * Individual task within an order
 */
export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  action: () => Promise<void>;
  result?: string;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Order containing multiple tasks
 */
export interface Order {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: Date;
  status: "pending" | "in_progress" | "completed" | "failed";
}

/**
 * Agent that executes orders
 */
export interface Agent {
  id: string;
  name: string;
  status: "idle" | "busy" | "error";
  currentOrder?: Order;
  orderHistory: Order[];
}

/**
 * Play definition for browser automation
 */
export interface Play {
  name: string;
  description: string;
  url: string;
  steps: PlayStep[];
}

/**
 * Individual step in a play
 */
export interface PlayStep {
  type: "navigate" | "click" | "type" | "wait" | "screenshot" | "custom";
  selector?: string;
  value?: string;
  duration?: number;
  description: string;
  action?: (page: any) => Promise<void>;
}

/**
 * Control panel state
 */
export interface PanelState {
  agents: Agent[];
  selectedAgent?: Agent;
  isRunning: boolean;
  browserConnected: boolean;
}
