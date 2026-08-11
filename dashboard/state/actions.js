import { clusterState } from "./clusterState.js";
import { fetchHASimulation } from "../utils/api.js";
import { logger } from "../utils/logger.js";


/**
 * Initialise l'état de simulation du dashboard.
 *
 * Le frontend ne gère plus les affectations VM :
 * celles-ci sont calculées par le moteur HA backend.
 */
export function initSimulationState() {
  clusterState.failedNodes ??= new Set();
  clusterState.simulation = null;

  logger.debug(
    "[INIT] Simulation state initialized"
  );
}


/**
 * Active ou désactive une panne simulée.
 *
 * Aucune logique HA n'est exécutée côté frontend.
 *
 * Le navigateur conserve uniquement la liste
 * des noeuds simulés OFFLINE puis demande
 * au backend de recalculer entièrement la simulation.
 */
export async function toggleNodeFailure(nodeName) {

  // ============================================================
  // Modification de l'hypothèse de panne
  // ============================================================

  if (clusterState.failedNodes.has(nodeName)) {
    clusterState.failedNodes.delete(nodeName);
  } else {
    clusterState.failedNodes.add(nodeName);
  }


  logger.debug(
    `[NODE STATE] ${nodeName} → ${
      clusterState.failedNodes.has(nodeName)
        ? "OFFLINE"
        : "ONLINE"
    }`
  );


  // ============================================================
  // Appel du moteur HA backend
  // ============================================================

  const simulation = await fetchHASimulation(
    clusterState.failedNodes
  );


  // ============================================================
  // Stockage du résultat
  // ============================================================

  clusterState.simulation = simulation;


  logger.debug(
    "[HA SIMULATION]",
    simulation
  );


  return simulation;
}