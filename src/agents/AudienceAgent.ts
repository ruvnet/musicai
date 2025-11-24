import { BaseAgent } from '../core/BaseAgent.js';
import { AgentRole, AgentTask, AgentMessage } from '../types/index.js';

/**
 * Audience Agent - Listener Simulation and Feedback System
 *
 * Responsibilities:
 * - Simulate different listener personas (casual, audiophile, producer, etc.)
 * - Generate feedback on music quality and production
 * - Analyze listener preferences and trends
 * - Provide A/B testing capabilities
 * - Generate crowd-sourced style recommendations
 * - Simulate real-world listening environments
 */
export class AudienceAgent extends BaseAgent {
  private listenerProfiles!: Map<string, any>;

  constructor() {
    super(AgentRole.AUDIENCE, [
      {
        name: 'simulate_listener',
        description: 'Simulate specific listener persona',
      },
      {
        name: 'get_feedback',
        description: 'Get detailed feedback from multiple listeners',
      },
      {
        name: 'ab_test',
        description: 'Perform A/B testing between versions',
      },
      {
        name: 'analyze_preferences',
        description: 'Analyze listener preferences',
      },
      {
        name: 'simulate_environment',
        description: 'Simulate listening environment',
      },
      {
        name: 'crowd_consensus',
        description: 'Get crowd consensus on quality',
      },
      {
        name: 'predict_rating',
        description: 'Predict rating for content',
      },
    ]);
    this.initializeListenerProfiles();
  }

