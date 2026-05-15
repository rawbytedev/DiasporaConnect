# DiasporaConnect

## Français

DiasporaConnect est une expérience de transfert d'argent conçue pour la diaspora béninoise. Le projet associe un site vitrine soigné, un simulateur interactif de frais et une démo complète de bout en bout montrant comment un transfert peut être initié, suivi, reçu et retiré avec des frais très inférieurs à ceux des opérateurs traditionnels.

Le projet repose sur une promesse simple : permettre à la diaspora d'envoyer de l'argent au pays avec un modèle transparent à 1 %, un règlement rapide et une expérience beaucoup plus claire pour l'expéditeur comme pour le destinataire.

### Vue d'ensemble

Les services de transfert classiques cachent souvent une partie de leurs coûts dans les marges de change, les commissions sur carte et les délais de traitement. DiasporaConnect propose une alternative basée sur la blockchain, avec Solana et USDT, afin de réduire ces coûts cachés et de simplifier le parcours utilisateur.

Ce dépôt comprend :

- un site vitrine public
- un calculateur de frais interactif
- des maquettes mobiles réutilisables pour les parcours expéditeur et destinataire
- une route de démonstration qui simule le cycle complet d'un transfert
- une persistance locale des données pour conserver l'état après rechargement
- des scénarios de test pour simuler l'absence du destinataire ou un délai réseau
- un backend Go complet avec PostgreSQL et Solana devnet
- vérification KYC, notes de transfert, sondage de statut en temps réel

### Fonctionnalités principales

#### Site vitrine
- Proposition de valeur claire pour la diaspora béninoise
- Mise en avant du problème et de la solution
- Comparaison avec Western Union, MoneyGram et les banques
- Boutons d'appel à l'action menant vers la démo

#### Simulateur interactif
- Calcul des frais en temps réel
- Montant réellement reçu en CFA
- Comparaison des économies réalisées face aux solutions classiques
- Sélecteur de scénario pour tester différents cas d'usage

#### Démo complète de bout en bout
- Parcours expéditeur : configuration, récapitulatif, confirmation et envoi
- Parcours de traitement : barre de progression et simulation de transaction
- Parcours destinataire : consultation des fonds, retrait et confirmation
- Parcours remboursement : gestion de l'absence du destinataire et logique de retour automatique
- État du transfert conservé dans `localStorage`

#### Maquettes mobiles
- Interface expéditeur pour la diaspora en France
- Interface destinataire pour les utilisateurs au Bénin
- Intégration interactive directement dans le site pour mieux sentir le produit

### Nouvelles fonctionnalités (v2)

#### Destinataires récents
Les 10 derniers destinataires sont sauvegardés localement. L'expéditeur peut en sélectionner un d'un clic pour préremplir le formulaire, avec affichage du nom récupéré automatiquement via l'API.

#### Compte à rebours d'expiration
L'écran d'historique affiche une barre de progression colorée pour chaque transfert en attente, indiquant le temps restant avant expiration automatique. La barre passe au rouge dans les dernières 24 heures.

#### Notes de transfert
L'expéditeur peut joindre un message court (200 caractères max) à chaque transfert, visible dans l'historique et sur le reçu du destinataire.

#### Sondage de statut en temps réel
L'écran de succès interroge l'API toutes les 10 secondes pour détecter le moment où le destinataire réclame les fonds et met à jour le statut instantanément, sans rechargement de page.

#### Portail KYC (vérification d'identité)
- Les transferts de 500 USDT ou plus déclenchent une confirmation explicite : l'utilisateur doit ressaisir le montant exact.
- Les transferts de 1 000 USDT ou plus sont bloqués jusqu'à la validation KYC.
- Le statut KYC est géré dans l'onglet Paramètres : soumission des documents, validation automatique, et affichage du plafond autorisé.
- Limite par défaut : 500 USDT. Après KYC validé : 10 000 USDT.

### Technologies utilisées

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- Wouter
- TanStack Query
- Framer Motion
- Lucide React
- React Icons

