import type { HAResource } from "../../models/HAResource.js";

export class HAResourceService {

  /**
   * Retourne les identifiants de toutes les VM
   * déclarées comme ressources HA dans Proxmox.
   *
   * Exemple :
   *
   * [
   *   HAResource(vm:112),
   *   HAResource(vm:121)
   * ]
   *
   * devient :
   *
   * Set { 112, 121 }
   */
  getHAVMIds(
    resources: HAResource[]
  ): Set<number> {

    const vmIds = new Set<number>();

    for (const resource of resources) {
      vmIds.add(resource.vmId);
    }

    return vmIds;
  }


  /**
   * Indique si une VM est déclarée HA.
   */
  isHAVM(
    vmId: number,
    resources: HAResource[]
  ): boolean {

    return resources.some(
      resource => resource.vmId === vmId
    );
  }


  /**
   * Recherche la ressource HA associée à une VM.
   *
   * Retourne undefined si la VM n'est pas
   * déclarée comme ressource HA.
   */
  findByVmId(
    vmId: number,
    resources: HAResource[]
  ): HAResource | undefined {

    return resources.find(
      resource => resource.vmId === vmId
    );
  }

}