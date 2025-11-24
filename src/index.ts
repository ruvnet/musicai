/**
 * Magic AI Music Box - Agent Swarm System
 * Main entry point
 */

import { AgentOrchestrator } from './core/AgentOrchestrator.js';
import { AgentFactory } from './factory/AgentFactory.js';
import { AgentRole, SwarmConfig, AgentTask, TaskPriority, AgentStatus } from './types/index.js';
import { AgentBooster } from './integrations/AgentBooster.js';
import { AgenticJujutsu } from './integrations/AgenticJujutsu.js';
import { Ruvector } from './integrations/Ruvector.js';
import { CoralTPU } from './integrations/CoralTPU.js';

export * from './types/index.js';
export * from './core/BaseAgent.js';
export * from './core/AgentOrchestrator.js';
export * from './core/MessageBus.js';
export * from './core/TaskQueue.js';
export * from './factory/AgentFactory.js';
export * from './integrations/AgentBooster.js';
export * from './integrations/AgenticJujutsu.js';
export * from './integrations/Ruvector.js';
export * from './integrations/AgenticSynth.js';
export * from './integrations/CoralTPU.js';
export * from './agents/DoctorAgent.js';
export * from './agents/StemManagerAgent.js';
export * from './agents/AudienceAgent.js';

export class AgentSwarm {
  private orchestrator: AgentOrchestrator;
  private agentBooster: AgentBooster;
  private jujutsu: AgenticJujutsu;
  private ruvector: Ruvector;
  private coralTPU: CoralTPU;

  constructor(config: SwarmConfig) {
    this.orchestrator = new AgentOrchestrator(config);

    // Initialize integrations
    this.agentBooster = new AgentBooster({ language: 'typescript' });
    this.jujutsu = new AgenticJujutsu({ repoPath: '.', branchPrefix: 'agent' });
    this.ruvector = new Ruvector({ dbPath: './data/ruvector.db', embeddingDim: 128 });
    this.coralTPU = new CoralTPU({
      preferTPU: true,
      fallbackToCPU: true,
      performanceMonitoring: true
    });

    this.setupEventListeners();
  }

  public async initialize(): Promise<void> {
    // Initialize Coral TPU with automatic detection and fallback
    await this.coralTPU.initialize();

    // Preload AI models for faster inference
    await this.coralTPU.preloadModel('stem_separation');
    await this.coralTPU.preloadModel('enhancement');
    await this.coralTPU.preloadModel('pitch_detection');

    // Create and register all 18 agents (15 original + 3 new: Doctor, StemManager, Audience)
    const agents = AgentFactory.createAllAgents();

    for (const agent of agents) {
      this.orchestrator.registerAgent(agent);
    }

    await this.orchestrator.start();

    console.log(`✓ Agent Swarm initialized with ${agents.length} concurrent agents`);
    console.log(this.coralTPU.getPerformanceReport());
  }

  public getCoralTPU(): CoralTPU {
    return this.coralTPU;
  }

  public async executeTask(
    role: AgentRole,
    action: string,
    parameters: Record<string, unknown> = {},
    priority: TaskPriority = TaskPriority.MEDIUM,
  ): Promise<unknown> {
    const task: AgentTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      role,
      action,
      parameters,
      priority,
      status: AgentStatus.IDLE,
      createdAt: Date.now(),
    };

    return await this.orchestrator.submitTask(task);
  }

  public async shutdown(): Promise<void> {
    await this.orchestrator.stop();
    console.log('✓ Agent Swarm shutdown complete');
  }

  public getMetrics(): Map<AgentRole, unknown> {
    return this.orchestrator.getAllMetrics();
  }

  public getAgentBooster(): AgentBooster {
    return this.agentBooster;
  }

  public getJujutsu(): AgenticJujutsu {
    return this.jujutsu;
  }

  public getRuvector(): Ruvector {
    return this.ruvector;
  }

  private setupEventListeners(): void {
    this.orchestrator.on('orchestrator:started', (data) => {
      console.log('🚀 Orchestrator started:', data);
    });

    this.orchestrator.on('agent:task:completed', (data) => {
      if (process.env.DEBUG) {
        console.log('✓ Task completed:', data);
      }
    });

    this.orchestrator.on('agent:task:failed', (data) => {
      console.error('✗ Task failed:', data);
    });
  }
}

// Default configuration
export const defaultConfig: SwarmConfig = {
  maxConcurrentAgents: 18,
  taskTimeout: 30000,
  retryAttempts: 3,
  enableLearning: true,
  enableMonitoring: true,
  logLevel: 'info',
};

// Main execution
export async function main(): Promise<void> {
  const swarm = new AgentSwarm(defaultConfig);

  await swarm.initialize();

  // Example: Execute tasks across different agents
  console.log('\n📊 Running example tasks...\n');

  // Audio analysis
  const audioResult = await swarm.executeTask(
    AgentRole.AUDIO_ANALYZER,
    'analyze_audio',
    { audioBuffer: 1024, sampleRate: 48000 },
    TaskPriority.HIGH,
  );
  console.log('Audio Analysis:', audioResult);

  // Pitch detection
  const pitchResult = await swarm.executeTask(AgentRole.PITCH_DETECTOR, 'detect_pitch', {
    algorithm: 'yin',
    audioData: 512,
  });
  console.log('Pitch Detection:', pitchResult);

  // Auto-tune correction
  const autotuneResult = await swarm.executeTask(AgentRole.AUTOTUNE_ENGINE, 'apply_correction', {
    pitch: 440,
    targetPitch: 444,
    strength: 75,
  });
  console.log('Autotune:', autotuneResult);

  // Performance monitoring
  const perfResult = await swarm.executeTask(AgentRole.PERFORMANCE_MONITOR, 'monitor_latency', {});
  console.log('Performance:', perfResult);

  // AST Analysis
  const astResult = await swarm.executeTask(AgentRole.AST_ANALYZER, 'analyze_ast', {
    code: 'function example() { return true; }',
  });
  console.log('AST Analysis:', astResult);

  // Simulation
  const simResult = await swarm.executeTask(AgentRole.SIMULATION_ENGINE, 'run_simulation', {
    scenario: 'high_load',
    iterations: 1000,
  });
  console.log('Simulation:', simResult);

  // Get all metrics
  console.log('\n📈 Agent Metrics:');
  const metrics = swarm.getMetrics();
  for (const [role, metric] of metrics) {
    console.log(`  ${role}:`, metric);
  }

  // Shutdown
  await swarm.shutdown();
}

// Run if this is the main module
// Commented out to avoid TypeScript module errors in test environment
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main().catch(console.error);
// }
