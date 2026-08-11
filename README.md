# ClusterLens

**Supervision, analyse de capacité et simulation HA pour clusters Proxmox VE**

ClusterLens est un outil de supervision et de simulation conçu pour analyser l’état d’un cluster **Proxmox VE** et anticiper son comportement en cas de panne.

Il collecte les informations directement depuis l’API Proxmox, construit une représentation du cluster et permet notamment de simuler la perte d’un ou plusieurs nœuds afin d’évaluer la capacité du cluster à absorber les machines virtuelles déplacées par la haute disponibilité.

L'objectif est simple : **savoir ce qu'il se passerait avant qu'un nœud tombe réellement.**

---

## Fonctionnalités

ClusterLens permet actuellement de :

* récupérer l’état des nœuds et des machines virtuelles depuis Proxmox ;
* analyser l’utilisation CPU et RAM du cluster ;
* analyser les capacités de stockage ZFS ;
* récupérer la configuration HA du cluster ;
* prendre en compte les règles HA et les priorités de nœuds ;
* récupérer et analyser les réplications Proxmox ;
* simuler la panne d’un ou plusieurs nœuds ;
* simuler le placement des VM HA sur les nœuds restants ;
* calculer l’impact d’un scénario de panne sur les ressources disponibles ;
* détecter les situations dans lesquelles un scénario HA risque de saturer le cluster ;
* exposer les données et les résultats de simulation via une API HTTP ;
* visualiser l’état du cluster et les simulations depuis une interface web.

---

## Principe de fonctionnement

ClusterLens sépare la collecte des données Proxmox de la logique de simulation.

```text
        Proxmox VE API
              │
              ▼
       ProxmoxClient
              │
              ▼
       ClusterService
              │
              ▼
       Modèle Cluster
              │
       ┌──────┴──────┐
       ▼             ▼
  HA Simulation   Capacity
     Engine       Simulation
       │             │
       └──────┬──────┘
              ▼
          HTTP API
              │
              ▼
        Web Dashboard
```

Les simulations sont réalisées en mémoire et ne modifient jamais la configuration réelle du cluster Proxmox.

ClusterLens fonctionne donc comme un outil d'analyse **read-only** vis-à-vis de l'infrastructure supervisée.

---

## Architecture du projet

```text
clusterlens/
├── dashboard/              # Interface web
│
├── src/
│   ├── clientAPI/          # Communication avec l'API Proxmox
│   │
│   ├── config/             # Configuration de l'application
│   │
│   ├── interfaces/         # Structures des données brutes Proxmox
│   │
│   ├── models/             # Modèle métier du cluster
│   │
│   ├── routes/             # API HTTP Fastify
│   │
│   ├── services/           # Services métier
│   │   ├── HA-engine/      # Simulation de haute disponibilité
│   │   └── ...
│   │
│   ├── compositionRoot.ts  # Assemblage des dépendances
│   └── main.ts             # Point d'entrée de l'application
│
├── tests/                  # Tests
├── package.json
├── tsconfig.json
└── README.md
```

L'application suit une séparation en plusieurs couches :

* **client API** : accès aux données Proxmox ;
* **modèles** : représentation métier du cluster ;
* **services** : collecte, calculs et simulations ;
* **routes** : exposition des fonctionnalités via HTTP ;
* **dashboard** : représentation et interaction côté utilisateur.

---

## Stack technique

* **Node.js 22+**
* **TypeScript**
* **Fastify**
* **pnpm**
* **API REST Proxmox VE**
* **HTML / CSS / JavaScript** pour le dashboard
* **Vitest** pour les tests

---

## Prérequis

* Node.js >= 22
* pnpm
* un cluster Proxmox VE accessible depuis ClusterLens
* un token API Proxmox associé à cet utilisateur ;
* le rôle intégré PVEAuditor, attribué au niveau / du cluster avec propagation activée.

Le rôle PVEAuditor fournit à ClusterLens les permissions de lecture nécessaires pour récupérer l'état et la configuration du cluster, sans lui permettre de modifier l'infrastructure.

ClusterLens est conçu pour fonctionner en lecture seule : il ne déclenche aucune migration, modification de configuration ou opération HA sur le cluster Proxmox.

---

## Configuration

Créer un fichier `.env` à la racine du projet :

```env
PVE_HOST=https://proxmox.example.com:8006
PVE_TOKEN_ID=user@realm!clusterlens
PVE_TOKEN_SECRET=xxxxxxxxxxxxxxxx
PVE_VERIFY_SSL=false

PORT=3000
HOST=0.0.0.0
```

> Il est recommandé de créer un utilisateur et un token Proxmox dédiés à ClusterLens avec uniquement les permissions nécessaires à la lecture de l'infrastructure.

Le fichier `.env` ne doit jamais être versionné.

---

## Installation avec Docker

Docker est la méthode recommandée pour déployer ClusterLens.

### Prérequis

* Docker
* Docker Compose
* Un cluster Proxmox VE accessible depuis le serveur hébergeant ClusterLens
* Un token API Proxmox disposant du rôle `PVEAuditor`

