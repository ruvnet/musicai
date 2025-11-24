import PQueue from 'p-queue';
import { AgentTask, TaskPriority } from '../types/index.js';

export interface ITaskQueue {
  enqueue(task: AgentTask): Promise<void>;
  dequeue(): Promise<AgentTask | undefined>;
  size(): number;
  clear(): void;
}

export class TaskQueue implements ITaskQueue {
  private queue: PQueue;
  private tasks: Map<string, AgentTask> = new Map();

  constructor(concurrency: number = 15) {
    this.queue = new PQueue({ concurrency });
  }

  public async enqueue(task: AgentTask): Promise<void> {
    this.tasks.set(task.id, task);

    const priority = this.getPriorityValue(task.priority);

    await this.queue.add(
      async () => {
        // Task will be processed by agent
        return task;
      },
      { priority },
    );
  }

  public async dequeue(): Promise<AgentTask | undefined> {
    if (this.tasks.size === 0) {
      return undefined;
    }

    const taskId = this.tasks.keys().next().value as string | undefined;
    if (!taskId) {
      return undefined;
    }

    const task = this.tasks.get(taskId);

    if (task) {
      this.tasks.delete(taskId);
    }

    return task;
  }

  public size(): number {
    return this.tasks.size;
  }

  public clear(): void {
    this.queue.clear();
    this.tasks.clear();
  }

  private getPriorityValue(priority: TaskPriority): number {
    return -priority; // Negate for PQueue (higher number = higher priority)
  }
}
