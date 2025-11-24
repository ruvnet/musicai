import { MessageBus } from '../../core/MessageBus.js';
import { AgentRole, AgentMessage, TaskPriority } from '../../types/index.js';

describe('MessageBus - London School TDD', () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = new MessageBus();
  });

  afterEach(() => {
    messageBus.removeAllListeners();
  });

  describe('subscription', () => {
    it('should subscribe agent to message bus', () => {
      const handler = jest.fn();
      const listener = jest.fn();

      messageBus.on('agent:subscribed', listener);
      messageBus.subscribe(AgentRole.AUDIO_ANALYZER, handler);

      expect(listener).toHaveBeenCalledWith({ role: AgentRole.AUDIO_ANALYZER });
    });

    it('should unsubscribe agent from message bus', () => {
      const handler = jest.fn();
      const listener = jest.fn();

      messageBus.subscribe(AgentRole.AUDIO_ANALYZER, handler);
      messageBus.on('agent:unsubscribed', listener);
      messageBus.unsubscribe(AgentRole.AUDIO_ANALYZER);

      expect(listener).toHaveBeenCalledWith({ role: AgentRole.AUDIO_ANALYZER });
    });
  });

  describe('message publishing', () => {
    it('should publish message to specific agent', async () => {
      const handler = jest.fn();
      messageBus.subscribe(AgentRole.AUDIO_ANALYZER, handler);

      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.PITCH_DETECTOR,
        to: AgentRole.AUDIO_ANALYZER,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await messageBus.publish(message);

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should broadcast message to all agents', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      messageBus.subscribe(AgentRole.AUDIO_ANALYZER, handler1);
      messageBus.subscribe(AgentRole.PITCH_DETECTOR, handler2);

      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.AUTOTUNE_ENGINE,
        to: 'broadcast',
        type: 'notification',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await messageBus.publish(message);

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });

    it('should not send broadcast to sender', async () => {
      const handler = jest.fn();
      messageBus.subscribe(AgentRole.AUDIO_ANALYZER, handler);

      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.AUDIO_ANALYZER,
        to: 'broadcast',
        type: 'notification',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await messageBus.publish(message);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit message:published event', async () => {
      const listener = jest.fn();
      messageBus.on('message:published', listener);

      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.PITCH_DETECTOR,
        to: AgentRole.AUDIO_ANALYZER,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await messageBus.publish(message);

      expect(listener).toHaveBeenCalledWith(message);
    });

    it('should emit message:undelivered for unknown recipient', async () => {
      const listener = jest.fn();
      messageBus.on('message:undelivered', listener);

      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.PITCH_DETECTOR,
        to: AgentRole.AUDIO_ANALYZER,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await messageBus.publish(message);

      expect(listener).toHaveBeenCalledWith(message);
    });
  });

  describe('queue management', () => {
    it('should track queue size', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.PITCH_DETECTOR,
        to: AgentRole.AUDIO_ANALYZER,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await messageBus.publish(message);

      expect(messageBus.getQueueSize()).toBe(1);
    });

    it('should clear queue', async () => {
      const message: AgentMessage = {
        id: 'msg-1',
        from: AgentRole.PITCH_DETECTOR,
        to: AgentRole.AUDIO_ANALYZER,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now(),
        priority: TaskPriority.MEDIUM,
      };

      await messageBus.publish(message);
      messageBus.clearQueue();

      expect(messageBus.getQueueSize()).toBe(0);
    });
  });
});
