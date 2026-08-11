import type { ClusterState } from "../../models/ClusterState.js";

import { VMSimulation } from "../../models/VMSimulation.js";

import { HAResourceService } from "./HAResourceService.js";
import { HARuleResolver } from "./HARuleResolver.js";


export class HASimulationService {

  constructor(
    private readonly haResourceService: HAResourceService,
    private readonly haRuleResolver: HARuleResolver
  ) {}


  /**
   * Simule le placement et l'état des VM
   * après la panne d'un ou plusieurs noeuds.
   *
   * La simulation travaille à partir d'un snapshot
   * complet de l'état réel du cluster.
   *
   * Aucun objet du ClusterState n'est modifié.
   */
  simulate(
    state: ClusterState,
    failedNodes: Set<string>
  ): VMSimulation[] {

    const simulations: VMSimulation[] = [];


    // ============================================================
    // Parcours du cluster réel
    // ============================================================

    for (const node of state.cluster.nodes) {

      for (const vm of node.vms) {

        const vmId = vm.id;
        const homeNode = node.name;


        /**
         * Vérifie si la VM est déclarée HA
         * dans la configuration Proxmox.
         */
        const isHA = this.haResourceService.isHAVM(
          vmId,
          state.haResources
        );


        // ========================================================
        // CAS 1
        // Le noeud d'origine fonctionne normalement.
        // ========================================================

        if (!failedNodes.has(homeNode)) {

          simulations.push(
            new VMSimulation(
              vmId,
              vm.name,
              homeNode,
              homeNode,
              isHA,
              false,
              true
            )
          );

          continue;
        }


        // ========================================================
        // CAS 2
        // Le noeud est en panne et la VM n'est pas HA.
        // ========================================================

        if (!isHA) {

          simulations.push(
            new VMSimulation(
              vmId,
              vm.name,
              homeNode,
              homeNode,
              false,
              false,
              false
            )
          );

          continue;
        }


        // ========================================================
        // CAS 3
        // Le noeud est en panne et la VM est HA.
        //
        // On applique la règle HA Proxmox.
        // ========================================================

        const targetNode =
          this.haRuleResolver.resolveTarget(
            vmId,
            state.haResources,
            failedNodes
          );


        // --------------------------------------------------------
        // Une cible HA est disponible.
        // --------------------------------------------------------

        if (targetNode) {

          simulations.push(
            new VMSimulation(
              vmId,
              vm.name,
              homeNode,
              targetNode,
              true,
              true,
              true
            )
          );

          continue;
        }


        // --------------------------------------------------------
        // VM HA mais aucune cible HA disponible.
        // --------------------------------------------------------

        simulations.push(
          new VMSimulation(
            vmId,
            vm.name,
            homeNode,
            homeNode,
            true,
            false,
            false
          )
        );
      }
    }


    return simulations;
  }
}