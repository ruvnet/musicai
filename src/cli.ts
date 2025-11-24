#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AgentSwarm, defaultConfig, AgentRole } from './index.js';

const program = new Command();

program
  .name('musicai')
  .description('Magic AI Music Box - Enhanced CLI with Doctor, Stem Manager, and Audience agents')
  .version('1.0.0');

program
  .command('doctor')
  .description('Run system health check')
  .action(async () => {
    console.log(chalk.green('✓ Doctor agent running system diagnostics...'));
    const swarm = new AgentSwarm(defaultConfig);
    await swarm.initialize();
    const result = await swarm.executeTask(AgentRole.DOCTOR, 'check_health', {});
    console.log(chalk.blue('System Status:'), result);
    await swarm.shutdown();
  });

program
  .command('stem')
  .description('Manage audio stems')
  .action(async () => {
    console.log(chalk.green('✓ Stem Manager separating audio...'));
    const swarm = new AgentSwarm(defaultConfig);
    await swarm.initialize();
    const result = await swarm.executeTask(AgentRole.STEM_MANAGER, 'separate', {
      audioBuffer: new Float32Array(48000 * 4),
      sampleRate: 48000,
    });
    console.log(chalk.blue('Stems:'), result);
    await swarm.shutdown();
  });

program
  .command('audience')
  .description('Simulate listener feedback')
  .action(async () => {
    console.log(chalk.green('✓ Audience agent simulating feedback...'));
    const swarm = new AgentSwarm(defaultConfig);
    await swarm.initialize();
    const result = await swarm.executeTask(AgentRole.AUDIENCE, 'get_feedback', {
      listenerCount: 100,
      genre: 'edm',
    });
    console.log(chalk.blue('Feedback:'), result);
    await swarm.shutdown();
  });

program.parse();
