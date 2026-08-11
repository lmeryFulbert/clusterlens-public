import type { RawHAResource } from "../../interfaces/RawHAResource.js";
import type { RawHARule } from "../../interfaces/RawHARule.js";

import { HAResource } from "../../models/HAResource.js";
import { HARule } from "../../models/HARule.js";


export class HAFactory {

  /**
   * Construit une ressource HA métier à partir
   * des données brutes retournées par Proxmox.
   */
  build(
    resource: RawHAResource,
    rule?: RawHARule
  ): HAResource {

    /**
     * Construction éventuelle de la règle HA.
     *
     * Si aucune règle n'est associée à la ressource,
     * la propriété rule restera undefined.
     */
    const haRule = rule
      ? new HARule(
          rule.rule,
          rule.type,
          this.parseHANodes(rule.nodes)
        )
      : undefined;

    return new HAResource(
      resource.sid,
      Number(resource.sid.replace(/^vm:/, "")),
      resource.state,
      haRule
    );
  }


  /**
   * Transforme la chaîne Proxmox :
   *
   * proxmox-01:10,proxmox-02:1
   *
   * en :
   *
   * [
   *   { node: "proxmox-02", priority: 1 },
   *   { node: "proxmox-01", priority: 10 }
   * ]
   */
  private parseHANodes(nodes?: string) {

    if (!nodes) {
      return [];
    }
  
    return nodes
      .split(",")
      .map(n => {
        const [node, priority] = n.split(":");
  
        if (!node || priority === undefined) {
          return undefined;
        }
  
        return {
          node,
          priority: Number(priority)
        };
      })
      .filter(
        (item): item is { node: string; priority: number } =>
          item !== undefined
      )
      .sort((a, b) => a.priority - b.priority);
  }
}