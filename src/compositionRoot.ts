/**
 * Composition Root
 *
 * Point unique d'assemblage de l'application ClusterLens.
 *
 * Ce fichier crée les objets de l'application et injecte
 * explicitement leurs dépendances.
 *
 * Il ne contient aucune logique métier.
 */

import { ProxmoxClient } from "./clientAPI/ProxmoxClient.js";

import { ClusterService } from "./services/ClusterService.js";
import { NodeService } from "./services/NodeService.js";

import { VMFactory } from "./services/VMFactory.js";
import { ReplicationFactory } from "./services/ReplicationFactory.js";
import { HAFactory } from "./services/HA-engine/HAFactory.js";

import { HAResourceService } from "./services/HA-engine/HAResourceService.js";
import { HARuleResolver } from "./services/HA-engine/HARuleResolver.js";
import { HASimulationService } from "./services/HA-engine/HASimulationService.js";
import { HACapacitySimulationService } from "./services/HA-engine/HACapacitySimulationService.js";


/**
 * ============================================================
 * Accès Proxmox
 * ============================================================
 */

const client = new ProxmoxClient();


/**
 * ============================================================
 * Factories
 * ============================================================
 */

const vmFactory = new VMFactory();

const replicationFactory = new ReplicationFactory();

const haFactory = new HAFactory();


/**
 * ============================================================
 * Services de récupération des données Proxmox
 * ============================================================
 */

const nodeService = new NodeService(
  client,
  vmFactory
);


/**
 * Service principal permettant de construire
 * l'état réel du cluster.
 */
export const clusterService = new ClusterService(
  client,
  nodeService,
  vmFactory,
  replicationFactory,
  haFactory
);


/**
 * ============================================================
 * Services métier HA
 * ============================================================
 */

/**
 * Interrogation des ressources HA.
 */
const haResourceService = new HAResourceService();


/**
 * Résolution des règles node-affinity et de leurs priorités.
 */
const haRuleResolver = new HARuleResolver();


/**
 * Simulation du placement des VM.
 */
export const haSimulationService = new HASimulationService(
  haResourceService,
  haRuleResolver
);


/**
 * Calcul de la surcharge CPU / RAM provoquée
 * par les migrations simulées.
 */
export const capacitySimulationService =
  new HACapacitySimulationService();