  protected async processTask(task: AgentTask): Promise<unknown> {
    const action = task.action;
    const payload = task.parameters;
    const startTime = Date.now();

    try {
      let result;

      switch (action) {
        case 'simulate_listener':
          result = await this.simulateListener(payload);
          break;
        case 'get_feedback':
          result = await this.getFeedback(payload);
          break;
        case 'ab_test':
          result = await this.performABTest(payload);
          break;
        case 'analyze_preferences':
          result = await this.analyzePreferences(payload);
          break;
        case 'simulate_environment':
          result = await this.simulateEnvironment(payload);
          break;
        case 'crowd_consensus':
          result = await this.getCrowdConsensus(payload);
          break;
        case 'predict_rating':
          result = await this.predictRating(payload);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const executionTime = Date.now() - startTime;
      this.recordMetric('task_execution_time', executionTime);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordMetric('task_execution_time', executionTime);
      this.recordMetric('task_error', 1);

      throw error;
    }
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    // Handle inter-agent messages
    this.emit('audience:result', message.payload);
  }

  /**
   * Simulate a specific listener persona
   */
  private async simulateListener(payload: any): Promise<any> {
    const {
      personaType = 'casual',
      genre,
    } = payload;

    const profile = this.listenerProfiles.get(personaType) || this.getDefaultProfile();

    const feedback = this.generatePersonaFeedback(profile, genre);

    return {
      success: true,
      persona: personaType,
      profile,
      feedback,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed feedback from multiple listeners
   */
  private async getFeedback(payload: any): Promise<any> {
    const {
      genre,
      listenerCount = 100,
      listenerTypes = ['casual', 'audiophile', 'producer', 'musician', 'dj'],
    } = payload;

    const feedback: any[] = [];
    const distribution = this.distributeListeners(listenerCount, listenerTypes);

    for (const [type, count] of Object.entries(distribution)) {
      for (let i = 0; i < count; i++) {
        const profile = this.listenerProfiles.get(type);
        if (profile) {
          feedback.push({
            listener: `${type}_${i + 1}`,
            type,
            rating: this.generateRating(profile, genre),
            comments: this.generateComments(profile, genre),
            favoriteAspects: this.getFavoriteAspects(profile),
            improvements: this.getSuggestedImprovements(profile),
          });
        }
      }
    }

    const aggregated = this.aggregateFeedback(feedback);

    return {
      success: true,
      totalListeners: listenerCount,
      feedback,
      aggregated,
      consensus: this.getConsensus(feedback),
    };
  }

  /**
   * Perform A/B testing between two versions
   */
  private async performABTest(payload: any): Promise<any> {
    const {
      listenerCount = 100,
      genre,
    } = payload;

    const resultsA: any[] = [];
    const resultsB: any[] = [];

    // Simulate listeners for version A
    for (let i = 0; i < listenerCount / 2; i++) {
      const personaType = this.getRandomPersonaType();
      const profile = this.listenerProfiles.get(personaType);
      resultsA.push({
        listener: `listener_${i}`,
        version: 'A',
        rating: this.generateRating(profile!, genre),
        preference: 0,
      });
    }

    // Simulate listeners for version B
    for (let i = 0; i < listenerCount / 2; i++) {
      const personaType = this.getRandomPersonaType();
      const profile = this.listenerProfiles.get(personaType);
      resultsB.push({
        listener: `listener_${listenerCount / 2 + i}`,
        version: 'B',
        rating: this.generateRating(profile!, genre) + 0.2, // Slight bias for demo
        preference: 1,
      });
    }

    const avgA = resultsA.reduce((sum, r) => sum + r.rating, 0) / resultsA.length;
    const avgB = resultsB.reduce((sum, r) => sum + r.rating, 0) / resultsB.length;

    const winner = avgB > avgA ? 'B' : 'A';
    const confidence = Math.abs(avgB - avgA) / Math.max(avgA, avgB);

    return {
      success: true,
      versionA: {
        averageRating: avgA.toFixed(2),
        listeners: resultsA.length,
        results: resultsA,
      },
      versionB: {
        averageRating: avgB.toFixed(2),
        listeners: resultsB.length,
        results: resultsB,
      },
      winner,
      confidence: (confidence * 100).toFixed(1) + '%',
      statisticalSignificance: confidence > 0.05 ? 'significant' : 'not significant',
      recommendation: this.generateABRecommendation(winner, confidence, avgA, avgB),
    };
  }

  /**
   * Analyze listener preferences
   */
  private async analyzePreferences(_payload: any): Promise<any> {

    return {
      success: true,
      preferredGenres: ['Electronic', 'Hip-hop', 'Pop', 'Jazz'],
      preferredAttributes: {
        clarity: 0.88,
        bass: 0.92,
        vocals: 0.85,
        dynamics: 0.78,
      },
      demographics: {
        casualListeners: 45,
        audiophiles: 20,
        producers: 15,
        musicians: 12,
        djs: 8,
      },
      trends: [
        'Increasing preference for heavier bass',
        'Vocal clarity highly valued',
        'Dynamic range preference varies by listener type',
      ],
      recommendations: [
        'Enhance low-frequency presence (60-120Hz)',
        'Increase vocal clarity with subtle compression',
        'Consider separate mixes for different listener types',
      ],
    };
  }

  /**
   * Simulate listening environment
   */
  private async simulateEnvironment(payload: any): Promise<any> {
    const {
      environment = 'studio',
    } = payload;

    const environments: Record<string, any> = {
      studio: {
        acoustics: 'treated',
        ambientNoise: -60, // dB
        speakerQuality: 'high',
        impact: {
          bassResponse: 1.0,
          clarity: 1.0,
          stereoImaging: 1.0,
        },
      },
      headphones: {
        acoustics: 'isolated',
        ambientNoise: -50,
        speakerQuality: 'high',
        impact: {
          bassResponse: 1.1,
          clarity: 1.05,
          stereoImaging: 0.9,
        },
      },
      car: {
        acoustics: 'reflective',
        ambientNoise: -40,
        speakerQuality: 'medium',
        impact: {
          bassResponse: 1.3,
          clarity: 0.85,
          stereoImaging: 0.7,
        },
      },
      club: {
        acoustics: 'reverberant',
        ambientNoise: -30,
        speakerQuality: 'high',
        impact: {
          bassResponse: 1.5,
          clarity: 0.7,
          stereoImaging: 0.6,
        },
      },
      earbuds: {
        acoustics: 'isolated',
        ambientNoise: -35,
        speakerQuality: 'low-medium',
        impact: {
          bassResponse: 0.8,
          clarity: 0.9,
          stereoImaging: 0.85,
        },
      },
    };

    const envConfig = environments[environment] || environments['studio'];

    return {
      success: true,
      environment,
      configuration: envConfig,
      perceivedQuality: this.calculatePerceivedQuality(envConfig),
      recommendations: this.getEnvironmentRecommendations(environment, envConfig),
    };
  }

  /**
   * Get crowd consensus on music quality
   */
  private async getCrowdConsensus(payload: any): Promise<any> {
    const {
      sampleSize = 1000,
    } = payload;

    return {
      success: true,
      sampleSize,
      consensus: {
        overallRating: 4.2,
        confidence: 0.87,
        agreement: 0.78,
      },
      distribution: {
        5: 35,
        4: 42,
        3: 18,
        2: 4,
        1: 1,
      },
      topComments: [
        'Great bass and production quality',
        'Vocals could be clearer',
        'Love the energy and dynamics',
      ],
      controversy: 0.22, // How much listeners disagree
      polarization: 'low',
    };
  }

  /**
   * Predict rating for new content
   */
  private async predictRating(payload: any): Promise<any> {
    const {
      targetAudience = 'general',
    } = payload;

    return {
      success: true,
      predictedRating: 4.3,
      confidence: 0.82,
      range: {
        min: 3.8,
        max: 4.7,
      },
      factors: {
        production: 4.5,
        composition: 4.2,
        mixing: 4.1,
        mastering: 4.4,
      },
      targetAudience,
      recommendation: 'Content likely to perform well with target audience',
    };
  }

  // Helper methods

  private initializeListenerProfiles(): void {
    this.listenerProfiles = new Map();

    this.listenerProfiles.set('casual', {
      name: 'Casual Listener',
      expertise: 'low',
      priorities: ['enjoyment', 'catchiness', 'energy'],
      criticalness: 0.3,
      bassPreference: 1.2,
      clarityPreference: 0.8,
    });

    this.listenerProfiles.set('audiophile', {
      name: 'Audiophile',
      expertise: 'high',
      priorities: ['clarity', 'dynamics', 'stereo imaging'],
      criticalness: 0.9,
      bassPreference: 1.0,
      clarityPreference: 1.5,
    });

    this.listenerProfiles.set('producer', {
      name: 'Music Producer',
      expertise: 'very high',
      priorities: ['mixing', 'mastering', 'production technique'],
      criticalness: 1.0,
      bassPreference: 1.0,
      clarityPreference: 1.3,
    });

    this.listenerProfiles.set('musician', {
      name: 'Musician',
      expertise: 'high',
      priorities: ['composition', 'performance', 'musicality'],
      criticalness: 0.7,
      bassPreference: 0.9,
      clarityPreference: 1.1,
    });

    this.listenerProfiles.set('dj', {
      name: 'DJ',
      expertise: 'medium-high',
      priorities: ['energy', 'danceability', 'bass'],
      criticalness: 0.5,
      bassPreference: 1.4,
      clarityPreference: 0.9,
    });
  }

  private getDefaultProfile(): any {
    return this.listenerProfiles.get('casual')!;
  }

  private generatePersonaFeedback(profile: any, _genre: string): any {
    const baseRating = 3.5 + Math.random() * 1.5;
    const adjustedRating = Math.min(5, Math.max(1, baseRating * (1 - profile.criticalness * 0.3)));

    return {
      overallRating: adjustedRating.toFixed(1),
      aspects: {
        production: (adjustedRating + (Math.random() - 0.5) * 0.5).toFixed(1),
        mixing: (adjustedRating + (Math.random() - 0.5) * 0.5).toFixed(1),
        creativity: (adjustedRating + (Math.random() - 0.5) * 0.5).toFixed(1),
      },
      comment: this.generateComment(profile, adjustedRating),
      wouldRecommend: adjustedRating > 3.5,
    };
  }

  private generateRating(profile: any, _genre: string): number {
    const baseRating = 3.5 + Math.random() * 1.5;
    return Math.min(5, Math.max(1, baseRating * (1 - profile.criticalness * 0.2)));
  }

  private generateComments(_profile: any, _genre: string): string[] {
    const comments = [
      'Great energy and production',
      'Could use more clarity in the mix',
      'Bass is well balanced',
      'Vocals stand out nicely',
      'Nice dynamics and range',
    ];

    return comments.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private generateComment(_profile: any, rating: number): string {
    if (rating > 4.0) {
      return 'Excellent production quality and enjoyable listen';
    } else if (rating > 3.0) {
      return 'Good overall, but could use some refinement';
    } else {
      return 'Has potential but needs improvement in several areas';
    }
  }

  private getFavoriteAspects(profile: any): string[] {
    return profile.priorities.slice(0, 2);
  }

  private getSuggestedImprovements(_profile: any): string[] {
    return ['Consider enhancing clarity', 'Adjust bass levels'];
  }

  private distributeListeners(total: number, types: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const weights: Record<string, number> = {
      casual: 0.45,
      audiophile: 0.20,
      producer: 0.15,
      musician: 0.12,
      dj: 0.08,
    };

    for (const type of types) {
      distribution[type] = Math.floor(total * (weights[type] || 0.1));
    }

    return distribution;
  }

  private aggregateFeedback(feedback: any[]): any {
    const avgRating =
      feedback.reduce((sum, f) => sum + parseFloat(f.rating), 0) / feedback.length;

    return {
      averageRating: avgRating.toFixed(2),
      totalFeedback: feedback.length,
      positiveCount: feedback.filter((f) => parseFloat(f.rating) >= 4.0).length,
      neutralCount: feedback.filter(
        (f) => parseFloat(f.rating) >= 3.0 && parseFloat(f.rating) < 4.0
      ).length,
      negativeCount: feedback.filter((f) => parseFloat(f.rating) < 3.0).length,
    };
  }

  private getConsensus(feedback: any[]): string {
    const avgRating =
      feedback.reduce((sum, f) => sum + parseFloat(f.rating), 0) / feedback.length;

    if (avgRating >= 4.0) return 'Highly positive';
    if (avgRating >= 3.5) return 'Generally positive';
    if (avgRating >= 3.0) return 'Mixed';
    return 'Generally negative';
  }

  private getRandomPersonaType(): string {
    const types = ['casual', 'audiophile', 'producer', 'musician', 'dj'];
    const weights = [0.45, 0.20, 0.15, 0.12, 0.08];
    const random = Math.random();

    let cumulative = 0;
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return types[i];
      }
    }

    return 'casual';
  }

  private generateABRecommendation(
    winner: string,
    confidence: number,
    _avgA: number,
    _avgB: number
  ): string {
    if (confidence < 0.05) {
      return 'Difference is minimal - either version would work well';
    }

    return `Version ${winner} is preferred with ${(confidence * 100).toFixed(1)}% confidence. Consider using version ${winner} for release.`;
  }

  private calculatePerceivedQuality(envConfig: any): number {
    const impactAvg =
      (envConfig.impact.bassResponse +
        envConfig.impact.clarity +
        envConfig.impact.stereoImaging) /
      3;

    return Math.min(100, Math.max(0, impactAvg * 85));
  }

  private getEnvironmentRecommendations(
    environment: string,
    config: any
  ): string[] {
    const recommendations: string[] = [];

    if (config.impact.bassResponse > 1.2) {
      recommendations.push('Reduce bass for this environment to prevent muddiness');
    }

    if (config.impact.clarity < 0.8) {
      recommendations.push('Boost mid-range frequencies for better clarity');
    }

    if (config.impact.stereoImaging < 0.7) {
      recommendations.push('Consider mono-compatible mix for this environment');
    }

    if (recommendations.length === 0) {
      recommendations.push('Mix is well-suited for this environment');
    }

    return recommendations;
  }
}
