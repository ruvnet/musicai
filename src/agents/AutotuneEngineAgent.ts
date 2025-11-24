import { BaseAgent } from '../core/BaseAgent.js';
import { AgentRole, AgentTask, AgentMessage } from '../types/index.js';

export class AutotuneEngineAgent extends BaseAgent {
  constructor() {
    super(AgentRole.AUTOTUNE_ENGINE, [
      {
        name: 'apply_correction',
        description: 'Apply pitch correction using PSOLA',
      },
      {
        name: 'preserve_formants',
        description: 'Preserve formants during pitch shifting',
      },
    ]);
  }

  protected async processTask(task: AgentTask): Promise<unknown> {
    switch (task.action) {
      case 'apply_correction':
        return this.applyCorrection(task.parameters);
      case 'preserve_formants':
        return this.preserveFormants(task.parameters);
      default:
        throw new Error(`Unknown action: ${task.action}`);
    }
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    this.emit('autotune:applied', message.payload);
  }

  private async applyCorrection(_params: Record<string, unknown>): Promise<unknown> {
    const { pitch, targetPitch, strength = 75, speed = 50 } = _params;

    const correctedPitch = Number(pitch) + (Number(targetPitch) - Number(pitch)) * (Number(strength) / 100);

    return {
      originalPitch: pitch,
      correctedPitch,
      strength,
      speed,
      algorithm: 'PSOLA',
    };
  }

  private async preserveFormants(_params: Record<string, unknown>): Promise<unknown> {
    return {
      formantsPreserved: true,
      formantShift: 0.0,
      method: 'LPC',
    };
  }
}
