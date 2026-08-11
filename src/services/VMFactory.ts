import { VM } from "../models/VM.js";
import type { RawVM } from "../interfaces/RawVM.js";

export class VMFactory {

  build(raw: RawVM): VM {
    return new VM(
      //`${raw.type}/${raw.vmid}`,
      raw.vmid,
      raw.name ?? `vm-${raw.vmid}`,
      raw.maxmem ?? 0,
      raw.maxcpu ?? 0,
      (raw as any).maxdisk ?? (raw as any).disk ?? 0,
      raw.node,
      raw.hastate != null && raw.hastate !== "disabled"
    );
  }
}