**Backend**
- Go (Golang)
- PostgreSQL
- Solana devnet (USDT)
- Badger (stockage clé-valeur)
- JWT (authentification)

### Structure du projet

```
.
├── artifacts/
│   ├── diaspora-connect-site/   — site vitrine React/Vite principal
│   ├── api-server/              — configuration artifact serveur API
│   └── mockup-sandbox/          — espace de maquettage visuel
├── backend/
│   ├── cmd/api/main.go          — point d'entrée du serveur Go
│   ├── internal/
│   │   ├── handlers/            — gestionnaires HTTP (auth, KYC, transfert, compte)
│   │   ├── models/              — modèles de données (transfert, utilisateur, KYC)
│   │   └── repository/         — accès base de données
│   └── bin/api                  — binaire compilé
└── README.md
```

### Installation

#### Prérequis
- Node.js 20+
- pnpm
- Go 1.21+
- PostgreSQL
- Variables d'environnement : `DATABASE_URL`, `JWT_SECRET`, `SOLANA_RPC_URL`

#### Installer les dépendances
```bash
pnpm install
```

#### Compiler le backend Go
```bash
cd backend && go build -o bin/api ./cmd/api/main.go
```

#### Lancer le backend
```bash
DATABASE_URL=$DATABASE_URL ./backend/bin/api
```

#### Lancer le site vitrine
```bash
pnpm --filter @workspace/diaspora-connect-site run dev
```

#### Accéder aux pages
- Accueil : `/`
- Application : `/app`
- Démo complète : `/demo`

### Endpoints API

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/health` | Vérification de santé |
| POST | `/api/auth/register` | Création de compte |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/account` | Solde et informations du compte |
| POST | `/api/transfers` | Créer un transfert |
| GET | `/api/transfers` | Historique des transferts |
| GET | `/api/transfers/:id` | Détail d'un transfert |
| POST | `/api/transfers/:id/claim` | Réclamer les fonds |
| GET | `/api/user/lookup` | Recherche d'utilisateur par téléphone |
| POST | `/api/kyc/submit` | Soumettre les documents KYC |
| GET | `/api/kyc/status` | Statut et plafond KYC |

### Objectifs de conception

- Rendre les coûts de transfert compréhensibles immédiatement
- Créer de la confiance grâce à la transparence et aux états clairs
- Montrer l'expérience expéditeur/destinataire de bout en bout
- Faire de la blockchain une infrastructure invisible, pas une barrière d'usage

### Notes

- L'état des transferts est stocké localement à des fins de prototype
- Le projet est optimisé pour la présentation, la validation et l'exploration produit
- L'expérience actuelle est un prototype fonctionnel, pas un service financier de production

### Licence

Projet interne / prototype.

---

## English

DiasporaConnect is a money transfer experience designed for the Beninese diaspora. The project combines a polished showcase website, an interactive fee simulator, and a full end-to-end demo showing how a transfer can be created, tracked, received, and withdrawn with much lower fees than traditional providers.

The project follows one simple promise: help diaspora users send money home with a transparent 1% fee model, fast settlement, and a much clearer experience for both sender and recipient.

### Overview

Traditional remittance providers often hide part of their cost inside exchange-rate margins, card surcharges, and slow settlement delays. DiasporaConnect proposes a blockchain-powered alternative using Solana and USDT to reduce those hidden costs and simplify the flow.

This repository includes:

- a public-facing showcase website
- an interactive fee calculator
- reusable mobile-style mockups for sender and recipient flows
- a full demo route that simulates the complete transfer lifecycle
- local persistence for transfer data so users can refresh without losing state
- scenario controls to test different outcomes such as recipient absence or network delay
- a full Go backend with PostgreSQL and Solana devnet
- KYC verification, transfer notes, and real-time status polling

### Key Features

#### Marketing website
- Clear value proposition for the Beninese diaspora
- Problem/solution storytelling
- Comparison against Western Union, MoneyGram, and banks
- Strong call-to-action buttons leading into the demo experience

