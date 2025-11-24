/**
 * Core types for the Agent Swarm system
 */

export enum AgentRole {
  ORCHESTRATOR = 'orchestrator',
  AUDIO_ANALYZER = 'audio_analyzer',
  PITCH_DETECTOR = 'pitch_detector',
  AUTOTUNE_ENGINE = 'autotune_engine',
  AI_ENHANCER = 'ai_enhancer',
  LEARNING_MANAGER = 'learning_manager',
  PERFORMANCE_MONITOR = 'performance_monitor',
  CODE_GENERATOR = 'code_generator',
  TEST_RUNNER = 'test_runner',
  AST_ANALYZER = 'ast_analyzer',
  VERSION_CONTROLLER = 'version_controller',
  SIMULATION_ENGINE = 'simulation_engine',
  OPTIMIZATION_AGENT = 'optimization_agent',
  INTEGRATION_AGENT = 'integration_agent',
  DEPLOYMENT_AGENT = 'deployment_agent',
  DOCTOR = 'doctor',
  STEM_MANAGER = 'stem_manager',
  AUDIENCE = 'audience',
  AUDIO_IO = 'audio_io',
  MIXER = 'mixer',
  MONITORING = 'monitoring',
}

export enum AgentStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  BUSY = 'busy',
  ERROR = 'error',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export interface AgentCapability {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: 'request' | 'response' | 'notification' | 'error';
  payload: unknown;
  timestamp: number;
  priority: TaskPriority;
}

export interface AgentTask {
  id: string;
  role: AgentRole;
  action: string;
  parameters: Record<string, unknown>;
  priority: TaskPriority;
  status: AgentStatus;
  result?: unknown;
  error?: Error;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface AgentMetrics {
  taskCount: number;
  successCount: number;
  errorCount: number;
  averageExecutionTime: number;
  lastActive: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

export interface SwarmConfig {
  maxConcurrentAgents: number;
  taskTimeout: number;
  retryAttempts: number;
  enableLearning: boolean;
  enableMonitoring: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface LearningPattern {
  id: string;
  embedding: number[];
  context: Record<string, unknown>;
  feedback: number;
  timestamp: number;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}
