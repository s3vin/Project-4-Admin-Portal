#!/bin/bash

# Docker Helper Script for Admin Portal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Function to create .env.docker if it doesn't exist
setup_env() {
    if [ ! -f .env.docker ]; then
        print_info "Creating .env.docker from example..."
        cp .env.docker.example .env.docker
        print_success ".env.docker created. Please edit it with your custom values."
        print_info "You may want to change JWT_SECRET and MongoDB credentials."
    else
        print_success ".env.docker already exists"
    fi
}

# Function to build containers
build() {
    print_info "Building Docker containers..."
    docker-compose build
    print_success "Containers built successfully"
}

# Function to start services
start() {
    print_info "Starting services..."
    docker-compose up -d
    print_success "Services started"
    print_info "Application: http://localhost:5000"
    print_info "MongoDB: localhost:27017"
}

# Function to start in development mode
start_dev() {
    print_info "Starting services in development mode..."
    docker-compose --profile dev up -d
    print_success "Services started in development mode"
    print_info "Application: http://localhost:5001"
    print_info "MongoDB: localhost:27017"
}

# Function to stop services
stop() {
    print_info "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to restart services
restart() {
    stop
    start
}

# Function to view logs
logs() {
    docker-compose logs -f "${@}"
}

# Function to seed database
seed() {
    print_info "Seeding database..."
    docker-compose exec app node seed.js
    print_success "Database seeded"
}

# Function to execute shell in app container
shell() {
    print_info "Opening shell in app container..."
    docker-compose exec app sh
}

# Function to clean everything
clean() {
    print_info "Cleaning up containers, volumes, and images..."
    docker-compose down -v
    docker-compose rm -f
    print_success "Cleanup complete"
}

# Function to show status
status() {
    docker-compose ps
}

# Function to show help
show_help() {
    cat << EOF
Admin Portal Docker Helper Script

Usage: ./docker.sh [command]

Commands:
    build       Build Docker containers
    start       Start services in production mode
    dev         Start services in development mode
    stop        Stop all services
    restart     Restart all services
    logs        View logs (optional: specify service name)
    seed        Seed the database with sample data
    shell       Open shell in app container
    status      Show status of containers
    clean       Remove all containers and volumes
    help        Show this help message

Examples:
    ./docker.sh build
    ./docker.sh start
    ./docker.sh dev
    ./docker.sh logs app
    ./docker.sh seed
    ./docker.sh clean

EOF
}

# Main script logic
check_docker

case "${1}" in
    build)
        setup_env
        build
        ;;
    start)
        setup_env
        start
        ;;
    dev)
        setup_env
        start_dev
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        shift
        logs "$@"
        ;;
    seed)
        seed
        ;;
    shell)
        shell
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1}"
        echo ""
        show_help
        exit 1
        ;;
esac