#### Interactive simulator
- Real-time transfer fee calculation
- Transparent amount received in CFA
- Savings comparison versus traditional providers
- Scenario switcher for different user flows

#### End-to-end demo
- Sender flow: configure transfer, review summary, confirm, and submit
- Processing flow: visual progress indicator and transaction simulation
- Recipient flow: view incoming funds, claim them, or simulate withdrawal
- Refund flow: support for recipient absence and automatic return logic
- Persistent transfer state stored in `localStorage`

#### Mobile mockups
- Sender UI for diaspora users in France
- Recipient UI for users in Benin
- Fully interactive, embedded directly in the site for product feel and usability testing

### New Features (v2)

#### Recent recipients
The last 10 recipients are saved locally. The sender can select one with a single click to pre-fill the form, with automatic name lookup via the API.

#### Expiry countdown
The history screen shows a live color-coded progress bar on each pending transfer, indicating time remaining before automatic expiry. The bar turns red in the final 24 hours.

#### Transfer notes
The sender can attach a short message (up to 200 characters) to any transfer, visible in the history and on the recipient's receipt.

#### Real-time status polling
The success screen polls the API every 10 seconds to detect when the recipient claims the funds and updates the status instantly, without a page reload.

#### KYC verification gate
- Transfers of 500 USDT or more trigger an explicit confirmation step: the user must re-enter the exact amount.
- Transfers of 1,000 USDT or more are blocked until KYC is completed.
- KYC status is managed in the Settings tab: document submission, automatic validation, and display of the current transfer limit.
- Default limit: 500 USDT. After KYC approval: 10,000 USDT.

### Technologies Used

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- Wouter
- TanStack Query
- Framer Motion
- Lucide React
- React Icons

**Backend**
- Go (Golang)
- PostgreSQL
- Solana devnet (USDT)
- Badger (key-value store)
- JWT (authentication)

### Project Structure

```
.
├── artifacts/
│   ├── diaspora-connect-site/   — main React/Vite showcase website
│   ├── api-server/              — API server artifact configuration
│   └── mockup-sandbox/          — visual mockup playground
├── backend/
│   ├── cmd/api/main.go          — Go server entry point
│   ├── internal/
│   │   ├── handlers/            — HTTP handlers (auth, KYC, transfer, account)
│   │   ├── models/              — data models (transfer, user, KYC)
│   │   └── repository/         — database access layer
│   └── bin/api                  — compiled binary
└── README.md
```

### Installation

#### Prerequisites
- Node.js 20+
- pnpm
- Go 1.21+
- PostgreSQL
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `SOLANA_RPC_URL`

#### Install dependencies
```bash
pnpm install
```

#### Build the Go backend
```bash
cd backend && go build -o bin/api ./cmd/api/main.go
```

#### Run the backend
```bash
DATABASE_URL=$DATABASE_URL ./backend/bin/api
```

#### Run the showcase website
```bash
pnpm --filter @workspace/diaspora-connect-site run dev
```

#### Open the pages
- Homepage: `/`
- App: `/app`
- Full demo: `/demo`

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/account` | Account balance and info |
| POST | `/api/transfers` | Create a transfer |
| GET | `/api/transfers` | Transfer history |
| GET | `/api/transfers/:id` | Transfer detail |
| POST | `/api/transfers/:id/claim` | Claim funds |
| GET | `/api/user/lookup` | Look up user by phone |
| POST | `/api/kyc/submit` | Submit KYC documents |
| GET | `/api/kyc/status` | KYC status and current limit |

### Design Goals

- Make remittance costs understandable at a glance
- Build trust through transparency and clear status updates
- Show the sender and recipient experience end to end
- Present blockchain as invisible infrastructure, not as a usability barrier

### Notes

- Transfer state is stored locally for prototype purposes
- The project is optimized for presentation, validation, and product exploration
- The current experience is a functional prototype, not a production financial service

### License

Internal project / prototype.
