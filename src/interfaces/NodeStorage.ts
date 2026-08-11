import type { RawStorage } from "./RawStorage.js";
import type { RawZfsPool } from "./RawZfsPool.js";

export interface NodeZfs {
    node: string;
    pools: RawZfsPool[];
  }

export interface NodeStorage {
    node: string;
    storage: RawStorage[];
  }