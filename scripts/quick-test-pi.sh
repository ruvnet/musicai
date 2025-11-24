#!/bin/bash
#
# Quick Test Script for Raspberry Pi
# Runs basic system checks and tests
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║        🎵  Magic AI Music Box - Quick Test  🎵                  ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Test 1: System Information
echo -e "${GREEN}▶ System Information${NC}"
echo "  Architecture: $(uname -m)"
echo "  Kernel: $(uname -r)"
echo "  OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "  Memory: $(free -h | awk 'NR==2{print $2}')"
if command -v vcgencmd &> /dev/null; then
    echo "  Temperature: $(vcgencmd measure_temp)"
fi
echo ""

# Test 2: Node.js and npm
echo -e "${GREEN}▶ Node.js Environment${NC}"
if command -v node &> /dev/null; then
    echo "  ✓ Node.js: $(node --version)"
else
    echo "  ✗ Node.js: Not installed"
    exit 1
fi

if command -v npm &> /dev/null; then
    echo "  ✓ npm: $(npm --version)"
else
    echo "  ✗ npm: Not installed"
    exit 1
fi
echo ""

# Test 3: Rust
echo -e "${GREEN}▶ Rust Environment${NC}"
if command -v rustc &> /dev/null; then
    echo "  ✓ Rust: $(rustc --version | cut -d' ' -f2)"
    echo "  ✓ Cargo: $(cargo --version | cut -d' ' -f2)"
else
    echo "  ⚠ Rust: Not installed (optional)"
fi
echo ""

# Test 4: Audio System
echo -e "${GREEN}▶ Audio System${NC}"
if command -v aplay &> /dev/null; then
    AUDIO_CARDS=$(aplay -l 2>/dev/null | grep "^card" | wc -l)
    echo "  ✓ ALSA installed"
    echo "  ✓ Audio devices: $AUDIO_CARDS"
else
    echo "  ✗ ALSA: Not installed"
fi

if pgrep -x "pulseaudio" > /dev/null; then
    echo "  ✓ PulseAudio: Running"
else
    echo "  ⚠ PulseAudio: Not running"
fi
echo ""

# Test 5: Project Files
echo -e "${GREEN}▶ Project Status${NC}"
if [ -f "package.json" ]; then
    echo "  ✓ package.json found"
else
    echo "  ✗ package.json not found"
    echo "  Please run from project directory"
    exit 1
fi

if [ -d "node_modules" ]; then
    echo "  ✓ Dependencies installed"
else
    echo "  ⚠ Dependencies not installed (run: npm install)"
fi

if [ -d "dist" ]; then
    echo "  ✓ TypeScript compiled"
else
    echo "  ⚠ TypeScript not compiled (run: npm run build:ts)"
fi
echo ""

# Test 6: Run Quick Tests
echo -e "${GREEN}▶ Running Quick Tests${NC}"

if [ -d "dist" ] && [ -d "node_modules" ]; then
    echo "  Running unit tests..."

    if npm run test:unit --silent 2>&1 | grep -q "Tests.*passed"; then
        echo "  ✓ Unit tests passed"
    else
        echo "  ⚠ Some tests failed"
    fi
else
    echo "  ⚠ Skipping tests (build first)"
fi
echo ""

# Test 7: Performance Check
echo -e "${GREEN}▶ Performance Check${NC}"

# CPU cores
CPU_CORES=$(nproc)
echo "  CPU Cores: $CPU_CORES"

# Current frequency
if [ -f /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq ]; then
    FREQ=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq)
    FREQ_MHZ=$((FREQ / 1000))
    echo "  CPU Frequency: ${FREQ_MHZ}MHz"
fi

# Governor
if [ -f /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor ]; then
    GOVERNOR=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)
    echo "  CPU Governor: $GOVERNOR"
fi

# Available memory
AVAIL_MEM=$(free -h | awk 'NR==2{print $7}')
echo "  Available Memory: $AVAIL_MEM"
echo ""

# Final Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     Quick Test Complete!                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. If tests passed, run full demo:"
echo "     ${GREEN}npm run demo${NC}"
echo ""
echo "  2. Run performance benchmarks:"
echo "     ${GREEN}npm run benchmark${NC}"
echo ""
echo "  3. Test with real audio:"
echo "     ${GREEN}npx tsx demo/real-audio-test.ts${NC}"
echo ""
echo "  4. Start as service:"
echo "     ${GREEN}sudo systemctl start musicai${NC}"
echo ""
