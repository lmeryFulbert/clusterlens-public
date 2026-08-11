/*export interface RawZfsPool {
    name: string;
    alloc: number;
    size: number;
    free: number;
    health: string;
  }
    */

  export interface RawZfsPool {
    storage: string;
    type: string;
  
    total: number;
    used: number;
    avail: number;
  
    used_fraction: number;
  
    active?: number;
    enabled?: number;
  }