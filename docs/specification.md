# Magic AI Music Box - Complete Specification

## Executive Summary

A Raspberry Pi 4-based real-time audio processing system that corrects pitch, timing, and tonal quality using AI-driven auto-tune with self-learning capabilities powered by ruvector. Target latency: <10ms for imperceptible delay during live performance.

## System Architecture

### Hardware Platform

- **Target**: Raspberry Pi 4 (4GB+ RAM recommended)
- **Audio I/O**: USB audio interface (class-compliant, 48kHz/24-bit)
- **Storage**: 32GB+ microSD (Class 10, A2 rating) + optional SSD via USB 3.0
- **Cooling**: Active cooling required for sustained DSP workload

### Core Components

```
┌─────────────────────────────────────────────────┐
│           Magic AI Music Box                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────┐    ┌──────────────┐            │
│  │  Audio    │───▶│   Pitch      │            │
│  │  Input    │    │   Detection  │            │
│  │  (ALSA)   │    │   (FFT/YIN)  │            │
│  └───────────┘    └──────────────┘            │
│                           │                     │
│                           ▼                     │
│  ┌───────────────────────────────┐             │
│  │   Correction Engine           │             │
│  │  - Auto-tune (PSOLA/Phase)    │             │
│  │  - Timing correction          │             │
│  │  - Formant preservation       │             │
│  └───────────────────────────────┘             │
│                           │                     │
│                           ▼                     │
│  ┌───────────────────────────────┐             │
│  │   AI Enhancement Layer        │             │
│  │  - Tonal quality scoring      │             │
│  │  - Spectral shaping           │             │
│  │  - Micro-timing adjust        │             │
│  └───────────────────────────────┘             │
│                           │                     │
│                           ▼                     │
│  ┌───────────────────────────────┐             │
│  │   ruvector Learning System    │             │
│  │  - Pattern storage            │             │
│  │  - User preference learning   │             │
│  │  - Hypergraph relationships   │             │
│  └───────────────────────────────┘             │
│                           │                     │
│                           ▼                     │
│  ┌───────────┐    ┌──────────────┐            │
│  │  Audio    │◀───│   Output     │            │
│  │  Output   │    │   Mixer      │            │
│  │  (ALSA)   │    │              │            │
│  └───────────┘    └──────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Performance Targets

|Metric                  |Target       |Stretch Goal|
|------------------------|-------------|------------|
|End-to-end latency      |<10ms        |<5ms        |
|CPU usage (4 cores)     |<60%         |<40%        |
|Memory footprint        |<512MB       |<256MB      |
|Storage (patterns)      |<1GB         |<500MB      |
|Pitch detection accuracy|>99%         |>99.5%      |
|Learning convergence    |<100 sessions|<50 sessions|

## Technical Modules

### Module 1: Audio I/O Manager (Rust)

**File**: `src/audio/io_manager.rs`

Responsibilities:

- ALSA interface via `cpal` crate
- Ring buffer management (lock-free)
- Sample rate conversion if needed
- Zero-copy audio path where possible

### Module 2: Pitch Detection Engine

**File**: `src/dsp/pitch_detector.rs`

Algorithms:

- **YIN algorithm** (primary, low-latency)
- **FFT autocorrelation** (fallback, higher accuracy)
- **Harmonic Product Spectrum** (validation)

Features:

- Polyphonic awareness (track harmonics)
- Noise gate with adaptive threshold
- Vibrato preservation mode

### Module 3: Auto-Tune Correction

**File**: `src/dsp/autotune.rs`

Techniques:

- **PSOLA** (Pitch Synchronous Overlap-Add) for time-domain
- **Phase vocoder** for frequency-domain
- **Formant preservation** via linear prediction coding (LPC)

Parameters (user-adjustable):

- Correction strength (0-100%)
- Correction speed (natural to robotic)
- Scale/key constraint
- Retune speed (ms)

### Module 4: AI Enhancement Layer

**File**: `src/ai/enhancer.rs`

Components:

- **Tonal Quality Scorer**: MFCC + neural network (quantized)
- **Spectral Shaper**: EQ curve optimization
- **Micro-timing Adjuster**: Beat alignment with sub-ms precision

Model:

- Lightweight CNN (MobileNet-inspired architecture)
- Quantized INT8 inference via `tract` or `burn`
- On-device training via transfer learning

### Module 5: ruvector Learning System

**File**: `src/learning/ruvector_integration.rs`

Storage schema:

```rust
struct AudioPattern {
    embedding: Vec<f32>,           // 128-dim MFCC features
    pitch_trajectory: Vec<f32>,    // Detected pitch over time
    correction_applied: Vec<f32>,  // What corrections were made
    user_feedback: Option<f32>,    // Explicit or implicit
    context: Vec<String>,          // Genre, mood, artist tags
    timestamp: i64,
}
```

Learning modes:

- **Preference learning**: Track which corrections user keeps/reverts
- **Style adaptation**: Learn genre-specific pitch tolerances
- **Personal voice modeling**: Adapt to individual vocal characteristics
- **Hypergraph relationships**: Link similar patterns across sessions

### Module 6: Web UI (Optional)

**File**: `src/web/server.rs`

Framework: `axum` + WebSocket for real-time monitoring
Features:

- Live waveform/spectrogram display
- Parameter adjustment
- Session playback/comparison
- Learning statistics dashboard

## Hardware Add-ons & Accessories

### Required

1. **USB Audio Interface**
- Recommended: Behringer UCA222 (budget) or Focusrite Scarlett Solo
- Requirements: Class-compliant, 48kHz support, <5ms interface latency
1. **Cooling Solution**
- Argon ONE M.2 case (includes NVMe support) OR
- Active cooler (fan + heatsink)
1. **Power Supply**
- Official RPi 4 power supply (5V/3A USB-C)
- Or powered USB hub if using multiple devices

### Recommended

1. **External SSD**
- 128GB+ NVMe via M.2 adapter OR USB 3.0 SATA SSD
- For ruvector database and pattern storage
1. **Physical Controls** (optional)
- Rotary encoders for real-time parameter tweaking
- GPIO-connected, handled via `rppal` crate
1. **Display** (optional)
- 3.5” TFT LCD via SPI for standalone operation
- Shows live pitch, correction amount, CPU usage

## Software Dependencies

### System Level

```bash
# Audio
sudo apt-get install -y libasound2-dev alsa-utils

