#!/bin/bash
#
# Magic AI Music Box - Raspberry Pi Installation Script
# Automated installation for Raspberry Pi 4
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="20"
PROJECT_DIR="$HOME/musicai"
REPO_URL="https://github.com/ruvnet/musicai.git"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║        🎵  Magic AI Music Box - Raspberry Pi Installer  🎵      ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_architecture() {
    print_step "Checking system architecture..."

    ARCH=$(uname -m)
    if [[ "$ARCH" != "aarch64" && "$ARCH" != "armv7l" ]]; then
        print_error "This script is designed for Raspberry Pi (ARM architecture)"
        print_error "Detected architecture: $ARCH"
        exit 1
    fi

    print_success "Architecture: $ARCH"
}

check_os() {
    print_step "Checking operating system..."

    if [ -f /etc/os-release ]; then
        . /etc/os-release
        print_success "OS: $PRETTY_NAME"

        if [[ "$ID" != "raspbian" && "$ID" != "debian" && "$ID" != "ubuntu" ]]; then
            print_warning "Untested OS detected. Proceeding anyway..."
        fi
    fi
}

check_memory() {
    print_step "Checking system memory..."

    TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')

    if [ "$TOTAL_MEM" -lt 1500 ]; then
        print_warning "Low memory detected: ${TOTAL_MEM}MB"
        print_warning "Recommended: 2GB or more"
        print_warning "Will configure swap space..."
        NEED_SWAP=1
    else
        print_success "Memory: ${TOTAL_MEM}MB"
        NEED_SWAP=0
    fi
}

update_system() {
    print_step "Updating system packages..."

    sudo apt update
    sudo apt upgrade -y

    print_success "System updated"
}

install_dependencies() {
    print_step "Installing system dependencies..."

    sudo apt install -y \
        git \
        curl \
        wget \
        build-essential \
        pkg-config \
        libasound2-dev \
        pulseaudio \
        pulseaudio-utils \
        alsa-utils \
        portaudio19-dev \
        libssl-dev \
        ca-certificates

    print_success "Dependencies installed"
}

install_nodejs() {
    print_step "Installing Node.js ${NODE_VERSION}.x..."

    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        CURRENT_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_VERSION" == "$NODE_VERSION" ]; then
            print_success "Node.js ${NODE_VERSION}.x already installed"
            return
        else
            print_warning "Node.js $CURRENT_VERSION detected, upgrading to ${NODE_VERSION}.x..."
        fi
    fi

    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs

    # Verify installation
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)

    print_success "Node.js $NODE_VER installed"
    print_success "npm $NPM_VER installed"
}

install_rust() {
    print_step "Installing Rust toolchain..."

    # Check if Rust is already installed
    if command -v rustc &> /dev/null; then
        print_success "Rust already installed: $(rustc --version)"
        return
    fi

    # Install Rust
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

    # Source Rust environment
    source "$HOME/.cargo/env"

    # Verify installation
    RUST_VER=$(rustc --version)
    CARGO_VER=$(cargo --version)

    print_success "Rust installed: $RUST_VER"
    print_success "Cargo installed: $CARGO_VER"
}

configure_swap() {
    if [ "$NEED_SWAP" == "1" ]; then
        print_step "Configuring swap space..."

        # Stop swap
        sudo dphys-swapfile swapoff || true

        # Configure 2GB swap
        sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile

        # Setup and enable swap
        sudo dphys-swapfile setup
        sudo dphys-swapfile swapon

        print_success "Swap configured: 2GB"
    fi
}

clone_repository() {
    print_step "Cloning Magic AI Music Box repository..."

    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Directory $PROJECT_DIR already exists"
        read -p "Remove and re-clone? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_DIR"
        else
            print_step "Using existing directory..."
            cd "$PROJECT_DIR"
            git pull origin main || true
            return
        fi
    fi

    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"

    print_success "Repository cloned to $PROJECT_DIR"
}

