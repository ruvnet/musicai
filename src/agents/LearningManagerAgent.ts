import { BaseAgent } from '../core/BaseAgent.js';
import { AgentRole, AgentTask, AgentMessage, LearningPattern } from '../types/index.js';

export class LearningManagerAgent extends BaseAgent {
  private patterns: Map<string, LearningPattern> = new Map();

  constructor() {
    super(AgentRole.LEARNING_MANAGER, [
      {
        name: 'store_pattern',
        description: 'Store learning patterns in ruvector',
      },
      {
        name: 'retrieve_patterns',
        description: 'Retrieve similar patterns',
      },
      {
        name: 'update_preferences',
        description: 'Update user preferences',
      },
    ]);
  }

  protected async processTask(task: AgentTask): Promise<unknown> {
    switch (task.action) {
      case 'store_pattern':
        return this.storePattern(task.parameters);
      case 'retrieve_patterns':
        return this.retrievePatterns(task.parameters);
      case 'update_preferences':
        return this.updatePreferences(task.parameters);
      default:
        throw new Error(`Unknown action: ${task.action}`);
    }
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    this.emit('learning:updated', message.payload);
  }

  private async storePattern(_params: Record<string, unknown>): Promise<unknown> {
    const pattern: LearningPattern = {
      id: `pattern_${Date.now()}`,
      embedding: _params.embedding as number[],
      context: _params.context as Record<string, unknown>,
      feedback: _params.feedback as number,
      timestamp: Date.now(),
    };

    this.patterns.set(pattern.id, pattern);

    return {
      stored: true,
      patternId: pattern.id,
      totalPatterns: this.patterns.size,
    };
  }

  private async retrievePatterns(_params: Record<string, unknown>): Promise<unknown> {
    const { query, limit = 10 } = _params;

    // Mock similarity search
    const results = Array.from(this.patterns.values())
      .slice(0, limit as number)
      .map((pattern) => ({
        pattern,
        similarity: Math.random(),
      }));

    return {
      results,
      query,
      count: results.length,
    };
  }

  private async updatePreferences(_params: Record<string, unknown>): Promise<unknown> {
    return {
      updated: true,
      preferences: _params,
      timestamp: Date.now(),
    };
  }
}
