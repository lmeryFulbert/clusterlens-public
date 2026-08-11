import type { FastifyInstance } from "fastify";

import {
  clusterService,
  haSimulationService,
  capacitySimulationService
} from "../compositionRoot.js";

import { ClusterState } from "../models/ClusterState.js";


/**
 * Module de déclaration des routes HTTP de l'API ClusterLens.
 *
 * Cette couche constitue le point d'entrée HTTP.
 *
 * Elle :
 *
 * - reçoit les requêtes ;
 * - appelle les services métier ;
 * - construit les réponses HTTP.
 *
 * Elle ne contient pas la logique de simulation HA.
 */
export async function registerRoutes(
  app: FastifyInstance
): Promise<void> {


  /**
   * ============================================================
   * GET /favicon.ico
   * ============================================================
   */
  app.get("/favicon.ico", async (_req, reply) => {
    reply.code(204).send();
  });


  /**
   * ============================================================
   * GET /health
   * ============================================================
   *
   * Vérifie uniquement que ClusterLens fonctionne.
   *
   * Cet endpoint ne teste pas Proxmox.
   */
  app.get("/health", async (_req, reply) => {

    reply.send({
      status: "ok",
      timestamp: new Date().toISOString()
    });

  });


  /**
   * ============================================================
   * GET /state
   * ============================================================
   *
   * Retourne l'état réel courant du cluster :
   *
   * - nodes ;
   * - VM ;
   * - CPU ;
   * - RAM ;
   * - ZFS ;
   * - réplications ;
   * - ressources HA.
   */
  app.get("/state", async (_req, reply) => {

    try {

      const [
        cluster,
        replication,
        ha
      ] = await Promise.all([
        clusterService.getState(),
        clusterService.getReplicationState(),
        clusterService.getHAState()
      ]);


      reply.send({
        ...cluster.toJSON(),
        replications: replication,
        haResources: ha.resources.map(resource => ({
            sid: resource.sid,
            vmId: resource.vmId,
            state: resource.state,
            rule: resource.rule?.rule,
            type: resource.rule?.type,
            nodes: resource.rule?.nodes ?? []
          }))
      });


    } catch (err) {

      reply.status(502).send({
        error: "Impossible de contacter Proxmox",
        detail: String(err)
      });

    }

  });


  /**
 * ============================================================
 * GET /simulation
 * ============================================================
 *
 * Simule la panne d'un ou plusieurs nodes.
 *
 * Exemple :
 *
 * /simulation
 *
 * /simulation?failedNodes=proxmox-01
 *
 * /simulation?failedNodes=proxmox-01,proxmox-02
 *
 * Chaque requête repart de l'état réel courant
 * du cluster Proxmox.
 */
app.get<{
    Querystring: {
      failedNodes?: string;
    };
  }>("/simulation", async (request, reply) => {
  
    try {
  
      // --------------------------------------------------------
      // Liste des nodes simulés comme étant en panne
      // --------------------------------------------------------
  
      const failedNodes = new Set(
        request.query.failedNodes
          ?.split(",")
          .map(node => node.trim())
          .filter(Boolean) ?? []
      );
  
  
      // --------------------------------------------------------
      // Récupération de l'état réel courant
      // --------------------------------------------------------
  
      const [
        cluster,
        replication,
        ha
      ] = await Promise.all([
        clusterService.getState(),
        clusterService.getReplicationState(),
        clusterService.getHAState()
      ]);
  
  
      // --------------------------------------------------------
      // Construction du snapshot métier
      // --------------------------------------------------------
  
      const state = new ClusterState(
        cluster,
        ha.resources,
        replication
      );
  
  
      // --------------------------------------------------------
      // Simulation du placement des VM
      // --------------------------------------------------------
  
      const vmSimulations = haSimulationService.simulate(
        state,
        failedNodes
      );
  
  
      // --------------------------------------------------------
      // Calcul de l'impact CPU / RAM
      // --------------------------------------------------------
  
      const capacities = capacitySimulationService.simulate(
        cluster,
        vmSimulations
      );
  
  
      // --------------------------------------------------------
      // Réponse API
      // --------------------------------------------------------
  
      reply.send({
  
        failedNodes: [...failedNodes],
  
        vms: vmSimulations,
  
        nodes: capacities
  
      });
  
    } catch (err) {
  
      reply.status(502).send({
  
        error: "Impossible de simuler l'état HA du cluster",
  
        detail: String(err)
  
      });
  
    }
  
  });

}