import { describe, expect, it } from "vitest";

import { HARuleResolver } from "../../src/services/HA-engine/HARuleResolver.js";
import { HAResource } from "../../src/models/HAResource.js";
import { HARule } from "../../src/models/HARule.js";

describe("HARuleResolver", () => {

  /**
   * ============================================================
   * Cas n°1
   * ============================================================
   *
   * La VM possède deux nœuds de destination.
   *
   * proxmox-01 : priorité 10
   * proxmox-02 : priorité 1
   *
   * proxmox-01 étant indisponible,
   * le resolver doit choisir proxmox-02.
   *
   */
  it("choisit le node HA prioritaire disponible", () => {

    // -----------------------------------------------------------------
    // Arrange : préparation des données de test
    // -----------------------------------------------------------------

    const resolver = new HARuleResolver();

    const rule = new HARule(
      "ha-rule-test",
      "node-affinity",
      [
        { node: "proxmox-01", priority: 10 },
        { node: "proxmox-02", priority: 1 }
      ]
    );

    const resources = [
      new HAResource(
        "vm:112",
        112,
        "started",
        rule
      )
    ];

    const failedNodes = new Set([
      "proxmox-01"
    ]);

    // -----------------------------------------------------------------
    // Act : appel de la méthode à tester
    // -----------------------------------------------------------------

    const target = resolver.resolveTarget(
      112,
      resources,
      failedNodes
    );

    // -----------------------------------------------------------------
    // Assert : résultat attendu
    // -----------------------------------------------------------------

    expect(target).toBe("proxmox-02");

  });



  /**
   * ============================================================
   * Cas n°2
   * ============================================================
   *
   * Trois destinations sont possibles.
   *
   * proxmox-01 : priorité 1
   * proxmox-02 : priorité 5
   * proxmox-03 : priorité 10
   *
   * Les deux premières étant hors service,
   * la VM doit être placée sur proxmox-03.
   *
   */
  it("ignore les nodes en panne et choisit la priorité suivante", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const resolver = new HARuleResolver();

    const rule = new HARule(
      "ha-rule-test",
      "node-affinity",
      [
        { node: "proxmox-01", priority: 1 },
        { node: "proxmox-02", priority: 5 },
        { node: "proxmox-03", priority: 10 }
      ]
    );

    const resources = [
      new HAResource(
        "vm:121",
        121,
        "started",
        rule
      )
    ];

    const failedNodes = new Set([
      "proxmox-01",
      "proxmox-02"
    ]);

    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const target = resolver.resolveTarget(
      121,
      resources,
      failedNodes
    );

    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(target).toBe("proxmox-03");

  });



  /**
   * ============================================================
   * Cas n°3
   * ============================================================
   *
   * Toutes les destinations prévues par la règle HA
   * sont indisponibles.
   *
   * Aucun nœud ne peut accueillir la VM.
   *
   */
  it("retourne undefined lorsqu'aucune cible HA n'est disponible", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const resolver = new HARuleResolver();

    const rule = new HARule(
      "ha-rule-test",
      "node-affinity",
      [
        { node: "proxmox-01", priority: 1 },
        { node: "proxmox-02", priority: 5 }
      ]
    );

    const resources = [
      new HAResource(
        "vm:121",
        121,
        "started",
        rule
      )
    ];

    const failedNodes = new Set([
      "proxmox-01",
      "proxmox-02"
    ]);

    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const target = resolver.resolveTarget(
      121,
      resources,
      failedNodes
    );

    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(target).toBeUndefined();

  });

});