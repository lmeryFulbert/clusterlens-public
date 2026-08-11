import { Cluster } from "../models/Cluster.js";
import { ProxmoxNode } from "../models/Node.js";
//import { VM } from "../models/VM.js";

import { VMFactory } from "./VMFactory.js";
import type { RawVM } from "../interfaces/RawVM.js";


export class ClusterFactory {

  private vmFactory = new VMFactory();

  buildCluster(
    nodes: ProxmoxNode[],
    vms: RawVM[],
  ): Cluster {

    const enrichedNodes = nodes.map(node => {

      const nodeVMs = vms
        .filter(v => v.node === node.name)
        .map(v => this.vmFactory.build(v));

      return new ProxmoxNode(
     //   node.id,
        node.name,

        node.ram,
        node.cpu,
        node.zfs,
      //  nodeVMs
      );
    });

    return new Cluster(enrichedNodes);
  }

}