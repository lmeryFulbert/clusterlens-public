export interface RawVM {
    vmid: number;
    name?: string;
    node: string;
    maxmem: number;
    maxcpu: number;
    disk: number;
    hastate?: string;
    type: "qemu" | "lxc";
  }