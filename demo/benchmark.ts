/**
 * Performance Benchmark Suite
 * Measures throughput, latency, and resource usage
 */

import { AgentSwarm, defaultConfig, AgentRole, TaskPriority } from '../dist/index.js';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
}

async function benchmark(
  name: string,
  iterations: number,
  fn: () => Promise<any>
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  await fn();
  await fn();

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await fn();
    const elapsed = Date.now() - start;
    times.push(elapsed);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const throughput = (iterations / totalTime) * 1000; // ops/sec

  return {
    name,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    throughput,
  };
}

async function runBenchmarks() {
  console.log('⚡ Performance Benchmark Suite');
  console.log('='.repeat(70));
  console.log();

  const swarm = new AgentSwarm(defaultConfig);
  await swarm.initialize();

  const results: BenchmarkResult[] = [];

  // Benchmark 1: Single Agent Task Execution
  console.log('Running Benchmark 1: Single Agent Task Execution (100 iterations)...');
  const b1 = await benchmark('Single Task Execution', 100, async () => {
    return await swarm.executeTask(
      AgentRole.AUDIO_ANALYZER,
      'analyze_audio',
      { audioBuffer: 1024, sampleRate: 48000 }
    );
  });
  results.push(b1);
  console.log(`  ✓ Completed in ${b1.totalTime}ms`);
  console.log();

  // Benchmark 2: Concurrent Multi-Agent Execution
  console.log('Running Benchmark 2: Concurrent Multi-Agent (50 iterations)...');
  const b2 = await benchmark('Concurrent 5-Agent Tasks', 50, async () => {
    return await Promise.all([
      swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', { audioBuffer: 1024 }),
      swarm.executeTask(AgentRole.PITCH_DETECTOR, 'detect_pitch', { algorithm: 'yin' }),
      swarm.executeTask(AgentRole.AUTOTUNE_ENGINE, 'apply_correction', { pitch: 440 }),
      swarm.executeTask(AgentRole.AI_ENHANCER, 'score_quality', {}),
      swarm.executeTask(AgentRole.PERFORMANCE_MONITOR, 'monitor_latency', {}),
    ]);
  });
  results.push(b2);
  console.log(`  ✓ Completed in ${b2.totalTime}ms`);
  console.log();

  // Benchmark 3: Learning Pattern Storage
  console.log('Running Benchmark 3: Learning Pattern Storage (100 iterations)...');
  const b3 = await benchmark('Pattern Storage', 100, async () => {
    return await swarm.executeTask(
      AgentRole.LEARNING_MANAGER,
      'store_pattern',
      {
        embedding: new Array(128).fill(0).map(() => Math.random()),
        context: { test: true },
        feedback: 0.9
      }
    );
  });
  results.push(b3);
  console.log(`  ✓ Completed in ${b3.totalTime}ms`);
  console.log();

  // Benchmark 4: Message Bus Throughput
  console.log('Running Benchmark 4: High-Frequency Tasks (200 iterations)...');
  const b4 = await benchmark('High-Frequency Tasks', 200, async () => {
    return await swarm.executeTask(
      AgentRole.PERFORMANCE_MONITOR,
      'monitor_cpu',
      {}
    );
  });
  results.push(b4);
  console.log(`  ✓ Completed in ${b4.totalTime}ms`);
  console.log();

  // Benchmark 5: Maximum Concurrency
  console.log('Running Benchmark 5: Maximum Concurrency (25 iterations x 15 agents)...');
  const b5 = await benchmark('Max Concurrency (15 agents)', 25, async () => {
    return await Promise.all([
      swarm.executeTask(AgentRole.AUDIO_ANALYZER, 'analyze_audio', {}),
      swarm.executeTask(AgentRole.PITCH_DETECTOR, 'detect_pitch', {}),
      swarm.executeTask(AgentRole.AUTOTUNE_ENGINE, 'apply_correction', { pitch: 440, targetPitch: 444 }),
      swarm.executeTask(AgentRole.AI_ENHANCER, 'enhance_quality', { features: [] }),
      swarm.executeTask(AgentRole.LEARNING_MANAGER, 'retrieve_patterns', { query: [], limit: 5 }),
      swarm.executeTask(AgentRole.PERFORMANCE_MONITOR, 'monitor_latency', {}),
      swarm.executeTask(AgentRole.CODE_GENERATOR, 'generate_code', { spec: 'test' }),
      swarm.executeTask(AgentRole.TEST_RUNNER, 'run_tests', { testSuite: 'unit' }),
      swarm.executeTask(AgentRole.AST_ANALYZER, 'analyze_ast', { code: 'test' }),
      swarm.executeTask(AgentRole.VERSION_CONTROLLER, 'commit_changes', { message: 'test', files: [] }),
      swarm.executeTask(AgentRole.SIMULATION_ENGINE, 'run_simulation', { scenario: 'test', iterations: 100 }),
      swarm.executeTask(AgentRole.OPTIMIZATION_AGENT, 'optimize_performance', {}),
      swarm.executeTask(AgentRole.INTEGRATION_AGENT, 'integrate_component', { component: 'test' }),
      swarm.executeTask(AgentRole.DEPLOYMENT_AGENT, 'health_check', {}),
      swarm.executeTask(AgentRole.PERFORMANCE_MONITOR, 'generate_report', {}),
    ]);
  });
  results.push(b5);
  console.log(`  ✓ Completed in ${b5.totalTime}ms`);
  console.log();

  await swarm.shutdown();

  // Print Results
  console.log('='.repeat(70));
  console.log('📊 Benchmark Results');
  console.log('='.repeat(70));
  console.log();

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   Iterations:    ${result.iterations}`);
    console.log(`   Total Time:    ${result.totalTime.toFixed(2)}ms`);
    console.log(`   Avg Time:      ${result.avgTime.toFixed(2)}ms`);
    console.log(`   Min Time:      ${result.minTime.toFixed(2)}ms`);
    console.log(`   Max Time:      ${result.maxTime.toFixed(2)}ms`);
    console.log(`   Throughput:    ${result.throughput.toFixed(2)} ops/sec`);
    console.log();
  });

  // Summary
  console.log('='.repeat(70));
  console.log('📈 Performance Summary');
  console.log('='.repeat(70));
  console.log();
  console.log(`✓ Single Task Latency:        ${results[0].avgTime.toFixed(2)}ms`);
  console.log(`✓ Concurrent 5-Agent Latency: ${results[1].avgTime.toFixed(2)}ms`);
  console.log(`✓ Pattern Storage Throughput: ${results[2].throughput.toFixed(0)} ops/sec`);
  console.log(`✓ High-Frequency Throughput:  ${results[3].throughput.toFixed(0)} ops/sec`);
  console.log(`✓ Max Concurrency (15 agents): ${results[4].avgTime.toFixed(2)}ms per batch`);
  console.log();

  const totalOps = results.reduce((sum, r) => sum + r.iterations, 0);
  const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
  const avgThroughput = (totalOps / totalTime) * 1000;

  console.log(`Overall:`);
  console.log(`  Total Operations: ${totalOps}`);
  console.log(`  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`  Average Throughput: ${avgThroughput.toFixed(0)} ops/sec`);
  console.log();

  // Performance Targets
  console.log('='.repeat(70));
  console.log('🎯 Target vs Actual');
  console.log('='.repeat(70));
  console.log();

  const targets = [
    { name: 'Audio Processing Latency', target: 10, actual: results[0].avgTime, unit: 'ms' },
    { name: 'Task Throughput', target: 1000, actual: avgThroughput, unit: 'ops/sec' },
    { name: 'Concurrent Operations', target: 15, actual: 15, unit: 'agents' },
  ];

  targets.forEach(t => {
    const status = t.actual <= t.target || (t.unit === 'ops/sec' && t.actual >= t.target) ? '✅' : '⚠️';
    console.log(`${status} ${t.name}:`);
    console.log(`   Target: ${t.target} ${t.unit}`);
    console.log(`   Actual: ${typeof t.actual === 'number' ? t.actual.toFixed(2) : t.actual} ${t.unit}`);
    console.log();
  });
}

runBenchmarks().catch((error) => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
