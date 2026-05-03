# DiasporaConnect

## Français

DiasporaConnect est une expérience de transfert d’argent conçue pour la diaspora béninoise. Le projet associe un site vitrine soigné, un simulateur interactif de frais et une démo complète de bout en bout montrant comment un transfert peut être initié, suivi, reçu et retiré avec des frais très inférieurs à ceux des opérateurs traditionnels.

Le projet repose sur une promesse simple : permettre à la diaspora d’envoyer de l’argent au pays avec un modèle transparent à 1 %, un règlement rapide et une expérience beaucoup plus claire pour l’expéditeur comme pour le destinataire.

### Vue d’ensemble

Les services de transfert classiques cachent souvent une partie de leurs coûts dans les marges de change, les commissions sur carte et les délais de traitement. DiasporaConnect propose une alternative basée sur la blockchain, avec Solana et USDT, afin de réduire ces coûts cachés et de simplifier le parcours utilisateur.

Ce dépôt comprend :

- un site vitrine public
- un calculateur de frais interactif
- des maquettes mobiles réutilisables pour les parcours expéditeur et destinataire
- une route de démonstration qui simule le cycle complet d’un transfert
- une persistance locale des données pour conserver l’état après rechargement
- des scénarios de test pour simuler l’absence du destinataire ou un délai réseau

### Fonctionnalités principales

#### Site vitrine
- Proposition de valeur claire pour la diaspora béninoise
- Mise en avant du problème et de la solution
- Comparaison avec Western Union, MoneyGram et les banques
- Boutons d’appel à l’action menant vers la démo

#### Simulateur interactif
- Calcul des frais en temps réel
- Montant réellement reçu en CFA
- Comparaison des économies réalisées face aux solutions classiques
- Sélecteur de scénario pour tester différents cas d’usage

#### Démo complète de bout en bout
- Parcours expéditeur : configuration, récapitulatif, confirmation et envoi
- Parcours de traitement : barre de progression et simulation de transaction
- Parcours destinataire : consultation des fonds, retrait et confirmation
- Parcours remboursement : gestion de l’absence du destinataire et logique de retour automatique
- État du transfert conservé dans `localStorage`

#### Maquettes mobiles
- Interface expéditeur pour la diaspora en France
- Interface destinataire pour les utilisateurs au Bénin
- Intégration interactive directement dans le site pour mieux sentir le produit

### Technologies utilisées

- React
- Vite
- TypeScript
- Tailwind CSS
- Wouter
- TanStack Query
- Framer Motion
- Lucide React
- React Icons

### Structure du projet

- `artifacts/diaspora-connect-site` — site vitrine principal
- `artifacts/mockup-sandbox` — espace de maquettage visuel
- `artifacts/api-server` — serveur API

### Installation

#### Prérequis
- Node.js
- pnpm

#### Installer les dépendances
```bash
pnpm install
```

#### Lancer le site vitrine
```bash
pnpm --filter @workspace/diaspora-connect-site run dev
```

#### Accéder aux pages
- Accueil : `/`
- Démo complète : `/demo`

### Utilisation

#### Page d’accueil
Ouvrez le site pour découvrir le positionnement de la marque, la comparaison des frais et le calculateur.
Utilisez **Essayer le simulateur** pour lancer l’expérience complète.

#### Parcours de démonstration
1. Configurer un transfert côté expéditeur
2. Vérifier le récapitulatif et confirmer
3. Suivre la simulation du traitement blockchain
4. Basculer vers la vue destinataire
5. Réclamer puis retirer les fonds
6. Réinitialiser et tester un autre scénario

#### Réglages du simulateur
Le menu simulateur permet de tester plusieurs cas :
- transfert normal
- destinataire absent
- délai réseau

### Objectifs de conception

- Rendre les coûts de transfert compréhensibles immédiatement
- Créer de la confiance grâce à la transparence et aux états clairs
- Montrer l’expérience expéditeur/destinataire de bout en bout
- Faire de la blockchain une infrastructure invisible, pas une barrière d’usage

### Notes

- L’état des transferts est stocké localement à des fins de prototype
- Le projet est optimisé pour la présentation, la validation et l’exploration produit
- L’expérience actuelle est un prototype fonctionnel, pas un service financier de production

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

### Technologies Used

- React
- Vite
- TypeScript
- Tailwind CSS
- Wouter
- TanStack Query
- Framer Motion
- Lucide React
- React Icons

### Project Structure

- `artifacts/diaspora-connect-site` — main showcase website
- `artifacts/mockup-sandbox` — visual mockup playground
- `artifacts/api-server` — API server

### Installation

#### Prerequisites
- Node.js
- pnpm

#### Install dependencies
```bash
pnpm install
```

#### Run the showcase website
```bash
pnpm --filter @workspace/diaspora-connect-site run dev
```

#### Open the pages
- Homepage: `/`
- Full demo: `/demo`

### Usage

#### Homepage
Open the site to explore the brand story, fee comparison, and calculator.
Use **Essayer le simulateur** to enter the full demo experience.

#### Demo flow
1. Configure a transfer as the sender
2. Review the summary and confirm
3. Watch the simulated blockchain processing
4. Switch to the recipient view
5. Claim and withdraw the funds
6. Reset and try another scenario

#### Simulator settings
Use the simulator menu to test different flows:
- normal transfer
- recipient absent
- network delay

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