# Build tools
sudo apt-get install -y build-essential pkg-config

# ML acceleration (optional)
sudo apt-get install -y libopenblas-dev
```

### Rust Crates

**Core Audio/DSP**:

- `cpal = "0.15"` - Cross-platform audio I/O
- `rustfft = "6.1"` - FFT operations
- `hound = "3.5"` - WAV file I/O for testing
- `rubato = "0.15"` - Resampling
- `dasp = "0.11"` - Digital audio signal processing

**ML/AI**:

- `tract = "0.21"` - Neural network inference (ONNX support)
- `ndarray = "0.15"` - N-dimensional arrays
- `burn = "0.14"` - Deep learning framework (optional)

**ruvector Integration**:

- `ruvector = { path = "../ruvector" }` - Your vector database
- `serde = { version = "1.0", features = ["derive"] }`
- `bincode = "1.3"` - Binary serialization

**Performance**:

- `rayon = "1.8"` - Data parallelism
- `crossbeam = "0.8"` - Lock-free data structures
- `parking_lot = "0.12"` - Faster mutex primitives

**Utilities**:

- `tokio = { version = "1.35", features = ["full"] }` - Async runtime
- `axum = "0.7"` - Web framework (for UI)
- `tracing = "0.1"` - Logging/diagnostics
- `clap = { version = "4.4", features = ["derive"] }` - CLI

**Hardware**:

- `rppal = "0.17"` - Raspberry Pi GPIO/SPI/I2C (for controls)

## Directory Structure

```
magic-ai-music-box/
├── Cargo.toml
├── Cargo.lock
├── README.md
├── src/
│   ├── main.rs                 # Entry point, orchestration
│   ├── config.rs               # Configuration management
│   ├── audio/
│   │   ├── mod.rs
│   │   ├── io_manager.rs       # ALSA/cpal interface
│   │   ├── buffer.rs           # Lock-free ring buffers
│   │   └── processor.rs        # Audio processing pipeline
│   ├── dsp/
│   │   ├── mod.rs
│   │   ├── pitch_detector.rs   # YIN + FFT pitch detection
│   │   ├── autotune.rs         # PSOLA/phase vocoder
│   │   ├── fft.rs              # FFT utilities
│   │   ├── formants.rs         # Formant preservation (LPC)
│   │   └── filters.rs          # High/low-pass, EQ
│   ├── ai/
│   │   ├── mod.rs
│   │   ├── enhancer.rs         # Quality scoring + shaping
│   │   ├── model.rs            # Neural network definitions
│   │   └── inference.rs        # Tract inference wrapper
│   ├── learning/
│   │   ├── mod.rs
│   │   ├── ruvector_integration.rs  # Pattern storage
│   │   ├── preference_learner.rs    # User preference tracking
│   │   └── style_adapter.rs         # Genre/style adaptation
│   ├── web/
│   │   ├── mod.rs
│   │   ├── server.rs           # Axum web server
│   │   ├── handlers.rs         # HTTP/WebSocket handlers
│   │   └── static/             # HTML/CSS/JS assets
│   └── hardware/
│       ├── mod.rs
│       └── controls.rs         # GPIO controls (optional)
├── models/
│   ├── enhancer_model.onnx     # Pre-trained enhancement model
│   └── training_config.json    # Training hyperparameters
├── tests/
│   ├── audio_tests.rs
│   ├── dsp_tests.rs
│   └── integration_tests.rs
└── benches/
    ├── pitch_detection.rs
    └── autotune.rs
