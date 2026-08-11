/**
 * Affiche la vue des replications (Replication ZFS) des réplications du cluster.
 *
 * Cette fonction est responsable de :
 * - Afficher le nombre total de réplications configurées
 * - Construire le modèle de données HA à partir des nœuds et des réplications
 * - Rendre le résultat dans le tableau HTML de la vue HA
 *
 * Pour chaque VM répliquée, la vue affiche :
 * - Le nœud d’origine
 * - Le nom / identifiant de la VM
 * - Les cibles de failover (primaire et secondaire si présentes)
 *
 * @param {Array<Object>} nodes - Liste des nœuds du cluster contenant les VMs et leurs ressources
 * @param {Array<Object>} replications - Configuration des réplications HA
 *
 * @returns {void}
 */    
    
    export function renderReplications(nodes, replications) {

        const replicationCount = replications.length;
        document.getElementById("replication").textContent = `Nombre de Replications plannifiées : (${replicationCount})`;
  
        const tbody = document.querySelector(".ha-table tbody");
      
        const data = buildReplicationDataView(nodes, replications);
      
        tbody.innerHTML = data.map(r => `
          <tr>
            <td>${r.node}</td>
            <td>${r.vmName}</td>
            <td>${r.failover[0] ?? "-"}</td>
            <td>${r.failover[1] ?? "-"}</td>
          </tr>
        `).join("");
      }
  
      function indexVMs(nodes) {
        const map = new Map();
      
        for (const node of nodes) {
          for (const vm of node.vms) {
            const id = Number(
              String(vm.id)
                .replace("qemu/", "")
                .replace("lxc/", "")
            );
      
            map.set(id, { ...vm, node: node.name });
          }
        }
      
        return map;
      }


/**
 * Construit un modèle de données agrégé pour la vue des réplications HA.
 *
 * Cette fonction transforme les données brutes de réplication et des nœuds
 * en une structure optimisée pour l'affichage.
 *
 * Objectifs principaux :
 * - Associer chaque réplication à sa VM correspondante
 * - Regrouper les réplications par VM (agrégation)
 * - Dédupliquer les cibles de failover
 * - Produire une structure directement exploitable par la vue
 *
 * Processus :
 * 1. Création d'un index des VMs pour accès rapide (O(1))
 * 2. Parcours des réplications
 * 3. Normalisation de l'identifiant VM
 * 4. Agrégation des données par VM (Map)
 * 5. Ajout des cibles de failover
 * 6. Déduplication finale des failovers
 *
 * Structure retournée :
 * Array<{ node, vmName, failover: string[] }>
 *
 * @param {Array<Object>} nodes - Liste des nœuds du cluster contenant les VMs
 * @param {Array<Object>} replications - Liste des règles de réplication HA
 *
 * @returns {Array<Object>} Liste agrégée prête pour affichage
 */

export function buildReplicationDataView(nodes, replications) {
    const vmIndex = indexVMs(nodes);
  
    const map = new Map(); // vmId -> aggregated row
    
    for (const rep of replications) {
  
      //const vmId = Number(String(rep.vmId).replace("qemu/", "").replace("lxc/", ""));
      const vmId = Number(String(rep.vmId).match(/\d+/)?.[0]);
      const vm = vmIndex.get(vmId);
  
      if (!vm) continue;
  
      // init row si pas existant
      if (!map.has(vmId)) {
          map.set(vmId, {
                  node: vm.node,
                  vmName: `${vmId}-${vm.name ?? vm.id}`,
                  failover: []
                });
      }
  
      const row = map.get(vmId);
  
      // ajout failover sans doublon
      if (rep?.target) row.failover.push(rep.target);
      if (rep?.target2) row.failover.push(rep.target2);
    }
  
    // cleanup + dédup failover
    const rows = Array.from(map.values()).map(r => ({
      ...r,
      failover: [...new Set(r.failover)]
    }));
  
    return rows;
  }