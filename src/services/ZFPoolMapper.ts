import { ZfsPool } from "../models/ZfsPool.js";
import type { RawZfsPool } from "../interfaces/RawZfsPool.js";

export class ZfsPoolMapper {
  static fromRaw(raw: RawZfsPool[]): ZfsPool[] {
    return raw.map(p => {
      const total = p.total ?? 0;
      const used = p.used ?? 0;
      const available = p.avail ?? 0;

      return new ZfsPool(
        p.storage ?? "unknown",
        total,
        used,
        available,
        p.used_fraction ?? (total > 0 ? used / total : 0)
      );
    });
  }
}