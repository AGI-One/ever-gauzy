#!/bin/bash

# Usage:
# bash bin/up.sh prod
# bash bin/up.sh local

env=$1
# scale=${2:-1}
# folder=${PWD##*/}
# service=gauzy-app

# Ensure the databases network exists
echo "📡 Checking if databases network exists..."
if ! docker network ls | grep -q "databases"; then
    echo "🛠️  Creating databases network..."
    docker network create databases
else
    echo "✅ databases network already exists"
fi

case "$env" in
    local)
        echo "🚀 Starting NestJS application in local mode..."
        env -i PATH="$PATH" HOME="$HOME" docker compose -f docker-compose.local.yml up
    ;;
    localbuild )
        echo "🚀 Starting NestJS application in local mode with build..."
        env -i PATH="$PATH" HOME="$HOME" docker compose -f docker-compose.local.yml up --build
    ;;
    prod)
        echo "🚀 Starting NestJS application in production mode..."
        env -i PATH="$PATH" HOME="$HOME" docker compose -f docker-compose.prod.yml up -d
    ;;
    
    *)
        echo "Environment not found! please choose [local, prod]"
        exit 1
esac
