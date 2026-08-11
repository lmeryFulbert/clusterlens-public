import type { Cluster } from "./Cluster.js";
import type { HAResource } from "./HAResource.js";
import type { ReplicationItem } from "./Replication.js";


/**
 * Représente l'état complet du cluster nécessaire
 * au moteur de simulation ClusterLens.
 *
 * Il regroupe :
 *
 * - l'état des noeuds et des VM ;
 * - la configuration HA ;
 * - les réplications ZFS.
 *
 * Ce modèle ne réalise aucun calcul.
 * Il contient uniquement les données nécessaires
 * aux différents services métier.
 */
export class ClusterState {

  constructor(
    public readonly cluster: Cluster,
    public readonly haResources: HAResource[],
    public readonly replications: ReplicationItem[]
  ) {}

}