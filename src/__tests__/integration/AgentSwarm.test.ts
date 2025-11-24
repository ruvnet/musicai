import { AgentSwarm, defaultConfig } from '../../index.js';
import { AgentRole, TaskPriority } from '../../types/index.js';

describe('AgentSwarm Integration Tests - London School TDD', () => {
  let swarm: AgentSwarm;

  beforeEach(async () => {
    swarm = new AgentSwarm(defaultConfig);
    await swarm.initialize();
  });

  afterEach(async () => {
    await swarm.shutdown();
  });

  describe('full workflow', () => {
    it('should execute audio processing pipeline', async () => {
      // Step 1: Analyze audio
      const audioAnalysis = await swarm.executeTask(
        AgentRole.AUDIO_ANALYZER,
        'analyze_audio',
        { audioBuffer: 1024, sampleRate: 48000 },
        TaskPriority.HIGH,
      );

      expect(audioAnalysis).toHaveProperty('pitch');
      expect(audioAnalysis).toHaveProperty('quality');

      // Step 2: Detect pitch
      const pitchDetection = await swarm.executeTask(AgentRole.PITCH_DETECTOR, 'detect_pitch', {
        algorithm: 'yin',
        audioData: 512,
      });

      expect(pitchDetection).toHaveProperty('frequency');
      expect(pitchDetection).toHaveProperty('confidence');

      // Step 3: Apply auto-tune
      const autotune = await swarm.executeTask(AgentRole.AUTOTUNE_ENGINE, 'apply_correction', {
        pitch: 440,
        targetPitch: 444,
        strength: 75,
      });

      expect(autotune).toHaveProperty('correctedPitch');
    });

    it('should handle concurrent tasks across agents', async () => {
      const tasks = [
        swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', {
          audioBuffer: 1024,
          sampleRate: 48000,
        }),
        swarm.executeTask(AgentRole.PITCH_DETECTOR, 'detect_pitch', {
          algorithm: 'yin',
          audioData: 512,
        }),
        swarm.executeTask(AgentRole.PERFORMANCE_MONITOR, 'monitor_latency', {}),
        swarm.executeTask(AgentRole.AI_ENHANCER, 'score_quality', {}),
      ];

      const results = await Promise.all(tasks);

      expect(results).toHaveLength(4);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('code generation and testing workflow', () => {
    it('should generate, test, and commit code', async () => {
      // Step 1: Generate code
      const codeGen = await swarm.executeTask(AgentRole.CODE_GENERATOR, 'generate_code', {
        spec: 'audio processor',
        language: 'rust',
      });

      expect(codeGen).toHaveProperty('code');

      // Step 2: Run tests
      const testResults = await swarm.executeTask(AgentRole.TEST_RUNNER, 'run_tests', {
        testSuite: 'all',
      });

      expect(testResults).toHaveProperty('passed');
      expect(testResults).toHaveProperty('failed');

      // Step 3: Commit changes
      const versionControl = await swarm.executeTask(AgentRole.VERSION_CONTROLLER, 'commit_changes', {
        message: 'Add audio processor',
        files: ['src/audio.rs'],
      });

      expect(versionControl).toHaveProperty('commitHash');
    });
  });

  describe('learning and optimization workflow', () => {
    it('should store patterns, simulate, and optimize', async () => {
      // Step 1: Store learning pattern
      const pattern = await swarm.executeTask(AgentRole.LEARNING_MANAGER, 'store_pattern', {
        embedding: new Array(128).fill(0).map(() => Math.random()),
        context: { type: 'audio_correction', strength: 75 },
        feedback: 0.9,
      });

      expect(pattern).toHaveProperty('patternId');

      // Step 2: Run simulation
      const simulation = await swarm.executeTask(AgentRole.SIMULATION_ENGINE, 'run_simulation', {
        scenario: 'high_load',
        iterations: 1000,
      });

      expect(simulation).toHaveProperty('results');

      // Step 3: Optimize
      const optimization = await swarm.executeTask(
        AgentRole.OPTIMIZATION_AGENT,
        'optimize_performance',
        {},
      );

      expect(optimization).toHaveProperty('optimizations');
    });
  });

  describe('integration and deployment workflow', () => {
    it('should integrate and deploy system', async () => {
      // Step 1: Integrate component
      const integration = await swarm.executeTask(AgentRole.INTEGRATION_AGENT, 'integrate_component', {
        component: 'audio_enhancer',
        dependencies: ['audio_analyzer', 'pitch_detector'],
      });

      expect(integration).toHaveProperty('integrated');
      expect(integration).toHaveProperty('testsGenerated');

      // Step 2: Deploy
      const deployment = await swarm.executeTask(AgentRole.DEPLOYMENT_AGENT, 'deploy_system', {
        environment: 'production',
        version: '1.0.0',
      });

      expect(deployment).toHaveProperty('deployed');
      expect(deployment).toHaveProperty('deploymentId');

      // Step 3: Health check
      const health = await swarm.executeTask(AgentRole.DEPLOYMENT_AGENT, 'health_check', {});

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('services');
    });
  });

  describe('metrics and monitoring', () => {
    it('should collect metrics from all agents', async () => {
      // Execute some tasks
      await swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', {
        audioBuffer: 1024,
        sampleRate: 48000,
      });

      const metrics = swarm.getMetrics();

      expect(metrics.size).toBeGreaterThan(0);
      expect(metrics.has(AgentRole.AUDIO_ANALYZER)).toBe(true);

      const analyzerMetrics = metrics.get(AgentRole.AUDIO_ANALYZER);
      expect(analyzerMetrics).toHaveProperty('taskCount');
      expect(analyzerMetrics).toHaveProperty('successCount');
    });
  });

  describe('integrations', () => {
    it('should access AgentBooster integration', () => {
      const booster = swarm.getAgentBooster();
      expect(booster).toBeDefined();
    });

    it('should access Jujutsu integration', () => {
      const jujutsu = swarm.getJujutsu();
      expect(jujutsu).toBeDefined();
    });

    it('should access Ruvector integration', () => {
      const ruvector = swarm.getRuvector();
      expect(ruvector).toBeDefined();
    });
  });
});
