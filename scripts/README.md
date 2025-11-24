# Raspberry Pi Deployment Scripts

This directory contains scripts for deploying and managing the Magic AI Music Box on Raspberry Pi.

## Installation Scripts

### `install-pi.sh`
**Purpose**: Automated installation on Raspberry Pi

**Usage**:
```bash
# Quick install (recommended)
curl -fsSL https://raw.githubusercontent.com/ruvnet/musicai/main/scripts/install-pi.sh | bash

# Or download and run
wget https://raw.githubusercontent.com/ruvnet/musicai/main/scripts/install-pi.sh
chmod +x install-pi.sh
./install-pi.sh
```

**What it does**:
- Checks system requirements
- Installs Node.js 20.x
- Installs Rust toolchain
- Clones repository
- Builds project
- Configures audio system
- Creates systemd service
- Runs tests

**Requirements**:
- Raspberry Pi 4 (2GB+ RAM)
- Raspberry Pi OS 64-bit
- Internet connection

## Testing Scripts

### `quick-test-pi.sh`
**Purpose**: Quick system and application health check

**Usage**:
```bash
cd ~/musicai
./scripts/quick-test-pi.sh
```

**What it checks**:
- System architecture and OS
- Node.js and npm versions
- Rust installation
- Audio system status
- Project dependencies
- TypeScript compilation
- Unit tests
- CPU and memory availability

## Deployment Scripts

### `deploy-to-pi.sh`
**Purpose**: Deploy from development machine to Raspberry Pi

**Usage**:
```bash
# From your development machine
cd /path/to/musicai
./scripts/deploy-to-pi.sh

# Or specify custom host
PI_HOST=192.168.1.100 PI_USER=pi ./scripts/deploy-to-pi.sh
```

**What it does**:
- Builds project locally
- Creates deployment package
- Copies to Raspberry Pi via SSH
- Extracts and installs on Pi
- Restarts service
- Shows status

**Requirements**:
- SSH access to Raspberry Pi
- Raspberry Pi already set up with initial installation

**Environment Variables**:
- `PI_HOST`: Raspberry Pi hostname/IP (default: raspberrypi.local)
- `PI_USER`: SSH username (default: pi)

## Monitoring Scripts

### `monitor-pi.sh`
**Purpose**: Interactive system monitoring dashboard

**Usage**:
```bash
cd ~/musicai
./scripts/monitor-pi.sh
```

**Features**:
- Real-time system information
- Temperature monitoring
- Throttling detection
- CPU and memory usage
- Service status
- Network information
- Audio devices
- Recent logs

**Interactive Commands**:
- `r`: Refresh display
- `s`: Start service
- `t`: Stop service
- `l`: View live logs
- `q`: Quit

## Service Configuration

### `musicai.service`
**Purpose**: Systemd service template

**Installation**:
```bash
sudo cp scripts/musicai.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable musicai
sudo systemctl start musicai
```

**Service Management**:
```bash
# Start service
sudo systemctl start musicai

# Stop service
sudo systemctl stop musicai

# Restart service
sudo systemctl restart musicai

# View status
sudo systemctl status musicai

# Enable auto-start
sudo systemctl enable musicai

# Disable auto-start
sudo systemctl disable musicai

# View logs
sudo journalctl -u musicai -f
```

## Docker Deployment

### `Dockerfile.pi`
**Purpose**: Docker image for Raspberry Pi

**Build**:
```bash
docker build -t musicai:latest -f Dockerfile.pi .
```

**Run**:
```bash
docker run -d \
  --name musicai \
  --device /dev/snd \
  --restart unless-stopped \
  musicai:latest
```

### `docker-compose.pi.yml`
**Purpose**: Docker Compose configuration

**Usage**:
```bash
# Start
docker-compose -f docker-compose.pi.yml up -d

# Stop
docker-compose -f docker-compose.pi.yml down

# View logs
docker-compose -f docker-compose.pi.yml logs -f

# Rebuild
docker-compose -f docker-compose.pi.yml up -d --build
```

## Common Workflows

### First-Time Installation

1. Download and run installer:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/ruvnet/musicai/main/scripts/install-pi.sh | bash
   ```

2. Wait for installation (10-15 minutes)

3. Run quick test:
   ```bash
   cd ~/musicai
   ./scripts/quick-test-pi.sh
   ```

4. Start the service:
   ```bash
   sudo systemctl start musicai
   ```

### Daily Operations

**Check system health**:
```bash
cd ~/musicai
./scripts/monitor-pi.sh
```

**View logs**:
```bash
sudo journalctl -u musicai -f
```

**Restart service**:
```bash
sudo systemctl restart musicai
```

### Updating the Application

**From Raspberry Pi**:
```bash
cd ~/musicai
git pull
npm install
npm run build
sudo systemctl restart musicai
```

**From development machine**:
```bash
./scripts/deploy-to-pi.sh
```

### Troubleshooting

**Service won't start**:
```bash
# Check logs
sudo journalctl -u musicai -n 50

# Check file permissions
ls -la ~/musicai

# Test manually
cd ~/musicai
npm start
```

**Audio not working**:
```bash
# List audio devices
aplay -l

# Test audio
speaker-test -t wav -c 2

# Restart PulseAudio
pulseaudio --kill
pulseaudio --start
```

**High temperature**:
```bash
# Check temperature
vcgencmd measure_temp

# Check throttling
vcgencmd get_throttled

# Add heatsink or fan
# Reduce CPU usage in service config
```

## Script Permissions

All scripts should be executable:

```bash
chmod +x scripts/*.sh
```

## Environment Variables

Scripts support these environment variables:

- `PI_HOST`: Raspberry Pi hostname/IP
- `PI_USER`: SSH username
- `PI_DIR`: Installation directory
- `NODE_VERSION`: Node.js version to install

Example:
```bash
PI_HOST=192.168.1.100 ./scripts/deploy-to-pi.sh
```

## Security Notes

1. **SSH Keys**: Use SSH keys instead of passwords
   ```bash
   ssh-copy-id pi@raspberrypi.local
   ```

2. **Firewall**: Configure UFW if exposed to internet
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   ```

3. **Updates**: Keep system updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Service User**: Service runs as `pi` user (non-root)

5. **Secrets**: Use environment variables for sensitive data

## Support

For issues with scripts:
1. Check the full documentation: `../RASPBERRY_PI_SETUP.md`
2. Review logs: `sudo journalctl -u musicai`
3. Run quick test: `./scripts/quick-test-pi.sh`
4. Open GitHub issue with error details

## Contributing

To improve these scripts:
1. Test on Raspberry Pi 4
2. Update documentation
3. Submit pull request
4. Include test results

## License

MIT License - See LICENSE file