### Installation

Cloner le dépôt :

```bash
git clone <URL_DU_DEPOT>
cd clusterlens
```

Créer le fichier de configuration à partir de l'exemple fourni :

```bash
cp .env.example .env
```

Modifier ensuite le fichier `.env` :

```dotenv
PVE_HOST=https://proxmox.example.local:8006
PVE_TOKEN_ID=app-clusterlens@pam!app-clusterlens
PVE_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PVE_VERIFY_SSL=false
PORT=3000
```

> `PVE_VERIFY_SSL=false` permet d'utiliser ClusterLens avec un certificat Proxmox auto-signé. En production, la vérification SSL devrait rester activée lorsque le certificat utilisé le permet.

Construire et démarrer ClusterLens :

```bash
docker compose up -d --build
```

Vérifier que le conteneur fonctionne :

```bash
docker compose ps
```

ClusterLens est ensuite accessible à l'adresse :

```text
http://<adresse-du-serveur>:3000
```

Le port exposé peut être modifié avec la variable `PORT` du fichier `.env`.

### Arrêt

Pour arrêter ClusterLens :

```bash
docker compose down
```

### Mise à jour

Pour récupérer une nouvelle version et reconstruire le conteneur :

```bash
git pull
docker compose up -d --build
```

Les identifiants Proxmox sont stockés uniquement dans le fichier `.env`. Ce fichier est exclu du dépôt Git et ne doit jamais être versionné.


---

## API HTTP

ClusterLens expose une API HTTP permettant de récupérer l'état du cluster et d'exécuter des simulations de haute disponibilité.

| Méthode | Endpoint      | Description                                                         |
| ------- | ------------- | ------------------------------------------------------------------- |
| `GET`   | `/state`      | Retourne l'état actuel du cluster Proxmox collecté par ClusterLens. |
| `GET`   | `/simulation` | Exécute une simulation HA à partir de l'état actuel du cluster.     |

### Simulation de panne

Le paramètre optionnel `failedNodes` permet de simuler la perte d'un ou plusieurs nœuds du cluster.

```http id="p25e70"
GET /simulation
```

Simulation sans nœud déclaré en panne.

```http 
GET /simulation?failedNodes=proxmox-01
```

Simulation de la panne du nœud `proxmox-01`.

```http 
GET /simulation?failedNodes=proxmox-01,proxmox-02
```

Simulation de la panne simultanée des nœuds `proxmox-01` et `proxmox-02`.


### Exemple de simulation

```http
GET /simulation?failedNode=proxmox-01
```

Cette requête simule la perte du nœud `proxmox-01` et permet d’évaluer l’impact de la bascule HA sur les autres nœuds du cluster.


---

## Simulation HA

Le moteur de simulation permet de reproduire la perte d'un ou plusieurs nœuds.

Pour chaque scénario, ClusterLens détermine notamment :

1. les VM impactées par la panne ;
2. les VM protégées par HA ;
3. les nœuds encore disponibles ;
4. les contraintes définies par les règles HA ;
5. le placement simulé des VM ;
6. la consommation de ressources résultante ;
7. la capacité restante du cluster.

Cela permet par exemple d'étudier un scénario **N+1** et de vérifier si le cluster possède suffisamment de ressources pour supporter la perte d'un nœud.

---

## Analyse de capacité

ClusterLens ne se limite pas à vérifier qu'une VM peut être déplacée.

Le moteur analyse également l'état du cluster après simulation afin d'évaluer :

* la RAM utilisée et disponible ;
* la charge CPU ;
* la capacité de stockage ;
* la répartition des VM ;
* les éventuelles situations de surcharge.

L'objectif est de répondre à une question essentielle lors du dimensionnement d'un cluster :

> **Le cluster peut-il réellement supporter la perte d'un nœud avec sa charge actuelle ?**

---

## Sécurité

ClusterLens est conçu comme un outil d'analyse.

Il n'effectue aucune modification de la configuration Proxmox et ne déclenche aucune migration ou opération HA réelle.

Les simulations sont réalisées localement à partir des informations collectées depuis l'API.

Il est recommandé d'utiliser un **token API dédié en lecture seule**.

---

## Limitations actuelles

* fonctionnement sans base de données ;
* état conservé uniquement en mémoire ;
* pas d'historisation des métriques ;
* dépendance à la disponibilité de l'API Proxmox ;
* analyse du stockage principalement orientée ZFS ;
* prise en charge de Ceph non implémentée.

---

## Roadmap

Parmi les évolutions envisagées :

* amélioration du moteur de simulation multi-nœuds ;
* analyse avancée des scénarios N+1 / N+2 ;
* amélioration de la visualisation des simulations ;
* historique des simulations ;
* export de métriques ;
* intégration Grafana ;
* prise en charge de Ceph ;
* recommandations automatiques de dimensionnement.

---

## Licence

ClusterLens est distribué sous licence **GNU General Public License v3.0 (GPL-3.0)**.
