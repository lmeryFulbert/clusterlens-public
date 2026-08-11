import { describe, expect, it } from "vitest";

import { HACapacitySimulationService } from "../../src/services/HA-engine/HACapacitySimulationService.js";

import { Cluster } from "../../src/models/Cluster.js";
import { VMSimulation } from "../../src/models/VMSimulation.js";


describe("CapacitySimulationService", () => {

  /**
   * ============================================================
   * Cas n°1
   * ============================================================
   *
   * Aucune VM n'arrive en failover sur le node.
   *
   * La surcharge CPU / RAM doit donc être nulle.
   */
  it("ne rajoute aucune charge lorsqu'aucune VM ne migre", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const service = new HACapacitySimulationService();

    const cluster = new Cluster([
      {
        name: "proxmox-01",

        cpu: {
          total: 64,
          used: 20
        },

        ram: {
          total: 192 * 1024 * 1024 * 1024,
          used: 64 * 1024 * 1024 * 1024
        },

        vms: [
          {
            id: 100,
            name: "VM-100",
            vcpu: 2,
            ram: 4 * 1024 * 1024 * 1024
          }
        ]
      }
    ] as any);


    /**
     * La VM reste sur son node.
     *
     * migrated = false
     */
    const simulations = [
      new VMSimulation(
        100,
        "VM-100",
        "proxmox-01",
        "proxmox-01",
        true,
        false,
        true
      )
    ];


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const result = service.simulate(
      cluster,
      simulations
    );


    const node = result.find(
      simulation => simulation.nodeName === "proxmox-01"
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(node).toBeDefined();
    expect(node?.cpuUsed).toBe(20);
    expect(node?.cpuFailover).toBe(0);
    expect(node?.cpuProjected).toBe(20);

    expect(node?.ramUsed).toBe(64 * 1024 * 1024 * 1024);
    expect(node?.ramFailover).toBe(0);
    expect(node?.ramProjected).toBe(64 * 1024 * 1024 * 1024);
  });



  /**
   * ============================================================
   * Cas n°2
   * ============================================================
   *
   * Une VM arrive en failover sur proxmox-02.
   *
   * Ses vCPU et sa RAM doivent être ajoutés
   * à la charge projetée du node.
   */
  it("ajoute les ressources d'une VM migrée au node cible", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const service = new HACapacitySimulationService();

    const cluster = new Cluster([

      /**
       * Node d'origine de la VM.
       */
      {
        name: "proxmox-01",

        cpu: {
          total: 64,
          used: 10
        },

        ram: {
          total: 192 * 1024 * 1024 * 1024,
          used: 32 * 1024 * 1024 * 1024
        },

        vms: [
          {
            id: 110,
            name: "VM-110",
            vcpu: 2,
            ram: 2 * 1024 * 1024 * 1024
          }
        ]
      },


      /**
       * Node cible du failover.
       */
      {
        name: "proxmox-02",

        cpu: {
          total: 64,
          used: 20
        },

        ram: {
          total: 192 * 1024 * 1024 * 1024,
          used: 64 * 1024 * 1024 * 1024
        },

        vms: []
      }

    ] as any);


    /**
     * La VM 110 bascule :
     *
     * proxmox-01 -> proxmox-02
     */
    const simulations = [
      new VMSimulation(
        110,
        "VM-110",
        "proxmox-01",
        "proxmox-02",
        true,
        true,
        true
      )
    ];


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const result = service.simulate(
      cluster,
      simulations
    );


    const node = result.find(
      simulation => simulation.nodeName === "proxmox-02"
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(node).toBeDefined();


    /**
     * CPU :
     *
     * charge actuelle = 20
     * failover        = +2
     * projetée        = 22
     */
    expect(node?.cpuUsed).toBe(20);

    expect(node?.cpuFailover).toBe(2);

    expect(node?.cpuProjected).toBe(22);


    /**
     * RAM :
     *
     * charge actuelle = 64 Go
     * failover        = +2 Go
     * projetée        = 66 Go
     */
    expect(node?.ramUsed).toBe(64 * 1024 * 1024 * 1024);
    expect(node?.ramFailover).toBe(2 * 1024 * 1024 * 1024);
    expect(node?.ramProjected).toBe(66 * 1024 * 1024 * 1024);

  });



  /**
   * ============================================================
   * Cas n°3
   * ============================================================
   *
   * Deux VM différentes arrivent en failover
   * sur le même node.
   *
   * Les ressources des deux VM doivent être additionnées.
   */
  it("additionne les ressources de plusieurs VM migrées vers le même node", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const service = new HACapacitySimulationService();


    const cluster = new Cluster([

      {
        name: "proxmox-01",

        cpu: {
          total: 64,
          used: 10
        },

        ram: {
          total: 192 * 1024 * 1024 * 1024,
          used: 32 * 1024 * 1024 * 1024
        },

        vms: [
          {
            id: 120,
            name: "VM-120",

            vcpu: 2,

            ram:
              2 * 1024 * 1024 * 1024
          },

          {
            id: 130,
            name: "VM-130",

            vcpu: 1,

            ram:
              1 * 1024 * 1024 * 1024
          }
        ]
      },


      {
        name: "proxmox-02",

        cpu: {
          total: 64,
          used: 20
        },

        ram: {
          total: 192 * 1024 * 1024 * 1024,
          used: 64 * 1024 * 1024 * 1024
        },

        vms: []
      }

    ] as any);


    /**
     * Les deux VM arrivent sur proxmox-02.
     */
    const simulations = [

      new VMSimulation(
        120,
        "VM-120",
        "proxmox-01",
        "proxmox-02",
        true,
        true,
        true
      ),

      new VMSimulation(
        130,
        "VM-130",
        "proxmox-01",
        "proxmox-02",
        true,
        true,
        true
      )

    ];


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const result = service.simulate(
      cluster,
      simulations
    );


    const node = result.find(
      simulation => simulation.nodeName === "proxmox-02"
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(node).toBeDefined();


    /**
     * CPU :
     *
     * VM 112 = 2
     * VM 116 = 1
     *
     * surcharge totale = 3 vCPU
     */
    expect(node?.cpuFailover).toBe(3);

    expect(node?.cpuProjected).toBe(23);


    /**
     * RAM :
     *
     * VM 112 = 2 Go
     * VM 116 = 1 Go
     *
     * surcharge totale = 3 Go
     */
    expect(node?.ramFailover).toBe(3 * 1024 * 1024 * 1024);

    expect(node?.ramProjected).toBe(67 * 1024 * 1024 * 1024);

  });

});