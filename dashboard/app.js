import { fetchState } from "./utils/api.js";

import { renderOverView } from "./views/overview.view.js";
import { renderNodes } from "./views/nodes.view.js";
import { renderReplications } from "./views/replications.view.js";

import { clusterState } from "./state/clusterState.js";
import { buildUIState } from "./state/clusterEngine.js";

import {
  initSimulationState,
  toggleNodeFailure
} from "./state/actions.js";


/**
 * Initialise l'état de simulation du dashboard.
 */
initSimulationState();


/**
 * Recalcule toute l'interface à partir
 * du state courant.
 */
function recomputeUI() {
  const uiNodes = buildUIState(clusterState);

  renderOverView(clusterState.nodes);
  renderNodes(uiNodes);
  renderReplications(
    clusterState.nodes,
    clusterState.replications
  );
}


/**
 * Recharge l'état réel du cluster depuis /state.
 *
 * Attention :
 * cette fonction recharge uniquement les données réelles.
 *
 * L'état de simulation reste conservé dans :
 *
 * - clusterState.failedNodes
 * - clusterState.simulation
 */
async function update() {
  const data = await fetchState();

  clusterState.nodes = data.nodes ?? [];
  clusterState.replications = data.replications ?? [];
  clusterState.haResources = data.haResources ?? [];

  recomputeUI();
}


/**
 * Chargement initial.
 */
update();


/**
 * Gestion du clic ONLINE / OFFLINE.
 *
 * Le frontend ne calcule plus le failover.
 *
 * Il modifie uniquement la liste des nodes simulés OFFLINE,
 * puis appelle le moteur HA backend.
 */
document.addEventListener("click", async (e) => {
  const badge = e.target.closest(".node-status");

  if (!badge) {
    return;
  }

  const nodeCard = badge.closest(".node-card");

  if (!nodeCard) {
    return;
  }

  const nodeName = nodeCard
    .querySelector(".node-name")
    ?.textContent
    ?.trim();

  if (!nodeName) {
    return;
  }

  try {

    /**
     * Appel du moteur HA backend.
     *
     * On attend impérativement la réponse avant
     * de reconstruire l'interface.
     */
    await toggleNodeFailure(nodeName);

    recomputeUI();

  } catch (error) {

    console.error(
      "[HA SIMULATION ERROR]",
      error
    );

  }
});


/**
 * Rafraîchissement périodique
 * de l'état réel du cluster.
 */
setInterval(
  update,
  1000000
);