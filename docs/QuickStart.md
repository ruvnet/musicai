# Quick Start Guide - Magic AI Music Box

## 5-Minute Setup for Raspberry Pi 4

### Prerequisites Checklist

- [ ] Raspberry Pi 4 (4GB+ RAM)
- [ ] Raspberry Pi OS 64-bit installed
- [ ] USB audio interface connected
- [ ] Internet connection
- [ ] Keyboard & monitor (or SSH access)

### Step 1: System Preparation (5 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    libasound2-dev \
    alsa-utils \
    build-essential \
    pkg-config \
    git

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add user to audio group
sudo usermod -a -G audio $USER

# Enable real-time audio priority
echo "@audio - rtprio 99" | sudo tee -a /etc/security/limits.conf
echo "@audio - memlock unlimited" | sudo tee -a /etc/security/limits.conf

# Reboot
sudo reboot
```

### Step 2: Build & Install (10 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/magic-ai-music-box.git
cd magic-ai-music-box

# Build (takes ~8-10 minutes on RPi4)
cargo build --release

# Install binary
sudo cp target/release/music-box /usr/local/bin/

# Verify installation
music-box --version
```

### Step 3: Configuration (2 minutes)

```bash
# Create config directory
mkdir -p ~/.config/music-box

# Generate default config
music-box generate-config --output ~/.config/music-box/config.toml

# List audio devices
music-box list-devices

# Edit config (set your audio device)
nano ~/.config/music-box/config.toml
```

**Key settings to check:**

```toml
[audio]
device = "YOUR_USB_AUDIO_DEVICE_NAME"  # From list-devices output
buffer_size = 256                       # Start with this
sample_rate = 48000                     # Match your device

[performance]
priority = "realtime"                   # Important!
worker_threads = 3                      # Good for RPi4
```

### Step 4: First Run (1 minute)

```bash
# Test run
music-box run --config ~/.config/music-box/config.toml --verbose

# You should see:
# Magic AI Music Box starting...
# Configuration loaded:
#   Sample rate: 48000 Hz
#   Buffer size: 256 frames
#   Expected latency: 5.33 ms
# Audio streams started successfully
# Performance: avg=4.21ms, max=6.12ms, frames=150
```

Press Ctrl+C to stop.

### Step 5: Auto-Start (Optional, 2 minutes)

```bash
# Create systemd service
sudo nano /etc/systemd/system/music-box.service
```

Paste this content:

```ini
[Unit]
Description=Magic AI Music Box
After=sound.target

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/music-box run --config /home/pi/.config/music-box/config.toml
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable music-box
sudo systemctl start music-box

# Check status
sudo systemctl status music-box
```

## Testing Your Setup

### Audio Loop Test

Connect microphone to input, headphones to output:

```bash
# Sing or speak into the microphone
# You should hear your voice with auto-tune applied
# Try singing off-key to test pitch correction
```

### Performance Check

```bash
# Watch logs for performance metrics
sudo journalctl -u music-box -f

# Good performance indicators:
# - avg latency < 8ms
# - CPU usage < 60%
# - No "buffer full" warnings
# - No "processing too slow" warnings
```

## Tuning for Your Voice

### For Natural Correction

```toml
[autotune]
strength = 50              # Subtle correction
speed = 30                 # Slow, natural retune
vibrato_preservation = true
```

### For Pop/Radio Effect

```toml
[autotune]
strength = 90              # Strong correction
speed = 80                 # Fast, modern sound
retune_speed_ms = 5
```

### For Robotic Effect

```toml
[autotune]
strength = 100             # Maximum correction
speed = 100                # Instant retune
retune_speed_ms = 0
```

## Common Issues & Quick Fixes

### Issue: Crackling or Dropouts

**Solution 1**: Increase buffer size

```toml
[audio]
buffer_size = 512
```

**Solution 2**: Set CPU governor

```bash
echo "performance" | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### Issue: Too Much Latency

**Solution**: Decrease buffer size (if CPU allows)

```toml
[audio]
buffer_size = 128  # Try this, monitor CPU
```

### Issue: No Audio Input

**Solution**: Check ALSA setup

```bash
# List input devices
arecord -l

# Test recording
arecord -f cd -d 5 test.wav

# Verify device name in config matches exactly
```

### Issue: High CPU Usage

**Solution 1**: Disable AI features

```toml
[ai]
enabled = false

[learning]
enabled = false
```

**Solution 2**: Use simpler algorithm

```toml
[dsp]
pitch_algorithm = "fft"  # Faster than YIN
```

## Optimization Tips

### For Lowest Latency (<5ms)

```toml
[audio]
buffer_size = 128
sample_rate = 48000

[performance]
priority = "realtime"
worker_threads = 3

[ai]
enabled = false           # Disable for ultra-low latency
```

System tweaks:

```bash
# CPU performance mode
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Disable unnecessary services
sudo systemctl disable bluetooth hciuart
```

### For Best Quality

```toml
[audio]
buffer_size = 512
sample_rate = 48000

[dsp]
formant_preservation = true
vibrato_preservation = true

[ai]
enabled = true
quality_threshold = 0.8

[learning]
enabled = true
```

### For Learning & Adaptation

```toml
[learning]
enabled = true
auto_save_interval = 30
max_patterns = 10000
embedding_dim = 128
```

After 50-100 sessions, the system will learn your preferences:

```bash
# Check learning progress
music-box stats

# You'll see patterns like:
# Total patterns: 850
# Average feedback: 0.82
# Preferred strength: 68.5%
```

## Next Steps

1. **Test with different voices** - soprano, tenor, bass
1. **Try different scales** - major, minor, chromatic
1. **Experiment with strength/speed** - find your sweet spot
1. **Enable learning** - let it adapt to your style
1. **Add physical controls** - rotary encoders via GPIO

## Performance Targets

|Metric   |Target |How to Check             |
|---------|-------|-------------------------|
|Latency  |<10ms  |Watch verbose output     |
|CPU Usage|<60%   |`htop` or systemd logs   |
|Dropouts |0      |No “buffer full” warnings|
|Quality  |Natural|Your ears!               |

## Getting Help

- Check logs: `sudo journalctl -u music-box -f`
- Enable verbose: `music-box run --verbose`
- Test devices: `music-box list-devices`
- View stats: `music-box stats`

## Hardware Upgrades

For better performance:

1. **Add heatsink/fan** - Critical for sustained use
1. **Use SSD instead of microSD** - Faster I/O for learning
1. **Quality USB audio interface** - Focusrite Scarlett recommended
1. **Powered USB hub** - If using multiple USB devices

Enjoy your Magic AI Music Box! 🎵🤖
