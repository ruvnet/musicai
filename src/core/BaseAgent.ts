import EventEmitter from 'eventemitter3';
import {
  AgentRole,
  AgentStatus,
  AgentTask,
  AgentMetrics,
  AgentCapability,
  AgentMessage,
} from '../types/index.js';

export interface IAgent {
  readonly role: AgentRole;
  readonly capabilities: AgentCapability[];
  status: AgentStatus;
  metrics: AgentMetrics;

  initialize(): Promise<void>;
  execute(task: AgentTask): Promise<unknown>;
  shutdown(): Promise<void>;
  handleMessage(message: AgentMessage): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): this;
}

export abstract class BaseAgent extends EventEmitter implements IAgent {
  public status: AgentStatus = AgentStatus.IDLE;
  public metrics: AgentMetrics = {
    taskCount: 0,
    successCount: 0,
    errorCount: 0,
    averageExecutionTime: 0,
    lastActive: Date.now(),
  };

  constructor(
    public readonly role: AgentRole,
    public readonly capabilities: AgentCapability[],
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    this.status = AgentStatus.IDLE;
    this.emit('initialized', { role: this.role });
  }

  public async execute(task: AgentTask): Promise<unknown> {
    const startTime = Date.now();
    this.status = AgentStatus.BUSY;
    this.metrics.taskCount++;
    this.metrics.lastActive = startTime;

    try {
      this.emit('task:started', { task });

      const result = await this.processTask(task);

      this.metrics.successCount++;
      this.updateAverageExecutionTime(Date.now() - startTime);
      this.status = AgentStatus.IDLE;

      this.emit('task:completed', { task, result });
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      this.status = AgentStatus.ERROR;
      this.emit('task:failed', { task, error });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    this.status = AgentStatus.IDLE;
    this.emit('shutdown', { role: this.role });
  }

  public async handleMessage(message: AgentMessage): Promise<void> {
    this.emit('message:received', { message });
    await this.processMessage(message);
  }

  protected abstract processTask(task: AgentTask): Promise<unknown>;

  protected abstract processMessage(message: AgentMessage): Promise<void>;

  private updateAverageExecutionTime(executionTime: number): void {
    const total = this.metrics.averageExecutionTime * (this.metrics.successCount - 1);
    this.metrics.averageExecutionTime = (total + executionTime) / this.metrics.successCount;
  }

  protected recordMetric(_metricName: string, _value: number): void {
    // Stub method for recording custom metrics
    // Can be extended for specific metric tracking
  }

  public getMetrics(): AgentMetrics {
    return this.metrics;
  }

  public async executeTask(task: AgentTask): Promise<unknown> {
    return this.execute(task);
  }
}
