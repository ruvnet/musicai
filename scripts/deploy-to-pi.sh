#!/bin/bash
#
# Deploy Magic AI Music Box to Raspberry Pi
# Run this script from your development machine
#

set -e

# Configuration
PI_HOST="${PI_HOST:-raspberrypi.local}"
PI_USER="${PI_USER:-pi}"
PI_DIR="/home/pi/musicai"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found"
    print_error "Please run this script from the musicai project root"
    exit 1
fi

print_step "Building project locally..."
npm run build:ts

print_step "Creating deployment package..."
rm -f musicai-deploy.tar.gz

tar -czf musicai-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='target' \
    --exclude='*.tar.gz' \
    --exclude='.env.local' \
    dist/ \
    package.json \
    package-lock.json \
    tsconfig.json \
    demo/ \
    docs/ \
    *.md

print_success "Deployment package created: musicai-deploy.tar.gz"

print_step "Testing connection to Raspberry Pi ($PI_HOST)..."
if ssh -o ConnectTimeout=5 "$PI_USER@$PI_HOST" "echo 'Connected'" > /dev/null 2>&1; then
    print_success "Connected to $PI_HOST"
else
    print_error "Cannot connect to $PI_HOST"
    print_error "Make sure SSH is enabled and the hostname/IP is correct"
    exit 1
fi

print_step "Copying deployment package to Raspberry Pi..."
scp musicai-deploy.tar.gz "$PI_USER@$PI_HOST:/tmp/"

print_step "Deploying on Raspberry Pi..."
ssh "$PI_USER@$PI_HOST" << 'ENDSSH'
set -e

# Stop service if running
sudo systemctl stop musicai 2>/dev/null || true

# Create directory if it doesn't exist
mkdir -p /home/pi/musicai
cd /home/pi/musicai

# Backup old installation
if [ -d "dist" ]; then
    echo "Backing up old installation..."
    tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" dist/ package.json 2>/dev/null || true
fi

# Extract new deployment
echo "Extracting deployment package..."
tar -xzf /tmp/musicai-deploy.tar.gz

# Install/update dependencies
echo "Installing dependencies..."
npm install --production

# Clean up
rm -f /tmp/musicai-deploy.tar.gz

echo "Deployment complete!"
ENDSSH

print_step "Starting service..."
ssh "$PI_USER@$PI_HOST" "sudo systemctl start musicai 2>/dev/null || true"

print_step "Checking service status..."
ssh "$PI_USER@$PI_HOST" "sudo systemctl status musicai --no-pager || true"

print_success "Deployment complete!"

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "  • View logs: ${YELLOW}ssh $PI_USER@$PI_HOST 'sudo journalctl -u musicai -f'${NC}"
echo -e "  • Check status: ${YELLOW}ssh $PI_USER@$PI_HOST 'sudo systemctl status musicai'${NC}"
echo -e "  • Run tests: ${YELLOW}ssh $PI_USER@$PI_HOST 'cd $PI_DIR && npm test'${NC}"
echo ""

# Clean up local file
rm -f musicai-deploy.tar.gz
