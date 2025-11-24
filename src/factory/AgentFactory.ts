import { IAgent } from '../core/BaseAgent.js';
import { AgentRole } from '../types/index.js';
import { AudioAnalyzerAgent } from '../agents/AudioAnalyzerAgent.js';
import { PitchDetectorAgent } from '../agents/PitchDetectorAgent.js';
import { AutotuneEngineAgent } from '../agents/AutotuneEngineAgent.js';
import { AIEnhancerAgent } from '../agents/AIEnhancerAgent.js';
import { LearningManagerAgent } from '../agents/LearningManagerAgent.js';
import { PerformanceMonitorAgent } from '../agents/PerformanceMonitorAgent.js';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent.js';
import { TestRunnerAgent } from '../agents/TestRunnerAgent.js';
import { ASTAnalyzerAgent } from '../agents/ASTAnalyzerAgent.js';
import { VersionControllerAgent } from '../agents/VersionControllerAgent.js';
import { SimulationEngineAgent } from '../agents/SimulationEngineAgent.js';
import { OptimizationAgent } from '../agents/OptimizationAgent.js';
import { IntegrationAgent } from '../agents/IntegrationAgent.js';
import { DeploymentAgent } from '../agents/DeploymentAgent.js';
import { DoctorAgent } from '../agents/DoctorAgent.js';
import { StemManagerAgent } from '../agents/StemManagerAgent.js';
import { AudienceAgent } from '../agents/AudienceAgent.js';

export class AgentFactory {
  public static createAgent(role: AgentRole): IAgent {
    switch (role) {
      case AgentRole.AUDIO_ANALYZER:
        return new AudioAnalyzerAgent();
      case AgentRole.PITCH_DETECTOR:
        return new PitchDetectorAgent();
      case AgentRole.AUTOTUNE_ENGINE:
        return new AutotuneEngineAgent();
      case AgentRole.AI_ENHANCER:
        return new AIEnhancerAgent();
      case AgentRole.LEARNING_MANAGER:
        return new LearningManagerAgent();
      case AgentRole.PERFORMANCE_MONITOR:
        return new PerformanceMonitorAgent();
      case AgentRole.CODE_GENERATOR:
        return new CodeGeneratorAgent();
      case AgentRole.TEST_RUNNER:
        return new TestRunnerAgent();
      case AgentRole.AST_ANALYZER:
        return new ASTAnalyzerAgent();
      case AgentRole.VERSION_CONTROLLER:
        return new VersionControllerAgent();
      case AgentRole.SIMULATION_ENGINE:
        return new SimulationEngineAgent();
      case AgentRole.OPTIMIZATION_AGENT:
        return new OptimizationAgent();
      case AgentRole.INTEGRATION_AGENT:
        return new IntegrationAgent();
      case AgentRole.DEPLOYMENT_AGENT:
        return new DeploymentAgent();
      case AgentRole.DOCTOR:
        return new DoctorAgent();
      case AgentRole.STEM_MANAGER:
        return new StemManagerAgent();
      case AgentRole.AUDIENCE:
        return new AudienceAgent();
      default:
        throw new Error(`Unknown agent role: ${role}`);
    }
  }

  public static createAllAgents(): IAgent[] {
    return [
      AgentRole.AUDIO_ANALYZER,
      AgentRole.PITCH_DETECTOR,
      AgentRole.AUTOTUNE_ENGINE,
      AgentRole.AI_ENHANCER,
      AgentRole.LEARNING_MANAGER,
      AgentRole.PERFORMANCE_MONITOR,
      AgentRole.CODE_GENERATOR,
      AgentRole.TEST_RUNNER,
      AgentRole.AST_ANALYZER,
      AgentRole.VERSION_CONTROLLER,
      AgentRole.SIMULATION_ENGINE,
      AgentRole.OPTIMIZATION_AGENT,
      AgentRole.INTEGRATION_AGENT,
      AgentRole.DEPLOYMENT_AGENT,
      AgentRole.DOCTOR,
      AgentRole.STEM_MANAGER,
      AgentRole.AUDIENCE,
    ].map((role) => this.createAgent(role));
  }
}
