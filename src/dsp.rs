/*!
 * Digital Signal Processing - Pitch Detection
 */

use rustfft::{FftPlanner, num_complex::Complex};


#[derive(Debug, Clone)]
pub struct PitchDetectionResult {
    pub frequency: f64,
    pub confidence: f64,
}

pub struct PitchDetector {
    sample_rate: u32,
    fft_planner: FftPlanner<f32>,
}

impl PitchDetector {
    pub fn new(sample_rate: u32) -> Self {
        Self {
            sample_rate,
            fft_planner: FftPlanner::new(),
        }
    }

    /// Detect pitch using YIN algorithm
    pub fn detect(&self, buffer: &[f32]) -> Result<PitchDetectionResult, String> {
        if buffer.len() < 512 {
            return Err("Buffer too small for pitch detection".to_string());
        }

        let result = self.yin_algorithm(buffer)?;

        Ok(PitchDetectionResult {
            frequency: result.0,
            confidence: result.1,
        })
    }

    /// YIN pitch detection algorithm
    fn yin_algorithm(&self, buffer: &[f32]) -> Result<(f64, f64), String> {
        let n = buffer.len();
        let half_n = n / 2;

        // Calculate difference function
        let mut diff = vec![0.0; half_n];
        for tau in 0..half_n {
            let mut sum = 0.0;
            for j in 0..(n - tau) {
                let delta = buffer[j] - buffer[j + tau];
                sum += delta * delta;
            }
            diff[tau] = sum;
        }

        // Cumulative mean normalized difference
        let mut cmnd = vec![0.0; half_n];
        cmnd[0] = 1.0;

        let mut running_sum = 0.0;
        for tau in 1..half_n {
            running_sum += diff[tau];
            cmnd[tau] = diff[tau] / (running_sum / tau as f32);
        }

        // Find the first minimum below threshold
        let threshold = 0.1;
        let mut tau_estimate = 0;

        for tau in 2..half_n {
            if cmnd[tau] < threshold {
                if tau + 1 < half_n && cmnd[tau] < cmnd[tau + 1] {
                    tau_estimate = tau;
                    break;
                }
            }
        }

        if tau_estimate == 0 {
            return Ok((0.0, 0.0)); // No pitch detected
        }

        // Parabolic interpolation for better accuracy
        let tau_refined = self.parabolic_interpolation(&cmnd, tau_estimate);

        let frequency = self.sample_rate as f64 / tau_refined;
        let confidence = 1.0 - cmnd[tau_estimate] as f64;

        Ok((frequency, confidence))
    }

    /// Parabolic interpolation for sub-sample accuracy
    fn parabolic_interpolation(&self, data: &[f32], index: usize) -> f64 {
        if index == 0 || index >= data.len() - 1 {
            return index as f64;
        }

        let s0 = data[index - 1] as f64;
        let s1 = data[index] as f64;
        let s2 = data[index + 1] as f64;

        let adjustment = 0.5 * (s0 - s2) / (s0 - 2.0 * s1 + s2);

        index as f64 + adjustment
    }

    /// FFT-based pitch detection (alternative method)
    #[allow(dead_code)]
    fn fft_detect(&mut self, buffer: &[f32]) -> Result<(f64, f64), String> {
        let n = buffer.len();
        let mut complex_buffer: Vec<Complex<f32>> = buffer
            .iter()
            .map(|&x| Complex::new(x, 0.0))
            .collect();

        let fft = self.fft_planner.plan_fft_forward(n);
        fft.process(&mut complex_buffer);

        // Find peak in magnitude spectrum
        let mut max_mag = 0.0;
        let mut max_idx = 0;

        for (i, c) in complex_buffer.iter().enumerate().skip(1).take(n / 2 - 1) {
            let mag = c.norm();
            if mag > max_mag {
                max_mag = mag;
                max_idx = i;
            }
        }

        let frequency = (max_idx as f64 * self.sample_rate as f64) / n as f64;
        let confidence = (max_mag / buffer.len() as f32).min(1.0) as f64;

        Ok((frequency, confidence))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pitch_detector_creation() {
        let detector = PitchDetector::new(48000);
        assert_eq!(detector.sample_rate, 48000);
    }

    #[test]
    fn test_sine_wave_detection() {
        let sample_rate = 48000;
        let frequency = 440.0; // A4
        let duration = 0.1; // 100ms

        let samples = (sample_rate as f64 * duration) as usize;
        let mut buffer = vec![0.0; samples];

        for (i, sample) in buffer.iter_mut().enumerate() {
            let t = i as f64 / sample_rate as f64;
            *sample = (2.0 * PI * frequency * t).sin() as f32;
        }

        let detector = PitchDetector::new(sample_rate);
        let result = detector.detect(&buffer).unwrap();

        // Should detect approximately 440 Hz
        assert!((result.frequency - 440.0).abs() < 10.0);
        assert!(result.confidence > 0.5);
    }
}
