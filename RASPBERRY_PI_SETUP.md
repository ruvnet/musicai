# Raspberry Pi 4 Setup Guide - Magic AI Music Box

Complete guide for installing and running the Magic AI Music Box on Raspberry Pi 4.

## Hardware Requirements

### Minimum Requirements
- **Raspberry Pi 4 Model B** (2GB RAM minimum)
- **microSD Card**: 16GB or larger (Class 10 recommended)
- **Audio Interface**: USB audio interface or 3.5mm audio jack
- **Power Supply**: Official Raspberry Pi 4 USB-C power supply (5V/3A)

### Recommended Setup
- **Raspberry Pi 4 Model B** (4GB or 8GB RAM)
- **microSD Card**: 32GB or larger (UHS-I)
- **USB Audio Interface**: Professional USB audio interface for best quality
- **Cooling**: Heatsink or fan for sustained performance
- **Power**: Official power supply or PoE HAT

## Software Requirements

### Operating System
- **Raspberry Pi OS** (64-bit) - Recommended
- **Ubuntu 22.04 LTS** (64-bit ARM) - Alternative

## Installation Methods

Choose one of the following installation methods:

### Method 1: Quick Install (Recommended)

Run the automated installation script on your Raspberry Pi:

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/ruvnet/musicai/main/scripts/install-pi.sh | bash

# Or download first, then run
wget https://raw.githubusercontent.com/ruvnet/musicai/main/scripts/install-pi.sh
chmod +x install-pi.sh
./install-pi.sh
```

### Method 2: Manual Installation

#### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

#### Step 2: Install Node.js

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

#### Step 3: Install Rust

```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

#### Step 4: Clone Repository

```bash
cd ~
git clone https://github.com/ruvnet/musicai.git
cd musicai
```

#### Step 5: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install audio system dependencies
sudo apt install -y \
  libasound2-dev \
  pulseaudio \
  pulseaudio-utils \
  alsa-utils \
  portaudio19-dev
```

#### Step 6: Build the Project

```bash
# Build TypeScript and Rust
npm run build

# This may take 10-15 minutes on Raspberry Pi 4
```

#### Step 7: Run Tests

```bash
# Run unit tests
npm run test:unit

# Run full demo
npm run demo
```

### Method 3: Cross-Compilation (Development Machine)

If you want to build on a faster machine and deploy to Raspberry Pi:

#### On Your Development Machine (Linux/macOS/WSL)

```bash
# Install cross-compilation tools
cargo install cross

# Build for Raspberry Pi 4 (aarch64)
cross build --release --target aarch64-unknown-linux-gnu

# The binary will be in target/aarch64-unknown-linux-gnu/release/
```

#### Transfer to Raspberry Pi

```bash
# Create deployment package
npm run build:ts
tar -czf musicai-pi.tar.gz dist/ node_modules/ package.json

# Copy to Raspberry Pi
scp musicai-pi.tar.gz pi@raspberrypi.local:~/

# On Raspberry Pi, extract and run
ssh pi@raspberrypi.local
tar -xzf musicai-pi.tar.gz
cd musicai
npm start
```

## Audio Configuration

### Configure ALSA (Advanced Linux Sound Architecture)

```bash
# List audio devices
aplay -l

# Test audio output
speaker-test -t wav -c 2

# Edit ALSA configuration (if needed)
sudo nano /etc/asound.conf
```

Sample ALSA configuration:

```conf
pcm.!default {
    type hw
    card 0
    device 0
}

ctl.!default {
    type hw
    card 0
}
```

### Configure PulseAudio

```bash
# Start PulseAudio
pulseaudio --start

# Check PulseAudio status
pactl info

# List sinks (output devices)
pactl list sinks short

# Set default sink
pactl set-default-sink <sink-name>
```

### Test Audio with Magic AI Music Box

```bash
# Run the real audio test
npm run build:ts && npx tsx demo/real-audio-test.ts
```

## Running as a Service

### Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/musicai.service
```

Add the following content:

```ini
[Unit]
Description=Magic AI Music Box
After=network.target sound.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/musicai
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

# Resource limits
MemoryLimit=1G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable musicai

# Start the service
sudo systemctl start musicai

# Check status
sudo systemctl status musicai

# View logs
sudo journalctl -u musicai -f
```

## Performance Optimization

### 1. Increase Swap Space (for 2GB Pi models)

```bash
# Stop swap
sudo dphys-swapfile swapoff

# Edit swap configuration
sudo nano /etc/dphys-swapfile
# Change: CONF_SWAPSIZE=2048

# Restart swap
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 2. Overclock Raspberry Pi 4 (Optional)

```bash
# Edit boot config
sudo nano /boot/config.txt

# Add these lines (use with adequate cooling!)
over_voltage=6
arm_freq=2000
gpu_freq=750
```

**Warning**: Only overclock with proper cooling. Monitor temperatures with:

```bash
vcgencmd measure_temp
```

### 3. Optimize Node.js

Create `.env` file in project root:

```bash
# Optimize for Raspberry Pi
NODE_OPTIONS="--max-old-space-size=1024"
UV_THREADPOOL_SIZE=4
```

### 4. Audio Latency Optimization

Edit `/boot/config.txt`:

```bash
# Enable hardware PWM for better audio
dtoverlay=pwm-2chan
dtparam=audio=on

