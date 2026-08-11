import { buildNodeViewModel } from "../views/nodes.view.js";


/**
 * Normalise un identifiant VM Proxmox.
 *
 * Exemple :
 * "100" -> 100
 * 100   -> 100
 */
function getVmId(id) {
  return Number(id);
}


/**
 * Construit l'état d'affichage du cluster.
 *
 * IMPORTANT :
 *
 * La logique HA n'est plus calculée ici.
 *
 * Le backend fournit déjà :
 *
 * - le placement simulé des VM ;
 * - les VM migrées ;
 * - la surcharge CPU ;
 * - la surcharge RAM.
 *
 * Cette fonction transforme uniquement ces données
 * pour les rendre compatibles avec les vues actuelles.
 *
 * Le calcul ZFS reste temporairement ici.
 */
export function buildUIState(clusterState) {

  const nodes = clusterState.nodes ?? [];
  const failedNodes = clusterState.failedNodes ?? new Set();
  const replicationLinks = clusterState.replications ?? [];

  /**
   * Dernière simulation calculée par le backend.
   */
  const simulation = clusterState.simulation;

  /**
   * Inventaire réel des VM.
   *
   * Il reste utile pour récupérer les propriétés complètes
   * des VM utilisées par certaines vues.
   */
  const allVMs = nodes.flatMap(node => node.vms ?? []);


  return nodes.map(node => {

    /**
     * ============================================================
     * Simulation HA du node
     * ============================================================
     */

    const capacitySimulation = simulation?.nodes?.find(
      simulatedNode => simulatedNode.nodeName === node.name
    );


    /**
     * VM que le moteur backend considère actuellement
     * présentes sur ce node.
     *
     * available évite d'afficher une VM restée
     * sur un node OFFLINE faute de failover possible.
     */
    const simulatedVMsHere = simulation?.vms?.filter(
      vm =>
        vm.currentNode === node.name &&
        vm.available
    );


    /**
     * Si aucune simulation n'a encore été effectuée,
     * on affiche simplement les VM réellement présentes.
     */
    const vmsHere = simulatedVMsHere
      ? simulatedVMsHere.map(simulatedVM => {

          const realVM = allVMs.find(
            vm => getVmId(vm.id) === simulatedVM.vmId
          );

          return realVM ?? {
            id: simulatedVM.vmId,
            name: simulatedVM.vmName
          };

        })
      : node.vms ?? [];


    /**
     * VM arrivées sur ce node à cause du failover.
     *
     * Le backend nous donne directement migrated=true.
     *
     * Plus besoin de :
     *
     * - vmHome
     * - haVMs
     * - comparaison des affectations
     */
    const vmsFailover = simulation?.vms
      ?.filter(
        vm =>
          vm.currentNode === node.name &&
          vm.migrated &&
          vm.available
      ) ?? [];


    /**
     * ============================================================
     * CPU / RAM
     * ============================================================
     *
     * Ces valeurs sont calculées par CapacitySimulationService.
     *
     * Aucun calcul HA n'est effectué côté frontend.
     */

    const vmCpuFailover =
      capacitySimulation?.cpuFailover ?? 0;

    const vmRamFailover =
      capacitySimulation?.ramFailover ?? 0;


    /**
     * Pourcentage occupé par la surcharge HA seule.
     *
     * Le backend fournit déjà la valeur absolue de failover.
     *
     * On conserve temporairement la conversion en pourcentage ici
     * uniquement pour rester compatible avec nodes.view.js.
     *
     * On pourra ensuite faire retourner directement ces valeurs
     * par l'API.
     */
    const overlayCpuPct = capacitySimulation
      ? (
          capacitySimulation.cpuFailover /
          capacitySimulation.cpuTotal
        ) * 100
      : 0;


    const overlayRamPct = capacitySimulation
      ? (
          capacitySimulation.ramFailover /
          capacitySimulation.ramTotal
        ) * 100
      : 0;


    /**
     * ============================================================
     * STOCKAGE ZFS
     * ============================================================
     *
     * Cette partie reste temporairement côté frontend.
     *
     * Elle sera déplacée ensuite dans le moteur backend.
     */

    const replicatedStorage = replicationLinks
      .filter(link => link.target === node.name)
      .reduce(
        (total, link) =>
          total + (link.diskSize ?? 0),
        0
      );


    /**
     * ZFS.used contient déjà les volumes répliqués.
     *
     * On sépare donc :
     *
     * stockage local
     * +
     * stockage répliqué
     */
    const localStorage = Math.max(
      0,
      (node.zfs?.used ?? 0) - replicatedStorage
    );


    const storagePct = node.zfs?.total
      ? (localStorage / node.zfs.total) * 100
      : 0;


    const replicatedZfsPct = node.zfs?.total
      ? (replicatedStorage / node.zfs.total) * 100
      : 0;


    /**
     * ============================================================
     * Extension runtime du node
     * ============================================================
     */

    const runtimeNode = {
      ...node,

      isOffline:
        failedNodes.has(node.name),

      vmsHere
    };


    /**
     * ============================================================
     * ViewModel final
     * ============================================================
     */

    return {

      ...buildNodeViewModel(runtimeNode),


      // ----------------------------------------------------------
      // Etat du node
      // ----------------------------------------------------------

      isOffline:
        runtimeNode.isOffline,


      // ----------------------------------------------------------
      // VM actuellement présentes
      // ----------------------------------------------------------

      vmsHere: vmsHere.map(vm => ({
        id: getVmId(vm.id),
        name: vm.name
      })),


      // ----------------------------------------------------------
      // VM présentes réellement à l'origine
      // ----------------------------------------------------------

      vmsHomeNames: (node.vms ?? [])
        .map(vm => vm.name),


      // ----------------------------------------------------------
      // VM déplacées par le moteur HA
      // ----------------------------------------------------------

      vmsFailoverIds: vmsFailover
        .map(vm => vm.vmId),

      vmsFailover: vmsFailover
        .map(vm => ({
          id: vm.vmId,
          name: vm.vmName,
          origine: vm.homeNode
        })),

      vmsFailoverNames: vmsFailover
        .map(vm => vm.vmName),


      // ----------------------------------------------------------
      // Charge HA calculée par le backend
      // ----------------------------------------------------------

      vmCpuFailover,

      vmRamFailover,


      // ----------------------------------------------------------
      // Stockage
      // ----------------------------------------------------------

      replicatedStorage,

      localStorage,


      // ----------------------------------------------------------
      // Jauges
      // ----------------------------------------------------------

      overlayCpuPct:
        Math.round(overlayCpuPct * 10) / 10,

      overlayRamPct:
        Math.round(overlayRamPct * 10) / 10,

      storageLocalPct:
        Math.round(storagePct * 10) / 10,

      storageReplicationPct:
        Math.round(replicatedZfsPct * 10) / 10

    };

  });
}