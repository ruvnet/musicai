import { DoctorAgent } from '../../agents/DoctorAgent.js';
import { AgentRole, AgentTask, AgentStatus, TaskPriority } from '../../types/index.js';

describe('DoctorAgent', () => {
  let agent: DoctorAgent;

  beforeEach(() => {
    agent = new DoctorAgent();
  });

  afterEach(async () => {
    await agent.shutdown();
  });

  describe('initialization', () => {
    it('should initialize with correct role', () => {
      expect(agent.role).toBe(AgentRole.DOCTOR);
    });

    it('should have all required capabilities', () => {
      const capabilities = agent.capabilities;
      const actionNames = capabilities.map((c) => c.name);

      expect(actionNames).toContain('check_health');
      expect(actionNames).toContain('diagnose');
      expect(actionNames).toContain('check_audio_devices');
      expect(actionNames).toContain('check_agents');
      expect(actionNames).toContain('generate_report');
      expect(actionNames).toContain('recommend');
    });
  });

  describe('check_health action', () => {
    it('should check overall system health', async () => {
      const task: AgentTask = {
        id: 'task_1',
        role: AgentRole.DOCTOR,
        action: 'check_health',
        parameters: {},
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.checks.cpu).toBeDefined();
      expect(result.checks.memory).toBeDefined();
      expect(result.checks.audio).toBeDefined();
      expect(result.checks.agents).toBeDefined();
      expect(result.checks.learning).toBeDefined();
    });

    it('should return healthy status when all checks pass', async () => {
      const task: AgentTask = {
        id: 'task_2',
        role: AgentRole.DOCTOR,
        action: 'check_health',
        parameters: {},
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result.status).toBe('healthy');
      expect(result.uptime).toBeGreaterThan(0);
    });
  });

  describe('diagnose action', () => {
    it('should diagnose audio dropout symptom', async () => {
      const task: AgentTask = {
        id: 'task_3',
        role: AgentRole.DOCTOR,
        action: 'diagnose',
        parameters: { symptoms: ['audio_dropout'] },
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result.findings).toBeDefined();
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].symptom).toBe('audio_dropout');
      expect(result.findings[0].severity).toBe('high');
      expect(result.recommendations).toBeDefined();
    });

    it('should handle multiple symptoms', async () => {
      const task: AgentTask = {
        id: 'task_4',
        role: AgentRole.DOCTOR,
        action: 'diagnose',
        parameters: { symptoms: ['audio_dropout', 'high_latency', 'poor_quality'] },
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result.findings.length).toBe(3);
      expect(result.severity).toBe('high');
    });
  });

  describe('check_audio_devices action', () => {
    it('should check audio device configuration', async () => {
      const task: AgentTask = {
        id: 'task_5',
        role: AgentRole.DOCTOR,
        action: 'check_audio_devices',
        parameters: {},
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result.devices).toBeDefined();
      expect(result.devices.input).toBeDefined();
      expect(result.devices.output).toBeDefined();
      expect(result.devices.input.sampleRate).toBe(48000);
      expect(result.devices.input.status).toBe('connected');
    });
  });

  describe('check_agents action', () => {
    it('should check agent swarm health', async () => {
      const task: AgentTask = {
        id: 'task_6',
        role: AgentRole.DOCTOR,
        action: 'check_agents',
        parameters: { agentCount: 18 },
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result.totalAgents).toBe(18);
      expect(result.activeAgents).toBe(18);
      expect(result.failedAgents).toBe(0);
      expect(result.status).toBe('ok');
    });
  });

  describe('generate_report action', () => {
    it('should generate comprehensive diagnostic report', async () => {
      const task: AgentTask = {
        id: 'task_7',
        role: AgentRole.DOCTOR,
        action: 'generate_report',
        parameters: {},
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result.summary).toBeDefined();
      expect(result.systemHealth).toBeDefined();
      expect(result.audioDevices).toBeDefined();
      expect(result.agentHealth).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('recommend action', () => {
    it('should recommend optimizations for high CPU', async () => {
      const task: AgentTask = {
        id: 'task_8',
        role: AgentRole.DOCTOR,
        action: 'recommend',
        parameters: { currentPerformance: { cpu: 65, latency: 5 } },
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].category).toBe('performance');
      expect(result.recommendations[0].priority).toBe('high');
    });

    it('should recommend optimizations for high latency', async () => {
      const task: AgentTask = {
        id: 'task_9',
        role: AgentRole.DOCTOR,
        action: 'recommend',
        parameters: { currentPerformance: { cpu: 40, latency: 12 } },
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result: any = await agent.executeTask(task);

      const latencyRec = result.recommendations.find((r: any) => r.category === 'latency');
      expect(latencyRec).toBeDefined();
      expect(latencyRec.priority).toBe('medium');
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown action', async () => {
      const task: AgentTask = {
        id: 'task_10',
        role: AgentRole.DOCTOR,
        action: 'unknown_action',
        parameters: {},
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      await expect(agent.executeTask(task)).rejects.toThrow('Unknown action: unknown_action');
    });
  });

  describe('metrics tracking', () => {
    it('should record metrics for task execution', async () => {
      const task: AgentTask = {
        id: 'task_11',
        role: AgentRole.DOCTOR,
        action: 'check_health',
        parameters: {},
        priority: TaskPriority.HIGH,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      await agent.executeTask(task);

      const metrics = agent.getMetrics();
      expect(metrics.taskCount).toBeGreaterThan(0);
    });
  });
});
