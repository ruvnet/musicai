/*!
 * Audio utilities and processing
 */

/// Calculate RMS amplitude
pub fn calculate_amplitude(buffer: &[f32]) -> f64 {
    if buffer.is_empty() {
        return 0.0;
    }

    let sum: f32 = buffer.iter().map(|&x| x * x).sum();
    (sum / buffer.len() as f32).sqrt() as f64
}

/// Calculate Signal-to-Noise Ratio
pub fn calculate_snr(buffer: &[f32]) -> f64 {
    if buffer.is_empty() {
        return 0.0;
    }

    let signal_power = calculate_amplitude(buffer);
    let noise_power = estimate_noise(buffer);

    if noise_power < 1e-10 {
        return 100.0; // Very high SNR
    }

    20.0 * (signal_power / noise_power).log10()
}

/// Estimate noise floor
fn estimate_noise(buffer: &[f32]) -> f64 {
    if buffer.len() < 10 {
        return 0.0001;
    }

    // Simple noise estimation using minimum values
    let mut sorted = buffer.to_vec();
    sorted.sort_by(|a, b| a.abs().partial_cmp(&b.abs()).unwrap());

    let noise_samples = &sorted[0..sorted.len() / 10];
    calculate_amplitude(noise_samples)
}

/// Normalize audio buffer
pub fn normalize(buffer: &mut [f32], target_level: f32) {
    if buffer.is_empty() {
        return;
    }

    let max_val = buffer.iter().map(|&x| x.abs()).fold(0.0f32, f32::max);

    if max_val > 1e-10 {
        let scale = target_level / max_val;
        for sample in buffer.iter_mut() {
            *sample *= scale;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_amplitude() {
        let buffer = vec![0.5, -0.5, 0.5, -0.5];
        let amp = calculate_amplitude(&buffer);
        assert!(amp > 0.0 && amp <= 1.0);
    }

    #[test]
    fn test_normalize() {
        let mut buffer = vec![2.0, -2.0, 1.0, -1.0];
        normalize(&mut buffer, 1.0);

        let max = buffer.iter().map(|&x| x.abs()).fold(0.0f32, f32::max);
        assert!((max - 1.0).abs() < 1e-6);
    }
}
