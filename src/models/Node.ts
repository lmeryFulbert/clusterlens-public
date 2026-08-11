import type { VM } from "./VM.js";
import type { ZfsPool } from "./ZfsPool.js";

export class ProxmoxNode {
  constructor(
    public readonly name: string,

    public readonly ram: {
      total: number;
      used: number;
      available: number;
      usage: number;
    },

    public readonly cpu: {
      total: number;
      used: number;
      usage: number;
    },

    //public readonly zfsPools: ZfsPool[],

   public readonly zfs: {
      total: number;
      used: number;
      available: number;
      usage: number;
      pools: ZfsPool[];
    },
    

    public vms: VM[] = []
  ) {}

    // =========================
  // VM-based metrics
  // =========================

  get vcpuUtilises(): number {
    return this.vms.reduce((sum, vm) => sum + vm.vcpu, 0);
  }

  get vcpuDisponibles(): number {
    return this.cpu.total - this.vcpuUtilises;
  }

  get ramAlloueeVM(): number {
    return this.vms.reduce((sum, vm) => sum + vm.ram, 0);
  }

  // =========================
  // aliases pour compat vue
  // =========================

  get ramTotale(): number {
    return this.ram.total;
  }

  get ramUtilisee(): number {
    return this.ram.used;
  }

  get ramDisponible(): number {
    return this.ram.available;
  }

  get ramTaux(): number {
    return this.ram.usage;
  }

  get cpuTotal(): number {
    return this.cpu.total;
  }

  get tauxCPU(): number {
    return this.cpu.usage;
  }

  get stockageTotal(): number {
    return this.zfs.pools.reduce((s, p) => s + (p.total ?? 0), 0);
  }
  
  get stockageUtilise(): number {
    return this.zfs.pools.reduce((s, p) => s + (p.used ?? 0), 0);
  }
  
  get stockageDisponible(): number {
    return this.stockageTotal - this.stockageUtilise;
  }
  
  get tauxStockage(): number {
    return this.stockageTotal
      ? this.stockageUtilise / this.stockageTotal
      : 0;
  }

  toJSON() {
    return {
      name: this.name,
  
      ram: this.ram,
      cpu: this.cpu,
      zfs: this.zfs,
  
      vms: this.vms.map(v => v.toJSON())
    };
  }
}