```

## Configuration File (TOML)

**File**: `config.toml`

```toml
[audio]
sample_rate = 48000
buffer_size = 256          # Frames, affects latency
channels = 1               # Mono for voice, 2 for stereo
device = "default"         # ALSA device name

[dsp]
pitch_algorithm = "yin"    # "yin" | "fft" | "hps"
noise_gate_threshold = -40 # dB
formant_preservation = true
vibrato_preservation = true

[autotune]
enabled = true
strength = 75              # 0-100%
speed = 50                 # 0 (slow/natural) - 100 (instant/robotic)
scale = "chromatic"        # "chromatic" | "major" | "minor" | custom
key = "C"
retune_speed_ms = 10

[ai]
enabled = true
model_path = "models/enhancer_model.onnx"
inference_threads = 2
quality_threshold = 0.7    # 0-1, below this triggers enhancement

[learning]
enabled = true
ruvector_path = "./data/ruvector.db"
auto_save_interval = 60    # seconds
max_patterns = 10000
embedding_dim = 128

[performance]
worker_threads = 3         # For Rayon
max_cpu_usage = 60         # Percent, throttle if exceeded
priority = "realtime"      # "normal" | "high" | "realtime"

[web]
enabled = false
host = "0.0.0.0"
port = 8080
```

## Deployment & Optimization

### Cross-compilation (from x86_64 to ARM64)

```bash
# Install cross-compilation toolchain
rustup target add aarch64-unknown-linux-gnu
sudo apt-get install gcc-aarch64-linux-gnu

# Add to .cargo/config.toml
cat >> .cargo/config.toml << EOF
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
EOF

# Build
cargo build --release --target aarch64-unknown-linux-gnu

