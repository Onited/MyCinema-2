# 🎬 CinéBook - Application de Réservation de Cinéma

Une application web de réservation de billets de cinéma construite avec une architecture microservices.

## 📋 Architecture

L'application est composée de **3 microservices** + 1 API Gateway + 1 Frontend:

| Service | Technologie | Base de données | Port |
|---------|-------------|-----------------|------|
| Movies Service | Node.js + Express | MongoDB | 3001 |
| Users Service | Python + Flask | PostgreSQL | 3002 |
| Sessions Service | Node.js + Express | MongoDB | 3003 |
| API Gateway | Node.js + Express | - | 3000 |
| Frontend | React + Vite | - | 5173 |

## 🚀 Démarrage

### Option 1: Docker Compose (Recommandé)

```bash
docker-compose up --build
```

### Option 2: Démarrage Local

1. **Prérequis:**
   - Node.js 18+
   - Python 3.11+
   - MongoDB
   - PostgreSQL

2. **Installer les dépendances:**
```bash
chmod +x start.sh
./start.sh
```

3. **Démarrer chaque service** (dans des terminaux séparés):
```bash
# Terminal 1 - Movies Service
cd movies-service && npm run dev

# Terminal 2 - Users Service
cd users-service && python3 app.py

# Terminal 3 - Sessions Service
cd sessions-service && npm run dev

# Terminal 4 - API Gateway
cd api-gateway && npm run dev

# Terminal 5 - Frontend
cd frontend && npm run dev
```

## 🌐 URLs

- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **Movies API:** http://localhost:3001/api/movies
- **Users API:** http://localhost:3002/api/users
- **Sessions API:** http://localhost:3003/api/sessions

## ✨ Fonctionnalités

### Principales
- ✅ Gestion des films (CRUD)
- ✅ Gestion des utilisateurs (inscription, connexion)
- ✅ Gestion des séances
- ✅ Réservation de places avec vérification de disponibilité

### Bonus
- ✅ **Tarifs différenciés:**
  - Standard: plein tarif
  - Étudiant: -20%
  - Moins de 16 ans: -30%
  - Demandeur d'emploi: -25%
- ✅ **Authentification JWT**
- ✅ **Dégradation gracieuse** (liste des films accessible même si d'autres services sont hors ligne)

## 🔑 API Endpoints

### Movies Service
```
GET    /api/movies           # Liste des films
GET    /api/movies/:id       # Un film
POST   /api/movies           # Créer un film
PUT    /api/movies/:id       # Modifier un film
DELETE /api/movies/:id       # Supprimer un film
```

### Users Service
```
POST   /api/auth/register    # Inscription
POST   /api/auth/login       # Connexion
GET    /api/auth/me          # Profil utilisateur
GET    /api/users            # Liste utilisateurs (admin)
PUT    /api/users/:id        # Modifier utilisateur
DELETE /api/users/:id        # Supprimer utilisateur
```

### Sessions Service
```
GET    /api/sessions              # Liste des séances
GET    /api/sessions/movie/:id    # Séances d'un film
POST   /api/sessions              # Créer une séance
POST   /api/reservations          # Créer une réservation
GET    /api/reservations/user/:id # Réservations d'un utilisateur
PUT    /api/reservations/:id/cancel # Annuler une réservation
```

## 👤 Compte Admin par défaut

Pour créer un admin, modifiez directement dans la base de données:
```sql
UPDATE users SET is_admin = true WHERE username = 'votre_username';
```

## 📁 Structure du Projet

```
cinema-app/
├── api-gateway/          # Passerelle API
├── movies-service/       # Service Films (Node.js)
├── users-service/        # Service Utilisateurs (Python)
├── sessions-service/     # Service Séances (Node.js)
├── frontend/             # Interface React
├── docker-compose.yml    # Configuration Docker
└── start.sh             # Script de démarrage
```
