// Mock p-queue before imports
jest.mock('p-queue', () => {
  return {
    __esModule: true,
    default: class MockPQueue {
      add = jest.fn().mockResolvedValue(undefined);
      clear = jest.fn();
      size = 0;
    },
  };
});

import { AgentOrchestrator } from '../../core/AgentOrchestrator.js';
import { BaseAgent } from '../../core/BaseAgent.js';
import {
  AgentRole,
  AgentTask,
  AgentStatus,
  TaskPriority,
  SwarmConfig,
  AgentMessage,
} from '../../types/index.js';

// Mock agent for testing
class MockAgent extends BaseAgent {
  constructor(role: AgentRole) {
    super(role, []);
  }

  protected async processTask(_task: AgentTask): Promise<unknown> {
    return { success: true };
  }

  protected async processMessage(_message: AgentMessage): Promise<void> {
    return;
  }
}

describe('AgentOrchestrator - London School TDD', () => {
  let orchestrator: AgentOrchestrator;
  let config: SwarmConfig;

  beforeEach(() => {
    config = {
      maxConcurrentAgents: 15,
      taskTimeout: 5000,
      retryAttempts: 3,
      enableLearning: true,
      enableMonitoring: true,
      logLevel: 'info',
    };

    orchestrator = new AgentOrchestrator(config);
  });

  afterEach(() => {
    orchestrator.removeAllListeners();
  });

  describe('agent registration', () => {
    it('should register an agent', () => {
      const agent = new MockAgent(AgentRole.AUDIO_ANALYZER);
      const listener = jest.fn();

      orchestrator.on('agent:registered', listener);
      orchestrator.registerAgent(agent);

      expect(listener).toHaveBeenCalledWith({ role: AgentRole.AUDIO_ANALYZER });
    });

    it('should unregister an agent', () => {
      const agent = new MockAgent(AgentRole.AUDIO_ANALYZER);
      const listener = jest.fn();

      orchestrator.registerAgent(agent);
      orchestrator.on('agent:unregistered', listener);
      orchestrator.unregisterAgent(AgentRole.AUDIO_ANALYZER);

      expect(listener).toHaveBeenCalledWith({ role: AgentRole.AUDIO_ANALYZER });
    });

    it('should get agent status', () => {
      const agent = new MockAgent(AgentRole.AUDIO_ANALYZER);
      orchestrator.registerAgent(agent);

      const status = orchestrator.getAgentStatus(AgentRole.AUDIO_ANALYZER);
      expect(status).toBe(AgentStatus.IDLE);
    });
  });

  describe('task submission', () => {
    it('should submit and execute task', async () => {
      const agent = new MockAgent(AgentRole.AUDIO_ANALYZER);
      orchestrator.registerAgent(agent);
      await orchestrator.start();

      const task: AgentTask = {
        id: 'task-1',
        role: AgentRole.AUDIO_ANALYZER,
        action: 'test',
        parameters: {},
        priority: TaskPriority.MEDIUM,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result = await orchestrator.submitTask(task);
      expect(result).toEqual({ success: true });
    });

    it('should emit task:completed event', async () => {
      const agent = new MockAgent(AgentRole.AUDIO_ANALYZER);
      orchestrator.registerAgent(agent);
      await orchestrator.start();

      const listener = jest.fn();
      orchestrator.on('task:completed', listener);

      const task: AgentTask = {
        id: 'task-1',
        role: AgentRole.AUDIO_ANALYZER,
        action: 'test',
        parameters: {},
        priority: TaskPriority.MEDIUM,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      await orchestrator.submitTask(task);
      expect(listener).toHaveBeenCalled();
    });

    it('should throw error for unknown agent', async () => {
      const task: AgentTask = {
        id: 'task-1',
        role: AgentRole.AUDIO_ANALYZER,
        action: 'test',
        parameters: {},
        priority: TaskPriority.MEDIUM,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      await expect(orchestrator.submitTask(task)).rejects.toThrow();
    });
  });

  describe('orchestrator lifecycle', () => {
    it('should start orchestrator', async () => {
      const listener = jest.fn();
      orchestrator.on('orchestrator:started', listener);

      await orchestrator.start();

      expect(listener).toHaveBeenCalledWith({
        agentCount: 0,
        config,
      });
    });

    it('should stop orchestrator', async () => {
      const listener = jest.fn();
      orchestrator.on('orchestrator:stopped', listener);

      await orchestrator.start();
      await orchestrator.stop();

      expect(listener).toHaveBeenCalled();
    });

    it('should initialize all agents on start', async () => {
      const agent1 = new MockAgent(AgentRole.AUDIO_ANALYZER);
      const agent2 = new MockAgent(AgentRole.PITCH_DETECTOR);

      const initSpy1 = jest.spyOn(agent1, 'initialize');
      const initSpy2 = jest.spyOn(agent2, 'initialize');

      orchestrator.registerAgent(agent1);
      orchestrator.registerAgent(agent2);

      await orchestrator.start();

      expect(initSpy1).toHaveBeenCalled();
      expect(initSpy2).toHaveBeenCalled();
    });
  });

  describe('metrics', () => {
    it('should get all agent metrics', () => {
      const agent = new MockAgent(AgentRole.AUDIO_ANALYZER);
      orchestrator.registerAgent(agent);

      const metrics = orchestrator.getAllMetrics();

      expect(metrics.size).toBe(1);
      expect(metrics.has(AgentRole.AUDIO_ANALYZER)).toBe(true);
    });
  });
});
