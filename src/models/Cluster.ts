import type { ProxmoxNode } from "./Node.js";

/**
 * Représente l'état courant de l'ensemble du cluster.
 */

export class Cluster {
  constructor(
    public readonly nodes: ProxmoxNode[],
  ) {}

  getNodeByName(name: string): ProxmoxNode | undefined {
    return this.nodes.find((n) => n.name === name);
  }

  getNodeById(id: string): ProxmoxNode | undefined {
    return this.nodes.find((n) => n.name === id);
  }

  nodesExcept(nodeName: string): ProxmoxNode[] {
    return this.nodes.filter((n) => n.name !== nodeName);
  }

  getNodesCount(): number {
    return this.nodes.length;
  }

  getVMCount(): number {
    return this.nodes.reduce(
      (acc, node) => acc + node.vms.length,
      0
    );
  }

  // =========================
  // RAM cluster-wide
  // =========================

  get ramTotale(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.ram.total,
      0
    );
  }

  get ramUtilisee(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.ram.used,
      0
    );
  }

  get ramDisponible(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.ram.available,
      0
    );
  }

  get ramTaux(): number {
    const total = this.ramTotale;
    return total > 0 ? this.ramUtilisee / total : 0;
  }

  // =========================
  // CPU cluster-wide
  // =========================

  get cpuTotal(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.cpu.total,
      0
    );
  }

  get cpuUtilise(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.cpu.used,
      0
    );
  }

  get cpuTaux(): number {
    const total = this.cpuTotal;
    return total > 0 ? this.cpuUtilise / total : 0;
  }

  // =========================
  // ZFS cluster-wide
  // =========================

  /*get stockageTotal(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.zfs.total,
      0
    );
  }

  get stockageUtilise(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.zfs.used,
      0
    );
  }

  get stockageDisponible(): number {
    return this.nodes.reduce(
      (sum, node) => sum + node.zfs.available,
      0
    );
  }

  get stockageTaux(): number {
    const total = this.stockageTotal;
    return total > 0 ? this.stockageUtilise / total : 0;
  }
    */

  get stockageUtilise(): number {
    return this.nodes
      .flatMap(node => node.zfs.pools)
      .reduce((sum, pool) => sum + (pool.used ?? 0), 0);
  }
  
  get stockageDisponible(): number {
    return this.nodes
      .flatMap(node => node.zfs.pools)
      .reduce((sum, pool) => sum + (pool.available ?? 0), 0);
  }
  
  get stockageTotal(): number {
    return this.nodes
      .flatMap(node => node.zfs.pools)
      .reduce((sum, pool) => sum + (pool.total ?? 0), 0);
  }
  
  get stockageTaux(): number {
    const total = this.stockageTotal;
    return total > 0 ? this.stockageUtilise / total : 0;
  }

  // =========================
  // SERIALIZATION
  // =========================

  toJSON() {
    return {
      nodes: this.nodes.map((n) => n.toJSON()),

      totalVMs: this.getVMCount(),

      ram: {
        total: this.ramTotale,
        used: this.ramUtilisee,
        available: this.ramDisponible,
        usage: this.ramTaux,
      },

      cpu: {
        total: this.cpuTotal,
        used: this.cpuUtilise,
        usage: this.cpuTaux,
      },

      zfs: {
        total: this.stockageTotal,
        used: this.stockageUtilise,
        available: this.stockageDisponible,
        usage: this.stockageTaux,
      }
    };
  }
}