import { BaseAgent } from '../../core/BaseAgent.js';
import { AgentRole, AgentTask, AgentMessage, AgentStatus, TaskPriority } from '../../types/index.js';

// Mock implementation for testing
class TestAgent extends BaseAgent {
  constructor() {
    super(AgentRole.AUDIO_ANALYZER, [{ name: 'test', description: 'Test capability' }]);
  }

  protected async processTask(task: AgentTask): Promise<unknown> {
    // Add small delay to ensure measurable execution time
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { success: true, taskId: task.id };
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    this.emit('test:message', message);
  }
}

describe('BaseAgent - London School TDD', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  afterEach(() => {
    agent.removeAllListeners();
  });

  describe('initialization', () => {
    it('should initialize with correct role and capabilities', () => {
      expect(agent.role).toBe(AgentRole.AUDIO_ANALYZER);
      expect(agent.capabilities).toHaveLength(1);
      expect(agent.capabilities[0].name).toBe('test');
    });

    it('should have idle status initially', () => {
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should emit initialized event', async () => {
      const listener = jest.fn();
      agent.on('initialized', listener);

      await agent.initialize();

      expect(listener).toHaveBeenCalledWith({ role: AgentRole.AUDIO_ANALYZER });
    });
  });

  describe('task execution', () => {
    it('should execute task successfully', async () => {
      const task: AgentTask = {
        id: 'task-1',
        role: AgentRole.AUDIO_ANALYZER,
        action: 'test',
        parameters: {},
        priority: TaskPriority.MEDIUM,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result = await agent.execute(task);

      expect(result).toEqual({ success: true, taskId: 'task-1' });
      expect(agent.metrics.taskCount).toBe(1);
      expect(agent.metrics.successCount).toBe(1);
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should emit task:started event', async () => {
      const listener = jest.fn();
      agent.on('task:started', listener);

      const task: AgentTask = {
        id: 'task-1',
        role: AgentRole.AUDIO_ANALYZER,
        action: 'test',
        parameters: {},
        priority: TaskPriority.MEDIUM,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      await agent.execute(task);

      expect(listener).toHaveBeenCalledWith({ task });
    });

    it('should emit task:completed event', async () => {
      const listener = jest.fn();
      agent.on('task:completed', listener);

      const task: AgentTask = {
        id: 'task-1',
        role: AgentRole.AUDIO_ANALYZER,
        action: 'test',
        parameters: {},
        priority: TaskPriority.MEDIUM,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      const result = await agent.execute(task);

      expect(listener).toHaveBeenCalledWith({ task, result });
    });

    it('should update metrics after successful task', async () => {
      const task: AgentTask = {
        id: 'task-1',
        role: AgentRole.AUDIO_ANALYZER,
        action: 'test',
        parameters: {},
        priority: TaskPriority.MEDIUM,
        status: AgentStatus.IDLE,
        createdAt: Date.now(),
      };

      await agent.execute(task);

      expect(agent.metrics.taskCount).toBe(1);
      expect(agent.metrics.successCount).toBe(1);
      expect(agent.metrics.errorCount).toBe(0);
      expect(agent.metrics.averageExecutionTime).toBeGreaterThan(0);
    });
  });

  describe('message handling', () => {
    it('should handle messages', async () => {
      const listener = jest.fn();
      agent.on('test:message', listener);

      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.PITCH_DETECTOR,
        to: AgentRole.AUDIO_ANALYZER,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await agent.handleMessage(message);

      expect(listener).toHaveBeenCalledWith(message);
    });

    it('should emit message:received event', async () => {
      const listener = jest.fn();
      agent.on('message:received', listener);

      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.PITCH_DETECTOR,
        to: AgentRole.AUDIO_ANALYZER,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await agent.handleMessage(message);

      expect(listener).toHaveBeenCalledWith({ message });
    });
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      const listener = jest.fn();
      agent.on('shutdown', listener);

      await agent.shutdown();

      expect(listener).toHaveBeenCalledWith({ role: AgentRole.AUDIO_ANALYZER });
      expect(agent.status).toBe(AgentStatus.IDLE);
    });
  });
});
