/**
 * État global du dashboard.
 *
 * Le frontend conserve uniquement :
 * - les données réelles remontées par /state ;
 * - les noeuds que l'utilisateur simule OFFLINE ;
 * - le dernier résultat calculé par le moteur HA backend.
 *
 * La logique HA n'est plus calculée côté navigateur.
 */
export const clusterState = {

  /**
   * Inventaire réel des noeuds Proxmox.
   *
   * Contient notamment :
   * - CPU ;
   * - RAM ;
   * - ZFS ;
   * - VM présentes réellement sur chaque node.
   *
   * Source : GET /state
   */
  nodes: [],


  /**
   * Réplications ZFS configurées.
   *
   * Cette information est encore utilisée
   * temporairement côté frontend pour le calcul
   * d'affichage du stockage.
   *
   * Source : GET /state
   */
  replications: [],


  /**
   * Ressources HA Proxmox.
   *
   * Conservées temporairement dans le frontend
   * pour compatibilité avec certaines vues.
   *
   * La décision de failover n'est plus calculée ici.
   *
   * Source : GET /state
   */
  haResources: [],


  /**
   * Nodes considérés OFFLINE par l'utilisateur.
   *
   * Ceci est bien un état UI :
   *
   * l'utilisateur choisit les pannes
   * qu'il souhaite simuler.
   */
  failedNodes: new Set(),


  /**
   * Dernier résultat retourné par le moteur HA backend.
   *
   * Structure :
   *
   * {
   *   failedNodes: [],
   *   vms: [],
   *   nodes: []
   * }
   *
   * Cette propriété devient la source de vérité
   * pour tout ce qui concerne :
   *
   * - placement simulé des VM ;
   * - disponibilité des VM ;
   * - migration HA ;
   * - surcharge CPU ;
   * - surcharge RAM.
   */
  simulation: null,

};