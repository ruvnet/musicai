/**
 * Full System Demo - 15-Agent Swarm in Action
 * Demonstrates complete workflow with all agents
 */

import { AgentSwarm, defaultConfig, AgentRole, TaskPriority } from '../dist/index.js';

async function runFullSystemDemo() {
  console.log('🎵 Magic AI Music Box - Full System Demo');
  console.log('=' .repeat(60));
  console.log();

  // Initialize the swarm with 15 concurrent agents
  console.log('📦 Initializing 15-agent concurrent swarm...');
  const swarm = new AgentSwarm({
    ...defaultConfig,
    maxConcurrentAgents: 15,
    enableLearning: true,
    enableMonitoring: true,
  });

  await swarm.initialize();
  console.log('✅ All 15 agents initialized successfully\n');

  // Demo 1: Audio Processing Pipeline
  console.log('🎤 Demo 1: Complete Audio Processing Pipeline');
  console.log('-'.repeat(60));

  const audioBuffer = new Array(1024).fill(0).map(() => Math.sin(Math.random() * Math.PI * 2) * 0.5);

  // Step 1: Audio Analysis
  console.log('  1️⃣  Analyzing audio signal...');
  const audioAnalysis = await swarm.executeTask(
    AgentRole.AUDIO_ANALYZER,
    'analyze_audio',
    { audioBuffer, sampleRate: 48000 },
    TaskPriority.HIGH
  );
  console.log(`     ✓ Pitch: ${audioAnalysis.pitch}Hz, Quality: ${audioAnalysis.quality}`);

  // Step 2: Pitch Detection
  console.log('  2️⃣  Detecting pitch with YIN algorithm...');
  const pitchResult = await swarm.executeTask(
    AgentRole.PITCH_DETECTOR,
    'detect_pitch',
    { algorithm: 'yin', audioData: 512 }
  );
  console.log(`     ✓ Frequency: ${pitchResult.frequency}Hz, Confidence: ${pitchResult.confidence}`);

  // Step 3: Auto-tune Correction
  console.log('  3️⃣  Applying auto-tune correction...');
  const autotuneResult = await swarm.executeTask(
    AgentRole.AUTOTUNE_ENGINE,
    'apply_correction',
    { pitch: 440, targetPitch: 444, strength: 75 }
  );
  console.log(`     ✓ Corrected from ${autotuneResult.originalPitch}Hz to ${autotuneResult.correctedPitch}Hz`);

  // Step 4: AI Enhancement
  console.log('  4️⃣  Enhancing with AI...');
  const enhancement = await swarm.executeTask(
    AgentRole.AI_ENHANCER,
    'enhance_quality',
    { features: [0.1, 0.2, 0.3] }
  );
  console.log(`     ✓ Quality score: ${enhancement.qualityScore}, Enhanced: ${enhancement.enhanced}`);

  console.log();

  // Demo 2: Learning & Optimization
  console.log('🧠 Demo 2: Self-Learning and Optimization');
  console.log('-'.repeat(60));

  // Store learning pattern
  console.log('  1️⃣  Storing learning pattern in ruvector...');
  const pattern = await swarm.executeTask(
    AgentRole.LEARNING_MANAGER,
    'store_pattern',
    {
      embedding: new Array(128).fill(0).map(() => Math.random()),
      context: { type: 'auto_tune', strength: 75 },
      feedback: 0.92
    }
  );
  console.log(`     ✓ Pattern stored: ${pattern.patternId}, Total: ${pattern.totalPatterns}`);

  // Run simulation
  console.log('  2️⃣  Running performance simulation...');
  const simulation = await swarm.executeTask(
    AgentRole.SIMULATION_ENGINE,
    'run_simulation',
    { scenario: 'high_load', iterations: 1000 }
  );
  console.log(`     ✓ Avg Latency: ${simulation.results.avgLatency}ms, Success Rate: ${simulation.results.successRate * 100}%`);

  // Optimize
  console.log('  3️⃣  Optimizing system performance...');
  const optimization = await swarm.executeTask(
    AgentRole.OPTIMIZATION_AGENT,
    'optimize_performance',
    {}
  );
  console.log(`     ✓ Overall improvement: ${optimization.overallImprovement}`);
  optimization.optimizations.forEach((opt: any) => {
    console.log(`       - ${opt.area}: ${opt.improvement} improvement`);
  });

  console.log();

  // Demo 3: Development Workflow
  console.log('💻 Demo 3: Code Generation & Testing');
  console.log('-'.repeat(60));

  // Generate code
  console.log('  1️⃣  Generating code with AST analysis...');
  const codeGen = await swarm.executeTask(
    AgentRole.CODE_GENERATOR,
    'generate_code',
    { spec: 'audio processor', language: 'typescript' }
  );
  console.log(`     ✓ Generated ${codeGen.linesOfCode} lines of code`);

  // Analyze AST
  console.log('  2️⃣  Analyzing code structure...');
  const astAnalysis = await swarm.executeTask(
    AgentRole.AST_ANALYZER,
    'analyze_ast',
    { code: codeGen.code }
  );
  console.log(`     ✓ Complexity: ${astAnalysis.complexity}, Functions: ${astAnalysis.functions}, Classes: ${astAnalysis.classes}`);

  // Run tests
  console.log('  3️⃣  Running test suite...');
  const testResults = await swarm.executeTask(
    AgentRole.TEST_RUNNER,
    'run_tests',
    { testSuite: 'all' }
  );
  console.log(`     ✓ Tests: ${testResults.passed} passed, ${testResults.failed} failed (${testResults.duration}ms)`);

  // Version control
  console.log('  4️⃣  Committing changes...');
  const commit = await swarm.executeTask(
    AgentRole.VERSION_CONTROLLER,
    'commit_changes',
    { message: 'Add audio processor', files: ['src/audio.ts'] }
  );
  console.log(`     ✓ Commit: ${commit.commitHash}`);

  console.log();

  // Demo 4: Concurrent Operations
  console.log('⚡ Demo 4: Concurrent Multi-Agent Operations');
  console.log('-'.repeat(60));

  console.log('  Running 10 concurrent tasks across all agents...');
  const startTime = Date.now();

  const concurrentTasks = await Promise.all([
    swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', { audioBuffer: 1024, sampleRate: 48000 }),
    swarm.executeTask(AgentRole.PITCH_DETECTOR, 'detect_pitch', { algorithm: 'yin' }),
    swarm.executeTask(AgentRole.AUTOTUNE_ENGINE, 'apply_correction', { pitch: 440, targetPitch: 444 }),
    swarm.executeTask(AgentRole.AI_ENHANCER, 'score_quality', {}),
    swarm.executeTask(AgentRole.PERFORMANCE_MONITOR, 'monitor_latency', {}),
    swarm.executeTask(AgentRole.PERFORMANCE_MONITOR, 'monitor_cpu', {}),
    swarm.executeTask(AgentRole.SIMULATION_ENGINE, 'run_simulation', { scenario: 'low_load', iterations: 100 }),
    swarm.executeTask(AgentRole.OPTIMIZATION_AGENT, 'reduce_latency', {}),
    swarm.executeTask(AgentRole.INTEGRATION_AGENT, 'integrate_component', { component: 'audio_module' }),
    swarm.executeTask(AgentRole.DEPLOYMENT_AGENT, 'health_check', {}),
  ]);

  const executionTime = Date.now() - startTime;
  console.log(`  ✅ All 10 tasks completed in ${executionTime}ms`);
  console.log(`  📊 Throughput: ${(10000 / executionTime).toFixed(2)} tasks/second`);

  console.log();

  // Demo 5: Performance Metrics
  console.log('📊 Demo 5: System Metrics & Health');
  console.log('-'.repeat(60));

  // Generate performance report
  const perfReport = await swarm.executeTask(
    AgentRole.PERFORMANCE_MONITOR,
    'generate_report',
    {}
  );

  console.log('  Latency Metrics:');
  console.log(`    - Average: ${perfReport.latency.average.toFixed(2)}ms`);
  console.log(`    - Max: ${perfReport.latency.max.toFixed(2)}ms`);
  console.log(`    - Min: ${perfReport.latency.min.toFixed(2)}ms`);

  console.log('  CPU Metrics:');
  console.log(`    - Average: ${perfReport.cpu.average.toFixed(2)}%`);
  console.log(`    - Max: ${perfReport.cpu.max.toFixed(2)}%`);
  console.log(`    - Min: ${perfReport.cpu.min.toFixed(2)}%`);

  // System health check
  const health = await swarm.executeTask(
    AgentRole.DEPLOYMENT_AGENT,
    'health_check',
    {}
  );

  console.log('  System Health:');
  console.log(`    - Status: ${health.status}`);
  console.log(`    - Uptime: ${health.uptime}%`);
  console.log('    - Services:');
  Object.entries(health.services).forEach(([service, status]) => {
    console.log(`      * ${service}: ${status}`);
  });

  console.log();

  // Demo 6: Agent Metrics
  console.log('📈 Demo 6: Individual Agent Metrics');
  console.log('-'.repeat(60));

  const metrics = swarm.getMetrics();
  console.log(`  Total Agents: ${metrics.size}`);
  console.log();

  let totalTasks = 0;
  let totalSuccess = 0;

  for (const [role, agentMetrics] of metrics) {
    const m = agentMetrics as any;
    totalTasks += m.taskCount;
    totalSuccess += m.successCount;

    if (m.taskCount > 0) {
      console.log(`  ${role}:`);
      console.log(`    - Tasks: ${m.taskCount}`);
      console.log(`    - Success: ${m.successCount}/${m.taskCount}`);
      console.log(`    - Avg Execution: ${m.averageExecutionTime.toFixed(2)}ms`);
    }
  }

  console.log();
  console.log(`  Overall Statistics:`);
  console.log(`    - Total Tasks Executed: ${totalTasks}`);
  console.log(`    - Success Rate: ${((totalSuccess / totalTasks) * 100).toFixed(2)}%`);

  console.log();

  // Demo 7: Integration Features
  console.log('🔧 Demo 7: Tool Integrations');
  console.log('-'.repeat(60));

  // AgentBooster (AST)
  console.log('  AgentBooster (AST Operations):');
  const booster = swarm.getAgentBooster();
  const ast = await booster.parse('function example() { return true; }');
  console.log(`    ✓ Parsed AST: ${ast.type}, ${ast.children.length} children`);

  // Jujutsu (Version Control)
  console.log('  AgenticJujutsu (Version Control):');
  const jujutsu = swarm.getJujutsu();
  const status = await jujutsu.status();
  console.log(`    ✓ Current branch: ${status.branch}`);

  // Ruvector (Learning)
  console.log('  Ruvector (Self-Learning):');
  const ruvector = swarm.getRuvector();
  const vectorId = await ruvector.store(
    new Array(128).fill(0).map(() => Math.random()),
    { type: 'demo', timestamp: Date.now() }
  );
  const stats = ruvector.getStats();
  console.log(`    ✓ Stored vector: ${vectorId}`);
  console.log(`    ✓ Total patterns: ${stats.totalPatterns}`);
  console.log(`    ✓ Hypergraph edges: ${stats.hypergraphEdges}`);

  console.log();

  // Shutdown
  console.log('🛑 Shutting down agent swarm...');
  await swarm.shutdown();
  console.log('✅ Clean shutdown complete');

  console.log();
  console.log('=' .repeat(60));
  console.log('🎉 Full System Demo Complete!');
  console.log();
  console.log('Summary:');
  console.log('  ✓ 15 concurrent agents initialized and tested');
  console.log('  ✓ Audio processing pipeline demonstrated');
  console.log('  ✓ Self-learning and optimization verified');
  console.log('  ✓ Code generation and testing workflow shown');
  console.log('  ✓ Concurrent operations executed successfully');
  console.log('  ✓ All integrations (AgentBooster, Jujutsu, Ruvector) working');
  console.log('  ✓ System metrics and health monitoring active');
  console.log();
}

// Run the demo
runFullSystemDemo().catch((error) => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
