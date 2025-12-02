# 🛒 E-Commerce Web Application

## 📋 Description du Projet

Application web e-commerce complète développée avec Node.js, Express, React et SQLite. Cette application offre un catalogue de produits, un système de panier d'achat, et une authentification utilisateur sécurisée avec JWT.

## 🏗️ Architecture Technique

### Backend
- **Framework**: Node.js avec Express
- **Base de données**: SQLite avec Sequelize ORM
- **Authentification**: JWT (JSON Web Tokens) avec bcrypt pour le hashing des mots de passe
- **API**: RESTful architecture
- **Tests**: Jest

### Frontend
- **Framework**: React 19 avec Hooks (useState, useEffect, useContext)
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) avec CSS personnalisé
- **Routing**: React Router DOM
- **State Management**: Context API (AuthContext, CartContext)
- **Tests**: Jest et React Testing Library

### Base de Données
- **Type**: SQLite
- **ORM**: Sequelize
- **Modèles**:
  - `Product` (id, name, description, price, stock, imageUrl)
  - `CartItem` (id, productId, quantity)
  - `User` (id, email, password, name)

## ✨ Fonctionnalités

### 🛍️ Catalogue de Produits
- Affichage de produits depuis l'API Fake Store
- Grille responsive (5 cartes par ligne sur grand écran, 4 sur desktop, 3 sur tablette, 2 sur mobile)
- Images, prix, descriptions, notes et avis
- Système de recherche et filtrage
- Badges de catégories
- Animations au survol

### 🛒 Panier d'Achat
- Ajout/suppression de produits
- Modification des quantités
- Calcul automatique du total
- Persistance locale (Context API)
- Interface responsive
- Résumé de commande

### 🔐 Authentification
- Inscription utilisateur avec validation
- Connexion sécurisée
- Hashing des mots de passe (bcrypt)
- Tokens JWT (expiration 24h)
- Persistance de session (localStorage)
- Routes protégées

### 💳 Système de Paiement (Simulé)
- Validation de commande
- Calcul du total
- Interface de checkout
- Logique de validation prête pour intégration réelle

## 🚀 Installation et Configuration

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn
- Git

### Installation du Backend

```bash
# Naviguer vers le dossier backend
cd backend

# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

Le serveur backend démarre sur `http://localhost:4000`

### Installation du Frontend

```bash
# Naviguer vers le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Le serveur frontend démarre sur `http://localhost:5173`

## 🧪 Tests

### Backend Tests

```bash
cd backend
npm test
```

Tests disponibles:
- Tests des routes produits (GET /api/products)
- Tests des routes panier (POST /api/cart/add, GET /api/cart)
- Tests d'authentification (signup, signin)
- Tests de validation des données

### Frontend Tests

```bash
cd frontend
npm test
```

Tests disponibles:
- Tests des composants React
- Tests des hooks personnalisés
- Tests d'intégration du panier
- Tests de navigation

## 📁 Structure du Projet

```
ia_gen/
├── backend/
│   ├── server.js           # Point d'entrée Express
│   ├── database.sqlite     # Base de données SQLite
│   ├── tests/              # Tests unitaires backend
│   │   ├── products.test.js
│   │   ├── cart.test.js
│   │   └── auth.test.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductList.css
│   │   │   ├── Cart.jsx
│   │   │   ├── Cart.css
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── Auth.css
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.css
│   │   ├── contexts/       # Context API
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── App.jsx         # Composant principal
│   │   ├── App.css
│   │   ├── main.jsx        # Point d'entrée
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Produits
- `GET /api/products` - Liste tous les produits
- `GET /api/products/:id` - Récupère un produit par ID
- `POST /api/products` - Crée un nouveau produit

### Panier
- `POST /api/cart/add` - Ajoute un produit au panier
- `GET /api/cart` - Récupère le contenu du panier

### Authentification
- `POST /api/auth/signup` - Inscription utilisateur
- `POST /api/auth/signin` - Connexion utilisateur
- `GET /api/auth/me` - Récupère l'utilisateur courant (protégé)

## 🎨 Design et UI/UX

- **Responsive Design**: Optimisé pour mobile, tablette et desktop
- **Thème**: Gradient violet moderne (inspiré Amazon/eBay)
- **Animations**: Effets de survol, transitions fluides
- **Accessibilité**: Structure sémantique, contraste des couleurs
- **Performance**: CSS pur pour des performances optimales

## 🔒 Sécurité

- Hashing des mots de passe avec bcrypt (10 salt rounds)
- Tokens JWT avec expiration
- Validation des entrées côté serveur
- Protection CORS configurée
- Routes protégées avec middleware d'authentification

## 📦 Technologies Utilisées

### Backend
- express: ^4.22.1
- sequelize: ^6.37.7
- sqlite3: ^5.3.1
- bcrypt: ^6.0.0
- jsonwebtoken: ^9.0.2
- cors: ^2.8.5
- jest: ^29.7.0

### Frontend
- react: ^19.2.0
- react-dom: ^19.2.0
- react-router-dom: ^7.9.6
- @mui/material: ^7.3.5
- @mui/icons-material: ^7.3.5
- @emotion/react: ^11.14.0
- @emotion/styled: ^11.14.1
- vite: ^7.2.4

## 🌐 APIs Externes

- **Fake Store API**: https://fakestoreapi.com/products
  - Fournit les données de produits (titre, description, prix, image, catégorie, notes)

## 👨‍💻 Développement

### Commandes Utiles

```bash
# Backend
npm start          # Démarrer le serveur
npm test           # Lancer les tests

# Frontend
npm run dev        # Mode développement
npm run build      # Build de production
npm run preview    # Prévisualiser le build
npm run lint       # Linter le code
```

## 📝 Variables d'Environnement

### Backend (.env)
```
PORT=4000
JWT_SECRET=your-secret-key-change-in-production
DB_PATH=database.sqlite
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000
```

## 🚧 Améliorations Futures

- [ ] Intégration d'un vrai système de paiement (Stripe, PayPal)
- [ ] Gestion des commandes et historique
- [ ] Système de notation et commentaires
- [ ] Filtres avancés (prix, catégorie, notes)
- [ ] Wishlist / Liste de souhaits
- [ ] Notifications en temps réel
- [ ] Mode sombre
- [ ] Internationalisation (i18n)
- [ ] Progressive Web App (PWA)
- [ ] Optimisation SEO

## 📄 Licence

MIT

## 👤 Auteur

Développé dans le cadre du Projet 1 : Application Web E-Commerce

---

**Note**: Ce projet utilise GitHub Copilot pour l'assistance au développement et la génération de tests unitaires.

