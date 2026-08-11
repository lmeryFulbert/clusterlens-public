import { describe, expect, it } from "vitest";

import { HASimulationService } from "../../src/services/HA-engine/HASimulationService.js";
import { HAResourceService } from "../../src/services/HA-engine/HAResourceService.js";
import { HARuleResolver } from "../../src/services/HA-engine/HARuleResolver.js";

import { Cluster } from "../../src/models/Cluster.js";
import { ClusterState } from "../../src/models/ClusterState.js";
import { HAResource } from "../../src/models/HAResource.js";
import { HARule } from "../../src/models/HARule.js";

describe("HASimulationService", () => {

  /**
   * ============================================================
   * Cas n°1
   * ============================================================
   *
   * Le noeud d'origine fonctionne normalement.
   *
   * La VM doit :
   * - rester sur son noeud d'origine ;
   * - ne pas être marquée comme migrée ;
   * - rester disponible.
   */
  it("conserve une VM sur son noeud lorsque celui-ci est disponible", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const simulationService = new HASimulationService(
      new HAResourceService(),
      new HARuleResolver()
    );


    const cluster = new Cluster([
      {
        name: "proxmox-01",

        vms: [
          {
            id: 110,
            name: "VM-110"
          }
        ]
      }
    ] as any);


    const haResources: HAResource[] = [];


    /**
     * Aucun node n'est en panne.
     */
    const failedNodes = new Set<string>();


    /**
     * Construction du snapshot complet.
     *
     * Pour le moment les réplications ne sont pas utilisées
     * par HASimulationService.
     */
    const state = new ClusterState(
      cluster,
      haResources,
      []
    );


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const simulations = simulationService.simulate(
      state,
      failedNodes
    );


    const vmSimulation = simulations.find(
      simulation => simulation.vmId === 110
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(vmSimulation).toBeDefined();

    expect(vmSimulation?.homeNode)
      .toBe("proxmox-01");

    expect(vmSimulation?.currentNode)
      .toBe("proxmox-01");

    expect(vmSimulation?.ha)
      .toBe(false);

    expect(vmSimulation?.migrated)
      .toBe(false);

    expect(vmSimulation?.available)
      .toBe(true);

  });



  /**
   * ============================================================
   * Cas n°2
   * ============================================================
   *
   * Le noeud d'origine est en panne.
   *
   * La VM n'est PAS déclarée HA.
   *
   * Elle doit :
   * - rester affectée à son noeud d'origine ;
   * - ne pas être migrée ;
   * - être considérée comme indisponible.
   */
  it("ne déplace pas une VM non HA lorsque son noeud tombe", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const simulationService = new HASimulationService(
      new HAResourceService(),
      new HARuleResolver()
    );


    const cluster = new Cluster([
      {
        name: "proxmox-01",

        vms: [
          {
            id: 120,
            name: "VM-120"
          }
        ]
      }
    ] as any);


    /**
     * Aucune ressource HA :
     * la VM 101 n'est donc pas protégée par HA.
     */
    const haResources: HAResource[] = [];


    /**
     * proxmox-01 est simulé comme hors service.
     */
    const failedNodes = new Set<string>([
      "proxmox-01"
    ]);


    const state = new ClusterState(
      cluster,
      haResources,
      []
    );


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const simulations = simulationService.simulate(
      state,
      failedNodes
    );


    const vmSimulation = simulations.find(
      simulation => simulation.vmId === 120
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(vmSimulation).toBeDefined();

    expect(vmSimulation?.homeNode)
      .toBe("proxmox-01");

    expect(vmSimulation?.currentNode)
      .toBe("proxmox-01");

    expect(vmSimulation?.ha)
      .toBe(false);

    expect(vmSimulation?.migrated)
      .toBe(false);

    expect(vmSimulation?.available)
      .toBe(false);

  });



  /**
   * ============================================================
   * Cas n°3
   * ============================================================
   *
   * Le noeud d'origine est en panne.
   *
   * La VM est déclarée HA.
   *
   * La règle Proxmox prévoit :
   *
   * proxmox-02 : priorité 1
   * proxmox-01 : priorité 10
   *
   * La VM doit :
   * - avoir proxmox-01 comme noeud d'origine ;
   * - basculer sur proxmox-02 ;
   * - être marquée comme migrée ;
   * - rester disponible.
   */
  it("bascule une VM HA selon la règle Proxmox lorsque son noeud tombe", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const simulationService = new HASimulationService(
      new HAResourceService(),
      new HARuleResolver()
    );


    const cluster = new Cluster([
      {
        name: "proxmox-01",

        vms: [
          {
            id: 110,
            name: "VM-110"
          }
        ]
      },

      {
        name: "proxmox-02",
        vms: []
      }

    ] as any);


    /**
     * Règle HA attachée à la VM 112.
     */
    const rule = new HARule(
      "ha-rule-test",
      "node-affinity",
      [
        {
          node: "proxmox-02",
          priority: 1
        },
        {
          node: "proxmox-01",
          priority: 10
        }
      ]
    );


    const haResources = [
      new HAResource(
        "VM-110",
        110,
        "started",
        rule
      )
    ];


    /**
     * Le noeud d'origine tombe.
     */
    const failedNodes = new Set<string>([
      "proxmox-01"
    ]);


    const state = new ClusterState(
      cluster,
      haResources,
      []
    );


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const simulations = simulationService.simulate(
      state,
      failedNodes
    );


    const vmSimulation = simulations.find(
      simulation => simulation.vmId === 110
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(vmSimulation).toBeDefined();

    expect(vmSimulation?.homeNode)
      .toBe("proxmox-01");

    expect(vmSimulation?.currentNode)
      .toBe("proxmox-02");

    expect(vmSimulation?.ha)
      .toBe(true);

    expect(vmSimulation?.migrated)
      .toBe(true);

    expect(vmSimulation?.available)
      .toBe(true);

  });

});