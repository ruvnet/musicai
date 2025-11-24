/*!
 * Magic AI Music Box - Rust Core Library
 * High-performance audio processing with napi-rs bindings
 */

#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;

mod audio;
mod dsp;
mod autotune;
mod learning;

pub use audio::*;
pub use dsp::*;
pub use autotune::*;
pub use learning::*;

/// Audio configuration
#[napi(object)]
#[derive(Debug, Clone)]
pub struct AudioConfig {
    pub sample_rate: u32,
    pub buffer_size: u32,
    pub channels: u32,
}

impl Default for AudioConfig {
    fn default() -> Self {
        Self {
            sample_rate: 48000,
            buffer_size: 256,
            channels: 1,
        }
    }
}

/// Pitch detection result
#[napi(object)]
#[derive(Debug, Clone)]
pub struct PitchResult {
    pub frequency: f64,
    pub confidence: f64,
    pub algorithm: String,
}

/// Auto-tune result
#[napi(object)]
#[derive(Debug, Clone)]
pub struct AutotuneResult {
    pub original_pitch: f64,
    pub corrected_pitch: f64,
    pub strength: f64,
    pub processed_samples: u32,
}

/// Audio analysis result
#[napi(object)]
#[derive(Debug, Clone)]
pub struct AudioAnalysis {
    pub pitch: f64,
    pub amplitude: f64,
    pub quality_score: f64,
    pub features: Vec<f64>,
}

/// Main MusicAI processor
#[napi]
pub struct MusicAIProcessor {
    config: AudioConfig,
    pitch_detector: dsp::PitchDetector,
    autotune_engine: autotune::AutotuneEngine,
}

#[napi]
impl MusicAIProcessor {
    /// Create a new MusicAI processor
    #[napi(constructor)]
    pub fn new(config: AudioConfig) -> Result<Self> {
        Ok(Self {
            pitch_detector: dsp::PitchDetector::new(config.sample_rate),
            autotune_engine: autotune::AutotuneEngine::new(config.clone()),
            config,
        })
    }

    /// Detect pitch from audio buffer
    #[napi]
    pub fn detect_pitch(&self, audio_buffer: Float32Array) -> Result<PitchResult> {
        let buffer: Vec<f32> = audio_buffer.to_vec();
        let result = self.pitch_detector.detect(&buffer)
            .map_err(|e| Error::from_reason(format!("Pitch detection failed: {}", e)))?;

        Ok(PitchResult {
            frequency: result.frequency,
            confidence: result.confidence,
            algorithm: "YIN".to_string(),
        })
    }

    /// Apply auto-tune correction
    #[napi]
    pub fn apply_autotune(
        &mut self,
        audio_buffer: Float32Array,
        target_pitch: f64,
        strength: f64,
    ) -> Result<Float32Array> {
        let buffer: Vec<f32> = audio_buffer.to_vec();
        let result = self.autotune_engine
            .process(&buffer, target_pitch, strength)
            .map_err(|e| Error::from_reason(format!("Auto-tune failed: {}", e)))?;

        Ok(Float32Array::new(result))
    }

    /// Analyze audio buffer
    #[napi]
    pub fn analyze_audio(&self, audio_buffer: Float32Array) -> Result<AudioAnalysis> {
        let buffer: Vec<f32> = audio_buffer.to_vec();
        let pitch_result = self.pitch_detector.detect(&buffer)
            .map_err(|e| Error::from_reason(format!("Analysis failed: {}", e)))?;

        let amplitude = audio::calculate_amplitude(&buffer);
        let quality_score = self.calculate_quality(&buffer);
        let features = self.extract_features(&buffer);

        Ok(AudioAnalysis {
            pitch: pitch_result.frequency,
            amplitude,
            quality_score,
            features,
        })
    }

    /// Process audio in real-time
    #[napi]
    pub async unsafe fn process_realtime(
        &mut self,
        audio_buffer: Float32Array,
        options: ProcessOptions,
    ) -> Result<Float32Array> {
        // Detect pitch
        let pitch = self.detect_pitch(audio_buffer.clone())?;

        // Apply correction if needed
        if options.enable_autotune {
            let target = self.snap_to_scale(pitch.frequency, &options.scale, &options.key);
            self.apply_autotune(audio_buffer, target, options.strength)
        } else {
            Ok(audio_buffer)
        }
    }

    // Private helper methods
    fn calculate_quality(&self, buffer: &[f32]) -> f64 {
        // Simplified quality scoring
        let snr = audio::calculate_snr(buffer);
        (snr / 40.0).min(1.0)
    }

    fn extract_features(&self, _buffer: &[f32]) -> Vec<f64> {
        // Extract MFCC-like features (simplified)
        vec![0.0; 128]
    }

    fn snap_to_scale(&self, freq: f64, _scale: &str, _key: &str) -> f64 {
        // Simplified scale snapping
        freq
    }
}

/// Processing options
#[napi(object)]
#[derive(Debug, Clone)]
pub struct ProcessOptions {
    pub enable_autotune: bool,
    pub strength: f64,
    pub scale: String,
    pub key: String,
}

/// Get library version
#[napi]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Initialize the library
#[napi]
pub fn init() -> Result<String> {
    Ok("MusicAI initialized successfully".to_string())
}
