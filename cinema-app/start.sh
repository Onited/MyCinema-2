#!/bin/bash

# CinéBook - Script de démarrage local
# Ce script installe les dépendances et démarre tous les services

echo "🎬 CinéBook - Démarrage de l'application"
echo "========================================="

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version)${NC}"

# Vérifier MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠ MongoDB n'est pas installé localement${NC}"
    echo "  Vous pouvez utiliser Docker: docker run -d -p 27017:27017 mongo:7"
fi

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL n'est pas installé localement${NC}"
    echo "  Vous pouvez utiliser Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16"
fi

echo ""
echo "📦 Installation des dépendances..."

# Movies Service
echo "  → Movies Service..."
cd movies-service && npm install --silent && cd ..

# Sessions Service
echo "  → Sessions Service..."
cd sessions-service && npm install --silent && cd ..

# API Gateway
echo "  → API Gateway..."
cd api-gateway && npm install --silent && cd ..

# Users Service
echo "  → Users Service..."
cd users-service && pip3 install -q -r requirements.txt && cd ..

# Frontend
echo "  → Frontend..."
cd frontend && npm install --silent && cd ..

echo ""
echo -e "${GREEN}✓ Dépendances installées${NC}"
echo ""
echo "🚀 Pour démarrer les services, ouvrez des terminaux séparés:"
echo ""
echo "  Terminal 1 (Movies):    cd movies-service && npm run dev"
echo "  Terminal 2 (Users):     cd users-service && python3 app.py"
echo "  Terminal 3 (Sessions):  cd sessions-service && npm run dev"
echo "  Terminal 4 (Gateway):   cd api-gateway && npm run dev"
echo "  Terminal 5 (Frontend):  cd frontend && npm run dev"
echo ""
echo "Ou utilisez Docker Compose:"
echo "  docker-compose up --build"
echo ""
echo "🌐 URLs:"
echo "  Frontend:     http://localhost:5173"
echo "  API Gateway:  http://localhost:3000"
echo ""
