import { describe, expect, it } from "vitest";

import { HAResourceService } from "../../src/services/HA-engine/HAResourceService.js";
import { HAResource } from "../../src/models/HAResource.js";
import { HARule } from "../../src/models/HARule.js";


describe("HAResourceService", () => {

  /**
   * ============================================================
   * Cas n°1
   * ============================================================
   *
   * Vérifie que le service retourne bien
   * l'ensemble des identifiants des VM HA.
   */
  it("retourne les identifiants des VM déclarées HA", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const service = new HAResourceService();

    const rule = new HARule(
      "ha-rule-test",
      "node-affinity",
      []
    );

    const resources = [
      new HAResource(
        "vm:112",
        112,
        "started",
        rule
      ),

      new HAResource(
        "vm:121",
        121,
        "started",
        rule
      )
    ];


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const vmIds = service.getHAVMIds(
      resources
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(vmIds).toEqual(
      new Set([112, 121])
    );

  });



  /**
   * ============================================================
   * Cas n°2
   * ============================================================
   *
   * Vérifie que le service sait reconnaître
   * une VM déclarée comme ressource HA.
   */
  it("indique qu'une VM est déclarée HA", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const service = new HAResourceService();

    const resources = [
      new HAResource(
        "vm:112",
        112,
        "started"
      )
    ];


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const result = service.isHAVM(
      112,
      resources
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(result).toBe(true);

  });



  /**
   * ============================================================
   * Cas n°3
   * ============================================================
   *
   * Vérifie qu'une VM absente des ressources HA
   * n'est pas considérée comme HA.
   */
  it("indique qu'une VM n'est pas déclarée HA", () => {

    // -----------------------------------------------------------------
    // Arrange
    // -----------------------------------------------------------------

    const service = new HAResourceService();

    const resources = [
      new HAResource(
        "vm:112",
        112,
        "started"
      )
    ];


    // -----------------------------------------------------------------
    // Act
    // -----------------------------------------------------------------

    const result = service.isHAVM(
      150,
      resources
    );


    // -----------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------

    expect(result).toBe(false);

  });

});