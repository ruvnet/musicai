import { BaseAgent } from '../core/BaseAgent.js';
import { AgentRole, AgentTask, AgentMessage } from '../types/index.js';

export class VersionControllerAgent extends BaseAgent {
  constructor() {
    super(AgentRole.VERSION_CONTROLLER, [
      {
        name: 'commit_changes',
        description: 'Commit code changes',
      },
      {
        name: 'create_branch',
        description: 'Create new branch',
      },
      {
        name: 'merge_changes',
        description: 'Merge branches',
      },
    ]);
  }

  protected async processTask(task: AgentTask): Promise<unknown> {
    switch (task.action) {
      case 'commit_changes':
        return this.commitChanges(task.parameters);
      case 'create_branch':
        return this.createBranch(task.parameters);
      case 'merge_changes':
        return this.mergeChanges(task.parameters);
      default:
        throw new Error(`Unknown action: ${task.action}`);
    }
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    this.emit('version:updated', message.payload);
  }

  private async commitChanges(_params: Record<string, unknown>): Promise<unknown> {
    const { message, files } = _params;

    return {
      commitHash: `abc${Math.random().toString(36).substring(7)}`,
      message,
      filesChanged: Array.isArray(files) ? files.length : 0,
      timestamp: Date.now(),
    };
  }

  private async createBranch(_params: Record<string, unknown>): Promise<unknown> {
    const { branchName } = _params;

    return {
      branch: branchName,
      created: true,
      baseBranch: 'main',
      timestamp: Date.now(),
    };
  }

  private async mergeChanges(_params: Record<string, unknown>): Promise<unknown> {
    const { sourceBranch, targetBranch } = _params;

    return {
      merged: true,
      sourceBranch,
      targetBranch,
      conflicts: 0,
      timestamp: Date.now(),
    };
  }
}
