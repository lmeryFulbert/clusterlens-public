import { formatBytes } from "../utils/format.js";

/**
 * Calcule les métriques globales du cluster à partir des nodes.
 */
function buildClusterOverview(nodes) {
  if (!Array.isArray(nodes)) {
    return {
      nodeCount: 0,
      vmCount: 0,
      ramUsed: 0,
      ramTotal: 0,
      ramPercent: 0,
      storageUsed: 0,
      storageTotal: 0,
      storagePercent: 0
    };
  }

  const nodeCount = nodes.length;

  const vmCount = nodes.reduce((sum, n) => sum + (n.vms?.length ?? 0), 0);

  // ======================
  // RAM 
  // ======================
  const ramUsed = nodes.reduce((sum, n) => sum + (n.ram?.used ?? 0), 0);
  const ramTotal = nodes.reduce((sum, n) => sum + (n.ram?.total ?? 0), 0);

  // ======================
  // STORAGE ZFS
  // ======================
  const storageUsed = nodes.reduce((sum, n) => sum + (n.zfs?.used ?? 0), 0);
  const storageTotal = nodes.reduce((sum, n) => sum + (n.zfs?.total ?? 0), 0);

  const ramPercent = ramTotal ? (ramUsed / ramTotal) * 100 : 0;
  const storagePercent = storageTotal ? (storageUsed / storageTotal) * 100 : 0;

  return {
    nodeCount,
    vmCount,
    ramUsed,
    ramTotal,
    ramPercent,
    storageUsed,
    storageTotal,
    storagePercent
  };
}

/**
 * Affiche le résumé global du cluster dans l'interface utilisateur.
 */
export function renderOverView(data) {
  const nodes = Array.isArray(data) ? data : (data?.nodes ?? []);

  const overview = buildClusterOverview(nodes);

  document.getElementById("nodesCount").textContent = overview.nodeCount;
  document.getElementById("vmCount").textContent = overview.vmCount;

  document.getElementById("ramUsed").textContent =
    `${formatBytes(overview.ramUsed)} / ${formatBytes(overview.ramTotal)} (${overview.ramPercent.toFixed(1)}%)`;

  document.getElementById("storageUsed").textContent =
    `${formatBytes(overview.storageUsed)} / ${formatBytes(overview.storageTotal)} (${overview.storagePercent.toFixed(1)}%)`;
}