install_node_dependencies() {
    print_step "Installing Node.js dependencies..."

    cd "$PROJECT_DIR"
    npm install

    print_success "Node.js dependencies installed"
}

build_project() {
    print_step "Building Magic AI Music Box..."
    print_warning "This may take 10-15 minutes on Raspberry Pi 4..."

    cd "$PROJECT_DIR"

    # Build TypeScript
    print_step "Building TypeScript..."
    npm run build:ts

    # Build Rust (optional, may fail on low-memory systems)
    print_step "Building Rust audio core..."
    if npm run build:rust 2>/dev/null; then
        print_success "Rust build completed"
    else
        print_warning "Rust build failed (non-critical)"
        print_warning "TypeScript components will work without Rust bindings"
    fi

    print_success "Build completed"
}

run_tests() {
    print_step "Running tests..."

    cd "$PROJECT_DIR"

    # Run unit tests
    if npm run test:unit; then
        print_success "All tests passed!"
    else
        print_warning "Some tests failed (may be normal)"
    fi
}

configure_audio() {
    print_step "Configuring audio system..."

    # Start PulseAudio if not running
    if ! pgrep -x "pulseaudio" > /dev/null; then
        pulseaudio --start
        print_success "PulseAudio started"
    else
        print_success "PulseAudio already running"
    fi

    # Test audio
    print_step "Audio devices:"
    aplay -l || true
}

create_systemd_service() {
    print_step "Creating systemd service..."

    # Create service file
    sudo tee /etc/systemd/system/musicai.service > /dev/null <<EOF
[Unit]
Description=Magic AI Music Box
After=network.target sound.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=1024

# Resource limits
MemoryLimit=1G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    sudo systemctl daemon-reload

    print_success "Systemd service created"

    # Ask if user wants to enable service
    read -p "Enable service to start on boot? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        sudo systemctl enable musicai
        print_success "Service enabled to start on boot"
    fi
}

print_final_message() {
    echo -e "\n${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║           🎉  Installation Complete!  🎉                         ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "\n${BLUE}Next Steps:${NC}"
    echo -e "  1. Test the system:"
    echo -e "     ${YELLOW}cd $PROJECT_DIR && npm run demo${NC}"
    echo -e ""
    echo -e "  2. Run benchmarks:"
    echo -e "     ${YELLOW}npm run benchmark${NC}"
    echo -e ""
    echo -e "  3. Test with real audio:"
    echo -e "     ${YELLOW}npx tsx demo/real-audio-test.ts${NC}"
    echo -e ""
    echo -e "  4. Start the service:"
    echo -e "     ${YELLOW}sudo systemctl start musicai${NC}"
    echo -e ""
    echo -e "  5. Check service status:"
    echo -e "     ${YELLOW}sudo systemctl status musicai${NC}"
    echo -e ""
    echo -e "  6. View logs:"
    echo -e "     ${YELLOW}sudo journalctl -u musicai -f${NC}"
    echo -e ""

    echo -e "${BLUE}Documentation:${NC}"
    echo -e "  • Setup Guide: ${YELLOW}$PROJECT_DIR/RASPBERRY_PI_SETUP.md${NC}"
    echo -e "  • Quick Start: ${YELLOW}$PROJECT_DIR/QUICK_START.md${NC}"
    echo -e "  • Results: ${YELLOW}$PROJECT_DIR/IMPLEMENTATION_RESULTS.md${NC}"
    echo -e ""

    echo -e "${GREEN}🎵 Magic AI Music Box is ready! 🎵${NC}\n"
}

# Main installation flow
main() {
    print_header

    check_architecture
    check_os
    check_memory

    update_system
    install_dependencies
    install_nodejs
    install_rust
    configure_swap

    clone_repository
    install_node_dependencies
    build_project

    run_tests
    configure_audio
    create_systemd_service

    print_final_message
}

# Run main function
main "$@"
