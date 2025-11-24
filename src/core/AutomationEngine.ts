/**
 * Automation Engine for Mixer Parameters
 *
 * Supports:
 * - Time-based automation points
 * - Linear, exponential, and logarithmic curves
 * - Multiple parameters per channel
 * - Real-time interpolation
 */

import { AutomationTrack, AutomationPoint } from '../types/mixer.js';
import { ChannelStrip } from './ChannelStrip.js';

export class AutomationEngine {
  private tracks: Map<string, Map<string, AutomationTrack>>;

  constructor() {
    this.tracks = new Map();
  }

  /**
   * Set automation track for a channel parameter
   */
  setTrack(channelId: string, parameter: string, points: AutomationPoint[]): void {
    if (!this.tracks.has(channelId)) {
      this.tracks.set(channelId, new Map());
    }

    const track: AutomationTrack = {
      parameter,
      points: points.sort((a, b) => a.time - b.time),
      enabled: true,
    };

    this.tracks.get(channelId)!.set(parameter, track);
  }

  /**
   * Apply automation to channel at current time
   */
  apply(channelId: string, currentTime: number, channel: ChannelStrip): void {
    const channelTracks = this.tracks.get(channelId);
    if (!channelTracks) return;

    channelTracks.forEach((track, parameter) => {
      if (!track.enabled || track.points.length === 0) return;

      const value = this.interpolate(track, currentTime);
      this.applyParameter(channel, parameter, value);
    });
  }

  /**
   * Interpolate value at current time
   */
  private interpolate(track: AutomationTrack, time: number): number {
    const points = track.points;

    // Before first point
    if (time <= points[0].time) {
      return points[0].value;
    }

    // After last point
    if (time >= points[points.length - 1].time) {
      return points[points.length - 1].value;
    }

    // Find surrounding points
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (time >= p1.time && time <= p2.time) {
        const t = (time - p1.time) / (p2.time - p1.time);
        return this.interpolateCurve(p1.value, p2.value, t, p1.curve);
      }
    }

    return points[0].value;
  }

  /**
   * Interpolate between two values with curve
   */
  private interpolateCurve(
    v1: number,
    v2: number,
    t: number,
    curve: 'linear' | 'exponential' | 'logarithmic'
  ): number {
    switch (curve) {
      case 'linear':
        return v1 + (v2 - v1) * t;

      case 'exponential':
        return v1 * Math.pow(v2 / v1, t);

      case 'logarithmic':
        return v1 + (v2 - v1) * Math.log(1 + t * 9) / Math.log(10);

      default:
        return v1 + (v2 - v1) * t;
    }
  }

  /**
   * Apply parameter value to channel
   */
  private applyParameter(channel: ChannelStrip, parameter: string, value: number): void {
    switch (parameter) {
      case 'gain':
        channel.setGain(value);
        break;
      case 'pan':
        channel.setPan(value);
        break;
      case 'mute':
        channel.setMute(value > 0.5);
        break;
      case 'solo':
        channel.setSolo(value > 0.5);
        break;
    }
  }

  /**
   * Enable/disable automation track
   */
  setEnabled(channelId: string, parameter: string, enabled: boolean): void {
    const track = this.tracks.get(channelId)?.get(parameter);
    if (track) {
      track.enabled = enabled;
    }
  }

  /**
   * Clear all automation
   */
  clear(): void {
    this.tracks.clear();
  }

  /**
   * Get automation track
   */
  getTrack(channelId: string, parameter: string): AutomationTrack | undefined {
    return this.tracks.get(channelId)?.get(parameter);
  }
}
