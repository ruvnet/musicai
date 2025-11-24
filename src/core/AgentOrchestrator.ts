import EventEmitter from 'eventemitter3';
import { IAgent } from './BaseAgent.js';
import { MessageBus } from './MessageBus.js';
import { TaskQueue } from './TaskQueue.js';
import {
  AgentRole,
  AgentStatus,
  AgentTask,
  AgentMessage,
  SwarmConfig,
  TaskPriority,
} from '../types/index.js';

export interface IAgentOrchestrator {
  registerAgent(agent: IAgent): void;
  unregisterAgent(role: AgentRole): void;
  submitTask(task: AgentTask): Promise<unknown>;
  sendMessage(message: AgentMessage): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getAgentStatus(role: AgentRole): AgentStatus | undefined;
  getAllMetrics(): Map<AgentRole, unknown>;
}

export class AgentOrchestrator extends EventEmitter implements IAgentOrchestrator {
  private agents: Map<AgentRole, IAgent> = new Map();
  private messageBus: MessageBus;
  private taskQueue: TaskQueue;
  private isRunning: boolean = false;

  constructor(private config: SwarmConfig) {
    super();
    this.messageBus = new MessageBus();
    this.taskQueue = new TaskQueue(config.maxConcurrentAgents);

    this.setupMessageBusListeners();
  }

  public registerAgent(agent: IAgent): void {
    this.agents.set(agent.role, agent);

    // Subscribe agent to message bus
    this.messageBus.subscribe(agent.role, async (message: AgentMessage) => {
      await agent.handleMessage(message);
    });

    // Forward agent events
    agent.on('task:completed', (data) => {
      this.emit('agent:task:completed', { role: agent.role, ...data });
    });

    agent.on('task:failed', (data) => {
      this.emit('agent:task:failed', { role: agent.role, ...data });
    });

    this.emit('agent:registered', { role: agent.role });
  }

  public unregisterAgent(role: AgentRole): void {
    const agent = this.agents.get(role);
    if (agent) {
      this.messageBus.unsubscribe(role);
      this.agents.delete(role);
      this.emit('agent:unregistered', { role });
    }
  }

  public async submitTask(task: AgentTask): Promise<unknown> {
    const agent = this.agents.get(task.role);

    if (!agent) {
      throw new Error(`Agent not found for role: ${task.role}`);
    }

    if (agent.status === AgentStatus.BUSY && task.priority < TaskPriority.HIGH) {
      await this.taskQueue.enqueue(task);
      this.emit('task:queued', { task });
      return;
    }

    try {
      const result = await agent.execute(task);
      this.emit('task:completed', { task, result });
      return result;
    } catch (error) {
      this.emit('task:failed', { task, error });
      throw error;
    }
  }

  public async sendMessage(message: AgentMessage): Promise<void> {
    await this.messageBus.publish(message);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Initialize all agents
    const initPromises = Array.from(this.agents.values()).map((agent) => agent.initialize());

    await Promise.all(initPromises);

    this.emit('orchestrator:started', {
      agentCount: this.agents.size,
      config: this.config,
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Shutdown all agents
    const shutdownPromises = Array.from(this.agents.values()).map((agent) => agent.shutdown());

    await Promise.all(shutdownPromises);

    this.taskQueue.clear();
    this.emit('orchestrator:stopped');
  }

  public getAgentStatus(role: AgentRole): AgentStatus | undefined {
    return this.agents.get(role)?.status;
  }

  public getAllMetrics(): Map<AgentRole, unknown> {
    const metrics = new Map();

    for (const [role, agent] of this.agents) {
      metrics.set(role, agent.metrics);
    }

    return metrics;
  }

  private setupMessageBusListeners(): void {
    this.messageBus.on('message:published', (message) => {
      this.emit('message:published', message);
    });

    this.messageBus.on('message:undelivered', (message) => {
      this.emit('message:undelivered', message);
    });
  }
}
