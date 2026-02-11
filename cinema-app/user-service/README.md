# 🎬 MyCinema – User Microservice

Microservice de gestion des comptes utilisateurs pour l'application cinéma **MyCinema**.  
Construit avec **FastAPI**, **PostgreSQL** (async SQLAlchemy), **JWT** et **Docker**.

### 🎫 Types utilisateurs pour tarification cinéma

Chaque utilisateur possède un `user_type` qui détermine son tarif :

| Type        | Description            | Réduction |
|-------------|------------------------|-----------|
| `standard`  | Tarif plein (défaut)   | —         |
| `etudiant`  | Carte étudiante        | ✅        |
| `mineur`    | Moins de 16 ans        | ✅        |
| `chomeur`   | Demandeur d'emploi     | ✅        |

> **Intégration** : le microservice Séances/Réservations récupère le type via `GET /api/v1/users/me` ou directement depuis le claim `type` du JWT.

---

## 🚀 Démarrage rapide

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

### Lancer le service

```bash
# 1. Copier le fichier d'environnement
cp .env.example .env

# 2. Lancer les conteneurs (FastAPI + PostgreSQL)
docker compose up --build
```

Le service est accessible sur **http://localhost:8000**.

### Documentation interactive (Swagger UI)

👉 **http://localhost:8000/docs**

---

## 📖 Endpoints

| Méthode  | Route                        | Auth | Description                           |
|----------|------------------------------|------|---------------------------------------|
| `POST`   | `/api/v1/users/register`     | —    | Créer un compte (+ type/proof)        |
| `POST`   | `/api/v1/users/login`        | —    | Se connecter → JWT (claim `type`)     |
| `GET`    | `/api/v1/users/me`           | JWT  | Voir son profil (type + proof)        |
| `PUT`    | `/api/v1/users/me`           | JWT  | Modifier nom / email / type / proof   |
| `DELETE` | `/api/v1/users/me`           | JWT  | Supprimer son compte                  |
| `POST`   | `/api/v1/users/verify-type`  | JWT  | Soumettre une preuve (étudiant, etc.) |
| `GET`    | `/health`                    | —    | Health check (Kubernetes)             |

### Exemples

**Register**
```bash
curl -X POST http://localhost:8000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email": "john@cinema.com", "password": "Secret123!", "full_name": "John Doe", "user_type": "etudiant", "proof_url": "https://storage.example.com/carte.jpg"}'
```

**Login**
```bash
curl -X POST http://localhost:8000/api/v1/users/login \
  -d "username=john@cinema.com&password=Secret123!"
```

**Get profile** (remplacer `<TOKEN>`)
```bash
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🗃️ Variables d'environnement

| Variable                      | Description                       | Défaut                          |
|-------------------------------|-----------------------------------|---------------------------------|
| `DATABASE_URL`                | URL de connexion PostgreSQL       | voir `.env.example`             |
| `SECRET_KEY`                  | Clé secrète JWT                   | ⚠️ **à changer en production** |
| `ALGORITHM`                   | Algorithme JWT                    | `HS256`                         |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de validité du token (min)  | `30`                            |
| `POSTGRES_USER`               | User PostgreSQL                   | `cinema`                        |
| `POSTGRES_PASSWORD`           | Password PostgreSQL               | `cinema_secret_2024`            |
| `POSTGRES_DB`                 | Nom de la base                    | `cinema_users`                  |

---

## 🧪 Tests

```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer les tests (SQLite in-memory, pas besoin de Docker)
pytest tests/ -v
```

---

## 🏗️ Structure du projet

```
user-service/
├── app/
│   ├── main.py                 # Point d'entrée FastAPI
│   ├── core/
│   │   ├── config.py           # Configuration (.env)
│   │   └── security.py         # JWT + bcrypt
│   ├── db/
│   │   └── database.py         # Engine & session async
│   ├── models/
│   │   └── user.py             # Modèle SQLAlchemy + UserType enum
│   ├── schemas/
│   │   └── user.py             # Schémas Pydantic
│   ├── crud/
│   │   └── user.py             # Opérations CRUD
│   └── api/v1/endpoints/
│       └── users.py            # Routes REST
├── alembic/                    # Migrations BDD
├── tests/                      # Tests pytest (59 tests)
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

---

## 🔄 Migrations (Alembic)

```bash
# Générer une migration
alembic revision --autogenerate -m "description"

# Appliquer les migrations
alembic upgrade head
```

> **Note** : au premier démarrage, les tables sont automatiquement créées via le lifespan de FastAPI. Alembic sert pour les migrations ultérieures.

---

## 📄 Licence

Projet interne MyCinema.
