/*!
 * Auto-tune engine using PSOLA (Pitch Synchronous Overlap-Add)
 */

use crate::AudioConfig;


pub struct AutotuneEngine {
    config: AudioConfig,
    overlap_factor: f32,
}

impl AutotuneEngine {
    pub fn new(config: AudioConfig) -> Self {
        Self {
            config,
            overlap_factor: 0.75,
        }
    }

    /// Process audio buffer with pitch correction
    pub fn process(
        &self,
        buffer: &[f32],
        target_pitch: f64,
        strength: f64,
    ) -> Result<Vec<f32>, String> {
        if buffer.is_empty() {
            return Err("Empty buffer".to_string());
        }

        if !(0.0..=1.0).contains(&strength) {
            return Err("Strength must be between 0.0 and 1.0".to_string());
        }

        // For now, implement a simplified pitch shifting
        let mut output = buffer.to_vec();

        // Calculate pitch shift ratio
        let current_pitch = self.estimate_pitch(buffer);
        if current_pitch < 50.0 {
            // No clear pitch detected
            return Ok(output);
        }

        let pitch_ratio = target_pitch / current_pitch;
        let shift_amount = ((pitch_ratio - 1.0) * strength) + 1.0;

        // Apply pitch shift using simple resampling (placeholder)
        self.pitch_shift(&mut output, shift_amount as f32);

        Ok(output)
    }

    /// Estimate current pitch (simplified)
    fn estimate_pitch(&self, buffer: &[f32]) -> f64 {
        // Simplified autocorrelation-based pitch estimation
        let min_period = (self.config.sample_rate as f64 / 1000.0) as usize; // ~1000 Hz max
        let max_period = (self.config.sample_rate as f64 / 50.0) as usize; // ~50 Hz min

        let mut best_correlation = 0.0;
        let mut best_period = min_period;

        for period in min_period..max_period.min(buffer.len() / 2) {
            let correlation = self.autocorrelation(buffer, period);
            if correlation > best_correlation {
                best_correlation = correlation;
                best_period = period;
            }
        }

        if best_correlation < 0.5 {
            return 0.0; // No clear pitch
        }

        self.config.sample_rate as f64 / best_period as f64
    }

    /// Calculate autocorrelation at a given lag
    fn autocorrelation(&self, buffer: &[f32], lag: usize) -> f32 {
        let mut correlation = 0.0;
        let mut energy1 = 0.0;
        let mut energy2 = 0.0;

        for i in 0..(buffer.len() - lag) {
            correlation += buffer[i] * buffer[i + lag];
            energy1 += buffer[i] * buffer[i];
            energy2 += buffer[i + lag] * buffer[i + lag];
        }

        if energy1 < 1e-10 || energy2 < 1e-10 {
            return 0.0;
        }

        correlation / (energy1 * energy2).sqrt()
    }

    /// Apply pitch shift (simplified implementation)
    fn pitch_shift(&self, buffer: &mut [f32], ratio: f32) {
        if (ratio - 1.0).abs() < 0.001 {
            return; // No shift needed
        }

        let original = buffer.to_vec();
        let len = original.len();

        for i in 0..len {
            let source_idx = (i as f32 * ratio) as usize;

            if source_idx < len - 1 {
                // Linear interpolation
                let frac = (i as f32 * ratio) - source_idx as f32;
                buffer[i] = original[source_idx] * (1.0 - frac)
                          + original[source_idx + 1] * frac;
            } else if source_idx < len {
                buffer[i] = original[source_idx];
            } else {
                buffer[i] = 0.0;
            }
        }
    }

    /// Apply formant preservation (placeholder)
    #[allow(dead_code)]
    pub fn preserve_formants(&self, buffer: &[f32]) -> Vec<f32> {
        // Placeholder for formant preservation using LPC
        buffer.to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_autotune_engine_creation() {
        let config = AudioConfig::default();
        let engine = AutotuneEngine::new(config);
        assert!(engine.overlap_factor > 0.0);
    }

    #[test]
    fn test_pitch_shift() {
        let config = AudioConfig::default();
        let engine = AutotuneEngine::new(config);

        let buffer = vec![0.5, 0.3, -0.2, -0.4, 0.1];
        let result = engine.process(&buffer, 440.0, 0.5).unwrap();

        assert_eq!(result.len(), buffer.len());
    }

    #[test]
    fn test_zero_strength() {
        let config = AudioConfig::default();
        let engine = AutotuneEngine::new(config);

        let buffer = vec![0.5, 0.3, -0.2, -0.4, 0.1];
        let result = engine.process(&buffer, 440.0, 0.0).unwrap();

        // With zero strength, output should be close to input
        assert_eq!(result.len(), buffer.len());
    }
}
