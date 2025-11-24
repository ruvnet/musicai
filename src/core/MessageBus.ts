import EventEmitter from 'eventemitter3';
import { AgentMessage, AgentRole } from '../types/index.js';

export interface IMessageBus {
  publish(message: AgentMessage): Promise<void>;
  subscribe(role: AgentRole, handler: (message: AgentMessage) => Promise<void>): void;
  unsubscribe(role: AgentRole): void;
}

export class MessageBus extends EventEmitter implements IMessageBus {
  private subscribers: Map<AgentRole, (message: AgentMessage) => Promise<void>> = new Map();
  private messageQueue: AgentMessage[] = [];

  public async publish(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    this.emit('message:published', message);

    if (message.to === 'broadcast') {
      await this.broadcast(message);
    } else {
      await this.deliver(message);
    }
  }

  public subscribe(role: AgentRole, handler: (message: AgentMessage) => Promise<void>): void {
    this.subscribers.set(role, handler);
    this.emit('agent:subscribed', { role });
  }

  public unsubscribe(role: AgentRole): void {
    this.subscribers.delete(role);
    this.emit('agent:unsubscribed', { role });
  }

  private async broadcast(message: AgentMessage): Promise<void> {
    const deliveries = Array.from(this.subscribers.entries())
      .filter(([role]) => role !== message.from)
      .map(([, handler]) => handler(message));

    await Promise.all(deliveries);
  }

  private async deliver(message: AgentMessage): Promise<void> {
    const handler = this.subscribers.get(message.to as AgentRole);
    if (handler) {
      await handler(message);
    } else {
      this.emit('message:undelivered', message);
    }
  }

  public getQueueSize(): number {
    return this.messageQueue.length;
  }

  public clearQueue(): void {
    this.messageQueue = [];
  }
}
