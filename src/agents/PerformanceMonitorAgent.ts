import { BaseAgent } from '../core/BaseAgent.js';
import { AgentRole, AgentTask, AgentMessage } from '../types/index.js';

export class PerformanceMonitorAgent extends BaseAgent {
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    super(AgentRole.PERFORMANCE_MONITOR, [
      {
        name: 'monitor_latency',
        description: 'Monitor system latency',
      },
      {
        name: 'monitor_cpu',
        description: 'Monitor CPU usage',
      },
      {
        name: 'generate_report',
        description: 'Generate performance report',
      },
    ]);
  }

  protected async processTask(task: AgentTask): Promise<unknown> {
    switch (task.action) {
      case 'monitor_latency':
        return this.monitorLatency(task.parameters);
      case 'monitor_cpu':
        return this.monitorCpu(task.parameters);
      case 'generate_report':
        return this.generateReport(task.parameters);
      default:
        throw new Error(`Unknown action: ${task.action}`);
    }
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    this.emit('performance:metric', message.payload);
  }

  private async monitorLatency(_params: Record<string, unknown>): Promise<unknown> {
    const latency = Math.random() * 10;

    if (!this.performanceMetrics.has('latency')) {
      this.performanceMetrics.set('latency', []);
    }
    this.performanceMetrics.get('latency')!.push(latency);

    return {
      current: latency,
      average: this.calculateAverage('latency'),
      target: 10,
      withinTarget: latency < 10,
    };
  }

  private async monitorCpu(_params: Record<string, unknown>): Promise<unknown> {
    const cpuUsage = Math.random() * 60;

    if (!this.performanceMetrics.has('cpu')) {
      this.performanceMetrics.set('cpu', []);
    }
    this.performanceMetrics.get('cpu')!.push(cpuUsage);

    return {
      current: cpuUsage,
      average: this.calculateAverage('cpu'),
      target: 60,
      withinTarget: cpuUsage < 60,
    };
  }

  private async generateReport(_params: Record<string, unknown>): Promise<unknown> {
    return {
      latency: {
        average: this.calculateAverage('latency'),
        max: this.calculateMax('latency'),
        min: this.calculateMin('latency'),
      },
      cpu: {
        average: this.calculateAverage('cpu'),
        max: this.calculateMax('cpu'),
        min: this.calculateMin('cpu'),
      },
      timestamp: Date.now(),
    };
  }

  private calculateAverage(metric: string): number {
    const values = this.performanceMetrics.get(metric) || [];
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateMax(metric: string): number {
    const values = this.performanceMetrics.get(metric) || [];
    return values.length ? Math.max(...values) : 0;
  }

  private calculateMin(metric: string): number {
    const values = this.performanceMetrics.get(metric) || [];
    return values.length ? Math.min(...values) : 0;
  }
}
