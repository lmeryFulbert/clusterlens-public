import { ProxmoxClient } from "../clientAPI/ProxmoxClient.js";
import { Cluster } from "../models/Cluster.js";
import type { ReplicationItem  } from "../models/Replication.js";

import type { NodeService } from "./NodeService.js";
import { VMFactory } from "./VMFactory.js";
import { ReplicationFactory } from "./ReplicationFactory.js";
import { HAFactory } from "./HA-engine/HAFactory.js";


/**
 * Service principal de construction de l'état ClusterLens.
 *
 * Son rôle est d'orchestrer les différentes sources de données :
 *
 * - ProxmoxClient : récupération des données brutes Proxmox
 * - NodeService   : construction des noeuds du cluster
 * - Factories     : transformation des données brutes en modèles métier
 *
 * Le service ne contient pas de logique de transformation détaillée.
 * Celle-ci est déléguée aux factories.
 */
export class ClusterService {

  constructor(
    private client: ProxmoxClient,
    private nodeService: NodeService,
    private vmFactory: VMFactory,
    private replicationFactory: ReplicationFactory,
    private haFactory: HAFactory
  ) {}


  /**
   * Construit l'inventaire complet des noeuds avec leurs VM associées.
   *
   * Cette méthode constitue le point unique de création
   * de l'association Node -> VM.
   *
   * Les VM brutes retournées par Proxmox sont transformées
   * en modèles métier VM par la VMFactory.
   */
  private async getEnrichedNodes() {

    const nodes = await this.nodeService.getNodes();
    const vms = await this.client.fetchVMs();

    return nodes.map(node => {

      node.vms = vms
        .filter(vm => vm.node === node.name)
        .map(vm => this.vmFactory.build(vm));

      return node;
    });
  }


  /**
   * Retourne l'état global du cluster.
   *
   * Le modèle Cluster contient les noeuds enrichis
   * avec leurs VM.
   */
  async getState(): Promise<Cluster> {

    const enrichedNodes = await this.getEnrichedNodes();

    return new Cluster(enrichedNodes);
  }


  /**
   * Construit la vue des réplications configurées.
   *
   * Les données Proxmox de réplication ne contiennent pas toutes
   * les informations nécessaires à l'affichage ClusterLens.
   *
   * Exemple :
   * - RawReplication contient le VMID source/cible
   * - la taille du disque est disponible uniquement dans la VM
   *
   * On enrichit donc chaque réplication avec les informations
   * provenant de l'inventaire VM.
   */

  async getReplicationState(): Promise<ReplicationItem []> {

    const replications = await this.client.fetchReplications();
    const nodes = await this.getEnrichedNodes();
  
    const vms = nodes.flatMap(node => node.vms ?? []);
  
    return replications.map(replication => {
  
      const vm = vms.find(
        vm => vm.id === Number(replication.guest)
      );
  
      return this.replicationFactory.build(
        replication,
        vm?.disque ?? 0
      );
    });
  }


  /**
   * Construit l'état HA du cluster.
   *
   * Une ressource HA Proxmox et sa règle associée
   * sont fusionnées puis transformées par HAFactory.
   *
   * ClusterService connaît uniquement l'association
   * entre les données. La logique de transformation
   * reste dans HAFactory.
   */
  async getHAState() {

    const resources = await this.client.fetchHAResources();
    const rules = await this.client.fetchHARules();

    return {
      resources: resources.map(resource => {

        const rule = rules.find(
          rule => rule.resources?.includes(resource.sid)
        );

        return this.haFactory.build(resource, rule);
      })
    };
  }
}