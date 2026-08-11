import { pct } from "../utils/maths.js";
import { formatBytes } from "../utils/format.js";

/**
 * VIEW MODEL PUR
 * - aucune logique de failover
 * - aucune logique runtime
 * - uniquement transformation affichage
 */
export function buildNodeViewModel(node) {
  //console.log("[BUILD VM]", node.name, node.vmsHere);

  return {
    name: node.name,

    /**
     * CPU base node
     */
    vcputotal: node.cpu?.total ?? 0,
    vcpuused: node.cpu?.used ?? 0,
    tauxcpu: pct(node.cpu?.usage ?? 0),

    /**
     * RAM base node
     */
    ramTotal: formatBytes(node.ram?.total ?? 0),
    ramUsed: formatBytes(node.ram?.used ?? 0),
    tauxRAM: pct(node.ram?.usage ?? 0),

    /**
     * STORAGE base node
     */
    zfsTotal: formatBytes(node.zfs?.total ?? 0),
    zfsUsed: formatBytes(node.zfs?.used ?? 0),
    storagePct: pct(node.zfs?.usage ?? 0),
    storageWidth: Math.max(pct(node.zfs?.usage ?? 0), 5),

    /**
     * STATE SIMPLE (injecté par engine)
     */
    isOffline: node.isOffline ?? false,

    /**
     * VM runtime (déjà calculé par buildUIState)
     */
     vmsHere: node.vmsHere ?? [],

    /**
     * FAILOVER VIEW (optionnel mais clean)
     */
    vmsFailoverIds: node.vmsFailoverIds ?? []

  };
}


/**
 * RENDER UI PUR
 * - aucune logique métier
 * - uniquement affichage
 */
export function renderNodes(viewModels) {

  const container = document.getElementById("nodes-grid");

  container.innerHTML = [...viewModels]
    .sort((a, b) => a.name.localeCompare(b.name))       //necessaire pour le tri des nodes
    .map(node => {

    const vms = node.vmsHere?? [];
    //const failoverSet = new Set(node.vmsFailoverIds ?? []);
    const failoverMap = new Map(
      (node.vmsFailover ?? [])
        .map(vm => [
          vm.id,
          vm.origine
        ])
    );

    return `
      <div class="node-card">

        <div class="node-title">
          <div class="node-name">${node.name}</div>

          <span class="badge node-status ${node.isOffline ? "badge-warning" : "badge-ok"}">
            ${node.isOffline ? "OFFLINE" : "ONLINE"}
          </span>
        </div>

        <!-- CPU -->
        <div class="resource">
          <div class="resource-header">
            <span class="resource-name">vCPU</span>
            <span class="resource-value">
              ${node.vcpuused ?? 0}
               ${node.vmCpuFailover > 0 ? `+ ${node.vmCpuFailover}` : ""}
              / ${node.vcputotal ?? 0}
            </span>
          </div>

          <div class="capacity-bar">
            <div class="segment used" style="width:${node.tauxcpu ?? 0}%">
              ${node.tauxcpu ?? 0}%
            </div> 
            <div class="segment overlay" style="width:${node.overlayCpuPct ?? 0}%">
              ${(node.overlayCpuPct ?? 0).toFixed(1)}%
            </div>
          </div>
        </div>

        <!-- RAM -->
        <div class="resource">
          <div class="resource-header">
            <span class="resource-name">RAM</span>
            <span class="resource-value">
              ${node.ramUsed ?? 0}
               ${node.vmRamFailover > 0.0 ? `+ ${formatBytes(node.vmRamFailover)}` : ""}
              / ${node.ramTotal ?? 0}
            </span>
          </div>

          <div class="capacity-bar">
            <div class="segment used" style="width:${node.tauxRAM ?? 0}%">
              ${node.tauxRAM ?? 0}%
            </div>
            <div class="segment overlay" style="width:${node.overlayRamPct ?? 0}%">
              ${(node.overlayRamPct ?? 0).toFixed(1)}%
            </div>
          </div>
        </div>

        <!-- STORAGE -->
       <div class="resource">
        <div class="resource-header">
          <span class="resource-name">Stockage ZFS</span>

          <span class="resource-value storage-value">

            <span>
              ${formatBytes(node.localStorage ?? 0)} (VM Natives)
            </span>

            ${
              node.replicatedStorage > 0
                ? `
                  <span class="storage-replication">
                    + ${formatBytes(node.replicatedStorage)} (Replications ZFS)
                  </span>
                `
                : ""
            }

            <span class="storage-total">
              / ${node.zfsTotal ?? 0}
            </span>

          </span>
        </div>
          <div class="capacity-bar">
            <div class="segment used" style="width:${node.storageLocalPct ?? 0}%">
              ${node.storageLocalPct ?? 0}%
            </div>
            <div class="segment overlay" style="width:${node.storageReplicationPct ?? 0}%">
              ${(node.storageReplicationPct ?? 0).toFixed(1)}%
            </div>
          </div>
        </div>

        <!-- VM TABLE -->
        <div class="vm-failover">

          <table class="vm-table">
            <thead>
              <tr>
                <th>VM</th>
                <th>Origine</th>
              </tr>
            </thead>

            <tbody>
              ${vms.map(v => `
                <tr>
                  <td class="vm-origin">${v.id} - ${v.name}</td>

                  <td class="vm-target">
                    ${failoverMap.has(v.id)
                      ? `<span class="vm-chip">${failoverMap.get(v.id)}</span>`
                      : `<span class="vm-empty">-</span>`
                    }
                  </td>
                </tr>
              `).join("")}
            </tbody>

          </table>

        </div>

      </div>
    `;
  }).join("");
}