# Increase USB performance
dwc_otg.fiq_fsm_enable=0
dwc_otg.fiq_fsm_mask=0x3
```

### 5. CPU Governor

Set CPU to performance mode:

```bash
# Set performance governor
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Make permanent
sudo nano /etc/rc.local
# Add before 'exit 0':
# echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## Docker Installation (Alternative)

### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi

# Log out and back in for group changes
```

### Build Docker Image

```bash
cd ~/musicai

# Build for ARM64
docker build -t musicai:latest -f Dockerfile.pi .

# Run container
docker run -d \
  --name musicai \
  --device /dev/snd \
  --restart unless-stopped \
  -p 3000:3000 \
  musicai:latest
```

### Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  musicai:
    build:
      context: .
      dockerfile: Dockerfile.pi
    container_name: musicai
    restart: unless-stopped
    devices:
      - /dev/snd:/dev/snd
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=1024
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:

```bash
docker-compose up -d
```

## Monitoring and Maintenance

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor system resources
htop

# Monitor temperature
watch -n 1 vcgencmd measure_temp

# Monitor disk usage
df -h

# Monitor memory
free -h
```

### Log Management

```bash
# View application logs
sudo journalctl -u musicai -n 100

# Follow logs in real-time
sudo journalctl -u musicai -f

# Clear old logs
sudo journalctl --vacuum-time=7d
```

### Update the Application

```bash
cd ~/musicai

# Stop service
sudo systemctl stop musicai

# Pull updates
git pull origin main

# Rebuild
npm install
npm run build

# Start service
sudo systemctl start musicai

# Check status
sudo systemctl status musicai
```

## Backup and Recovery

### Backup Configuration

```bash
# Backup data directory
tar -czf musicai-backup-$(date +%Y%m%d).tar.gz \
  ~/musicai/data \
  ~/musicai/.env \
  /etc/systemd/system/musicai.service

# Copy to safe location
scp musicai-backup-*.tar.gz user@backup-server:/backups/
```

### Create SD Card Image

```bash
# On another Linux machine with SD card reader
# Backup entire SD card
sudo dd if=/dev/mmcblk0 of=musicai-pi-backup.img bs=4M status=progress

# Compress
gzip musicai-pi-backup.img
```

## Troubleshooting

### Audio Issues

```bash
# Check audio devices
aplay -l
pactl list sinks

# Test audio output
speaker-test -t wav -c 2

# Restart PulseAudio
pulseaudio --kill
pulseaudio --start
```

### Performance Issues

```bash
# Check CPU throttling
vcgencmd get_throttled
# 0x0 = OK
# 0x50000 = Throttling occurred

# Check temperature
vcgencmd measure_temp
# Should be below 80°C

# Check memory
free -h

# Check swap usage
swapon --show
```

### Service Won't Start

```bash
# Check logs
sudo journalctl -u musicai -n 50

# Check file permissions
ls -la ~/musicai

# Verify Node.js
node --version
npm --version

# Test manually
cd ~/musicai
npm start
```

### Build Failures

```bash
# Clear build cache
rm -rf node_modules dist target
npm cache clean --force

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

## Network Configuration

### Enable SSH Access

```bash
# Enable SSH
sudo systemctl enable ssh
sudo systemctl start ssh

# Configure firewall (if using)
sudo ufw allow ssh
sudo ufw enable
```

### Static IP Address

Edit `/etc/dhcpcd.conf`:

```bash
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Restart networking:

```bash
sudo systemctl restart dhcpcd
```

## Production Deployment Checklist

- [ ] Raspberry Pi OS 64-bit installed
- [ ] System fully updated
- [ ] Node.js 20.x installed
- [ ] Rust toolchain installed
- [ ] Audio system configured and tested
- [ ] Application built successfully
- [ ] Unit tests passing
- [ ] Demo runs without errors
- [ ] Systemd service configured
- [ ] Service starts on boot
- [ ] Logs are accessible
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Temperature monitoring active
- [ ] Network access configured
- [ ] Security updates enabled

## Security Considerations

### System Security

```bash
# Update regularly
sudo apt update && sudo apt upgrade -y

# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure firewall
sudo apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable
```

### Application Security

```bash
# Run as non-root user (already configured in service)
# Never run npm start as root

# Use environment variables for sensitive data
echo "API_KEY=your_secret_key" >> ~/.env
```

## Support and Resources

- **Documentation**: `/home/pi/musicai/IMPLEMENTATION_RESULTS.md`
- **Quick Start**: `/home/pi/musicai/QUICK_START.md`
- **GitHub**: https://github.com/ruvnet/musicai
- **Raspberry Pi Forums**: https://forums.raspberrypi.com/

## Performance Expectations

On Raspberry Pi 4 (4GB), expect:

- **Audio Processing Latency**: 2-5ms (excellent for real-time)
- **Task Throughput**: 10,000-20,000 ops/sec
- **Memory Usage**: 200-400MB
- **CPU Usage**: 20-40% (all cores)
- **Temperature**: 50-70°C (with heatsink)

## Next Steps

After installation:

1. Run the demo: `npm run demo`
2. Run benchmarks: `npm run benchmark`
3. Test real audio: `npx tsx demo/real-audio-test.ts`
4. Read the API documentation
5. Start building your music applications!

🎵 **Enjoy your Magic AI Music Box!** 🎵
