import type { Cluster } from "../../models/Cluster.js";
import type { VMSimulation } from "../../models/VMSimulation.js";

import { NodeCapacitySimulation } from "../../models/NodeCapacitySimulation.js";


export class HACapacitySimulationService {

  /**
   * Calcule la charge projetée CPU / RAM
   * de chaque node après simulation HA.
   *
   * Important :
   *
   * - la consommation actuelle du node vient du Cluster réel ;
   * - seule la consommation des VM réellement migrées
   *   est ajoutée comme surcharge HA ;
   * - aucune donnée du Cluster n'est modifiée.
   */
  simulate(
    cluster: Cluster,
    vmSimulations: VMSimulation[]
  ): NodeCapacitySimulation[] {

    const result: NodeCapacitySimulation[] = [];


    // ============================================================
    // Calcul node par node
    // ============================================================

    for (const node of cluster.nodes) {

      let cpuFailover = 0;
      let ramFailover = 0;


      // ==========================================================
      // Recherche des VM qui arrivent sur ce node
      // suite au failover.
      // ==========================================================

      const incomingVMs = vmSimulations.filter(
        simulation =>
          simulation.migrated &&
          simulation.available &&
          simulation.currentNode === node.name
      );


      // ==========================================================
      // Calcul de la surcharge apportée par ces VM
      // ==========================================================

      for (const simulation of incomingVMs) {

        /**
         * On retrouve la VM réelle afin de récupérer
         * ses ressources CPU et RAM.
         */
        const vm = this.findVM(
          cluster,
          simulation.vmId
        );

        if (!vm) {
          continue;
        }


        cpuFailover += vm.vcpu;
        ramFailover += vm.ram;
      }


      // ==========================================================
      // Construction du résultat pour ce node
      // ==========================================================

      result.push(
        new NodeCapacitySimulation(
          node.name,

          node.cpu.used,
          cpuFailover,
          node.cpu.total,

          node.ram.used,
          ramFailover,
          node.ram.total
        )
      );
    }


    return result;
  }


  /**
   * Recherche une VM dans l'ensemble du cluster.
   */
  private findVM(
    cluster: Cluster,
    vmId: number
  ) {

    for (const node of cluster.nodes) {

      const vm = node.vms.find(
        vm => vm.id === vmId
      );

      if (vm) {
        return vm;
      }
    }

    return undefined;
  }
}