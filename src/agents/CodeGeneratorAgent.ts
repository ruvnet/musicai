import { BaseAgent } from '../core/BaseAgent.js';
import { AgentRole, AgentTask, AgentMessage } from '../types/index.js';

export class CodeGeneratorAgent extends BaseAgent {
  constructor() {
    super(AgentRole.CODE_GENERATOR, [
      {
        name: 'generate_code',
        description: 'Generate code based on specifications',
      },
      {
        name: 'refactor_code',
        description: 'Refactor existing code',
      },
    ]);
  }

  protected async processTask(task: AgentTask): Promise<unknown> {
    switch (task.action) {
      case 'generate_code':
        return this.generateCode(task.parameters);
      case 'refactor_code':
        return this.refactorCode(task.parameters);
      default:
        throw new Error(`Unknown action: ${task.action}`);
    }
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    this.emit('code:generated', message.payload);
  }

  private async generateCode(_params: Record<string, unknown>): Promise<unknown> {
    const { spec, language = 'typescript' } = _params;

    return {
      code: `// Generated code for: ${spec}\nfunction example() {\n  return true;\n}`,
      language,
      linesOfCode: 3,
      timestamp: Date.now(),
    };
  }

  private async refactorCode(_params: Record<string, unknown>): Promise<unknown> {
    const { code, optimizations } = _params;

    return {
      originalCode: code,
      refactoredCode: `// Refactored\n${code}`,
      improvements: optimizations,
      timestamp: Date.now(),
    };
  }
}
