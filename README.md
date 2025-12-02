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

---

## 🧾 Prompts



### TÂCHE 1 : Mise en place du Backend (Express & SQLite)

Première étape : Créer la structure de base du projet Backend dans un dossier `backend/`.  
Initialiser un projet Node.js (`package.json`).  
Installer les dépendances essentielles : `express`, `sqlite3`, `sequelize` et `jest` pour les tests.  
Créer un fichier `server.js` qui initialise l'application Express, définit le port et démarre le serveur.  
Générer le modèle de données Sequelize pour un `Product` (champs : id, name, description, price, stock).  
Créer la route `GET /api/products` qui récupère et renvoie tous les produits depuis la base de données.

### TÂCHE 2 : Mise en place du Frontend (React)

Première étape : Créer la structure de base du projet Frontend dans un dossier `frontend/` (utiliser Vite ou CRA si nécessaire).  
Créer un composant `ProductList.js` dans `frontend/src/components/`.  
Ce composant doit utiliser les hooks `useState` et `useEffect` pour récupérer les données depuis la route backend `/api/products`.  
Afficher les noms et les prix des produits dans une liste simple.

### TÂCHE 3 : Tests unitaires

Première étape : Créer un fichier de test `backend/tests/products.test.js`.  
Écrire un premier test unitaire pour la route `GET /api/products` qui vérifie :  
- que le statut de la réponse est 200 ;  
- que le corps de la réponse est un tableau.

---

### TÂCHE DOCUMENTATION

Dernière étape : Créer un fichier `README.md` simple mais personnalisé pour le projet qui inclut :  
- un titre et une description clairs du projet ;  
- une section listant la stack technique utilisée (Node/Express, SQLite/Sequelize, React/Hooks, Jest) ;  
- une brève section sur l'installation et le lancement (étapes pour démarrer le Backend et le Frontend) ;  
- une liste de fonctionnalités.

Action suivante : Commencer par implémenter le Backend. Générer le contenu du fichier `backend/package.json` et le code initial de `backend/server.js`, incluant le modèle Sequelize `Product`.

---

### TÂCHE : Compléter les routes RESTful Produits et Panier

**Routes Produits** : Implémenter deux nouvelles routes dans `backend/server.js` :  
- `GET /api/products/:id` : récupérer un produit unique par son ID ;  
- `POST /api/products` : permettre la création d'un nouveau produit (pour la simulation/les tests).

**Modèle Panier** : Définir un nouveau modèle Sequelize `CartItem` (champs : id, productId, quantity). Ce modèle sera lié au modèle `Product`.  

**Routes Panier** : Implémenter les routes de base du panier d'achat :  
- `POST /api/cart/add` : ajouter un produit au panier (ou incrémenter la quantité) ;  
- `GET /api/cart` : récupérer le contenu actuel du panier.

Commencer par définir le modèle `CartItem`, puis implémenter les nouvelles routes Produits.

---

### TÂCHE : Frontend moderne avec Material-UI (MUI)

Initialisation du projet React (si ce n'est pas déjà fait) : s'assurer que le projet React dans le dossier `frontend/` est correctement configuré.  
Installer Material-UI : ajouter les packages principaux MUI (`@mui/material`, `@emotion/react`, `@emotion/styled`) au projet frontend.  

Refactoriser `ProductList.js` pour utiliser MUI :  
- Modifier le composant `ProductList.js` pour utiliser les composants MUI pour sa structure et son affichage ;  
- Afficher chaque produit dans un composant `Card` pour un rendu visuel distinct ;  
- À l'intérieur de chaque `Card`, utiliser `CardContent` et `Typography` pour afficher le nom et le prix du produit ;  
- Veiller à ce que la logique de `fetch` depuis `/api/products` (qui tourne sur `http://localhost:3000`) reste intacte avec `useState` et `useEffect` ;  
- Ajouter un conteneur `Grid` simple pour organiser les cartes produits dans une mise en page responsive.  

**AppBar basique** : Créer une `AppBar` simple (barre de navigation) en haut de l'application pour un en-tête plus soigné, avec par exemple le titre "My E-Commerce Store".  

**Composant principal App** : S'assurer que `App.js` rend l'`AppBar` et le composant `ProductList`.

Objectif : code propre, bonne utilisation des composants MUI et une mise en page visuellement agréable pour la page du catalogue produits.

Fournir les commandes d'installation nécessaires pour MUI ainsi que le code mis à jour de `frontend/src/components/ProductList.js` et `frontend/src/App.js` reflétant ce design moderne.

---

### TÂCHE : Améliorer l'UI avec images produits, animations et meilleure mise en page

**Amélioration Backend (si nécessaire)** :  
- Point crucial : s'assurer que le modèle `Product` dans le backend inclut maintenant un champ `imageUrl` (URL d'image sous forme de chaîne) ;  
- Si le backend doit être mis à jour, générer la migration ou la modification de modèle nécessaire ;  
- Si le backend a besoin de données de test avec `imageUrl`, proposer une méthode de seed ou un exemple.

**Amélioration des cartes produits dans `ProductList.js`** :  
- Modifier chaque carte produit pour inclure une zone d'image dédiée via `CardMedia` ;  
- Afficher une image de placeholder si `imageUrl` n'est pas disponible, ou utiliser l'`imageUrl` réel provenant des données produit ;  
- Ajouter un bouton "Add to Cart" simple sur chaque carte, stylé avec MUI (le bouton peut pour l'instant seulement faire un `console.log`) ;  
- Implémenter une animation subtile au survol ou au clic sur les cartes produits (par exemple, légère élévation, changement d'ombre) pour les rendre plus interactives — réalisable avec CSS-in-JS (Emotion) ou via les props de style MUI ;  
- S'assurer que la grille (`Grid`) des cartes produits est responsive et agréable visuellement.  

**Vue de détail produit (conceptuelle pour l'instant)** :  
- Quand une carte produit est cliquée, elle devrait idéalement naviguer vers une page de détail. Pour l’instant, garder ça simple : rendre toute la `CardActionArea` cliquable, et au clic, faire un `console.log` de l'ID du produit pour simuler une intention de navigation.  

**Finition générale de la page** :  
- Veiller à une marge et un padding cohérents en utilisant l'utilitaire de spacing MUI ou le composant `Box` ;  
- Ajouter un `Container` simple autour de la grille produit pour un meilleur alignement du contenu.  

Objectif : rendre la page plus attrayante visuellement, interactive et responsive. Supposer que les données produits retournées par le backend contiennent désormais `imageUrl`.

Fournir le code mis à jour pour `backend/models/product.js` (si une migration est nécessaire) et pour le composant `frontend/src/components/ProductList.js`, avec, si besoin, des exemples CSS-in-JS pour les animations.

---

### TÂCHE : Récupérer les produits depuis la Fake Store API

Récupérer les produits depuis une API gratuite et les afficher dans le projet React. Chaque produit doit afficher le titre, la description, le prix et l'image.  
Utiliser la Fake Store API : https://fakestoreapi.com/products.  
Écrire un composant React qui récupère ces données (`fetch`) et les rend dans une mise en page simple en cartes.

