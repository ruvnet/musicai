#!/bin/bash
#
# Monitoring script for Magic AI Music Box on Raspberry Pi
# Displays system health, temperature, and application status
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
get_temp() {
    if command -v vcgencmd &> /dev/null; then
        TEMP=$(vcgencmd measure_temp | sed 's/temp=//' | sed "s/'C//")
        echo "$TEMP°C"
    else
        echo "N/A"
    fi
}

get_throttle_status() {
    if command -v vcgencmd &> /dev/null; then
        THROTTLE=$(vcgencmd get_throttled)
        THROTTLE_HEX=$(echo "$THROTTLE" | cut -d'=' -f2)

        if [ "$THROTTLE_HEX" == "0x0" ]; then
            echo -e "${GREEN}OK${NC}"
        else
            echo -e "${RED}Throttled ($THROTTLE_HEX)${NC}"
        fi
    else
        echo "N/A"
    fi
}

get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'
}

get_memory_usage() {
    free -h | awk 'NR==2{printf "%s / %s (%.1f%%)", $3, $2, $3*100/$2}'
}

get_disk_usage() {
    df -h / | awk 'NR==2{printf "%s / %s (%s)", $3, $2, $5}'
}

get_uptime() {
    uptime -p | sed 's/up //'
}

get_service_status() {
    if systemctl is-active --quiet musicai; then
        echo -e "${GREEN}Running${NC}"
    elif systemctl is-enabled --quiet musicai; then
        echo -e "${YELLOW}Stopped (enabled)${NC}"
    else
        echo -e "${RED}Stopped (disabled)${NC}"
    fi
}

get_service_memory() {
    if systemctl is-active --quiet musicai; then
        systemctl status musicai | grep Memory: | awk '{print $2}'
    else
        echo "N/A"
    fi
}

get_service_tasks() {
    if systemctl is-active --quiet musicai; then
        systemctl status musicai | grep Tasks: | awk '{print $2}'
    else
        echo "N/A"
    fi
}

print_header() {
    clear
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                      ║"
    echo "║        🎵  Magic AI Music Box - System Monitor  🎵                  ║"
    echo "║                                                                      ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_system_info() {
    echo -e "${CYAN}System Information${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  Hostname:       $(hostname)"
    echo -e "  Uptime:         $(get_uptime)"
    echo -e "  Temperature:    $(get_temp)"
    echo -e "  Throttling:     $(get_throttle_status)"
    echo -e "  CPU Usage:      $(get_cpu_usage)"
    echo -e "  Memory Usage:   $(get_memory_usage)"
    echo -e "  Disk Usage:     $(get_disk_usage)"
    echo ""
}

print_service_info() {
    echo -e "${CYAN}Service Status${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  Status:         $(get_service_status)"
    echo -e "  Memory:         $(get_service_memory)"
    echo -e "  Tasks:          $(get_service_tasks)"
    echo ""
}

print_recent_logs() {
    echo -e "${CYAN}Recent Logs (last 10 lines)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if systemctl is-active --quiet musicai; then
        journalctl -u musicai -n 10 --no-pager | tail -10
    else
        echo "  Service not running"
    fi
    echo ""
}

print_network_info() {
    echo -e "${CYAN}Network Information${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Get IP addresses
    ETH_IP=$(ip -4 addr show eth0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "N/A")
    WLAN_IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "N/A")

    echo -e "  Ethernet (eth0):  $ETH_IP"
    echo -e "  WiFi (wlan0):     $WLAN_IP"
    echo ""
}

print_audio_info() {
    echo -e "${CYAN}Audio Devices${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if command -v aplay &> /dev/null; then
        aplay -l 2>/dev/null | grep "^card" || echo "  No audio devices found"
    else
        echo "  aplay not available"
    fi
    echo ""
}

print_menu() {
    echo -e "${YELLOW}Commands:${NC}"
    echo "  [r] Refresh  [s] Start Service  [t] Stop Service  [l] View Logs  [q] Quit"
    echo ""
}

# Main monitoring loop
main() {
    while true; do
        print_header
        print_system_info
        print_service_info
        print_network_info
        print_audio_info
        print_recent_logs
        print_menu

        # Read input with timeout
        read -t 5 -n 1 key

        case "$key" in
            r|R)
                # Refresh (do nothing, loop will refresh)
                ;;
            s|S)
                echo "Starting service..."
                sudo systemctl start musicai
                sleep 2
                ;;
            t|T)
                echo "Stopping service..."
                sudo systemctl stop musicai
                sleep 2
                ;;
            l|L)
                echo "Opening logs (Ctrl+C to return)..."
                sleep 1
                sudo journalctl -u musicai -f
                ;;
            q|Q)
                clear
                echo "Goodbye!"
                exit 0
                ;;
        esac
    done
}

# Run monitor
main