# Binary at: target/aarch64-unknown-linux-gnu/release/magic-ai-music-box
```

### RPi-specific Optimizations

1. **Enable hardware floating-point**:
- Already enabled in modern Raspberry Pi OS (64-bit)
1. **CPU governor**: Set to `performance` for low latency
   
   ```bash
   echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
   ```
1. **Real-time priority**: Use `SCHED_FIFO` for audio thread
   
   ```bash
   # Add to /etc/security/limits.conf
   @audio - rtprio 99
   @audio - memlock unlimited
   ```
1. **Disable unnecessary services**:
   
   ```bash
   sudo systemctl disable bluetooth hciuart
   ```
1. **RAM optimization**: Reduce GPU memory allocation
   
   ```bash
   # In /boot/config.txt
   gpu_mem=16
   ```

## Development Roadmap

### Phase 1: MVP (Weeks 1-2)

- [ ] Basic audio I/O with ALSA
- [ ] YIN pitch detection
- [ ] Simple PSOLA auto-tune
- [ ] CLI interface with live monitoring

### Phase 2: AI Enhancement (Weeks 3-4)

- [ ] Integrate tract for inference
- [ ] Train/import quality scoring model
- [ ] Spectral shaping implementation
- [ ] ruvector integration for pattern storage

### Phase 3: Learning System (Weeks 5-6)

- [ ] Preference learning from user feedback
- [ ] Style adaptation engine
- [ ] Hypergraph relationship mapping
- [ ] Model fine-tuning on-device

### Phase 4: Polish (Weeks 7-8)

- [ ] Web UI with real-time visualization
- [ ] GPIO controls for standalone use
- [ ] Performance optimization (<5ms latency)
- [ ] Documentation and user guide

## Testing Strategy

### Unit Tests

- Pitch detection accuracy (synthetic signals)
- Auto-tune correction precision
- Buffer management (no dropouts)
- ruvector CRUD operations

### Integration Tests

- End-to-end latency measurement
- CPU usage under sustained load
- Memory leak detection (48hr soak test)
- Learning convergence validation

### Real-world Testing

- Various voice types (soprano, tenor, bass)
- Different genres (pop, opera, rap)
- Challenging conditions (background noise, multiple singers)
- User acceptability studies

## Cost-Benefit Analysis

### Hardware Costs

- Raspberry Pi 4 (4GB): $55
- USB audio interface: $30-100
- Case + cooling: $15-40
- microSD card (32GB): $10
- Optional SSD: $30-50
- **Total**: $140-255

### Performance Gains

- **vs. Cloud**: Zero latency added, no internet required
- **vs. Commercial**: 90% cost savings (Pro Tools + iZotope RX: $1000+)
- **Learning**: Personalized to user over time (priceless)

### Market Positioning

- **DIY musicians**: Affordable entry to pitch correction
- **Karaoke systems**: Drop-in upgrade
- **Education**: Learn DSP + AI practically
- **Edge AI showcase**: Demonstrates ruvector capabilities

## Future Enhancements

1. **Multi-singer support**: Source separation + individual correction
1. **Instrument tuning**: Extend to guitar, violin, etc.
1. **Harmony generation**: AI-driven backing vocals
1. **Cloud sync**: Share learned patterns across devices (optional)
1. **Plugin system**: VST-compatible effects chain
1. **Beatboxing enhancement**: Percussive sound optimization

## References & Resources

### Papers

- “YIN, a fundamental frequency estimator for speech and music” (de Cheveigné & Kawahara, 2002)
- “Phase Vocoder Tutorial” (Laroche & Dolson, 1999)
- “MFCC-based Speech Recognition” (Davis & Mermelstein, 1980)

### Libraries

- librosa (Python, for reference implementations)
- Essentia (C++, audio analysis)
- Superpowered Audio SDK (mobile audio processing)

### ruvector Documentation

- [Link to your ruvector repo/docs]
- Hypergraph embedding strategies
- Multi-dimensional similarity search

-----

**Project Lead**: rUv  
**Target Platform**: Raspberry Pi 4 (ARM64)  
**Language**: Rust (stable channel)  
**License**: MIT / Apache 2.0 (recommend dual-license)  
**Status**: Specification complete, ready for implementation
