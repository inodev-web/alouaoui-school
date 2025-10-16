#!/bin/bash

echo "=========================================="
echo "Starting Alouaoui School Docker Services"
echo "=========================================="
echo ""

# Check if this is first run (no .env file)
if [ ! -f backend/.env ]; then
    echo "This appears to be your first time running the application."
    echo ""
    echo "Running initial setup..."
    echo ""
    chmod +x docker-setup.sh
    ./docker-setup.sh
    exit 0
fi

# Normal startup
echo "Starting Docker containers..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Services started successfully!"
    echo "=========================================="
    echo ""
    echo "Your application is now running:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend API: http://localhost/api"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    echo ""
else
    echo ""
    echo "Error starting containers. Please check Docker is running."
    echo ""
fi

