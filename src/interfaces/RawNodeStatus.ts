export interface RawNodeStatus {
  node: string;
  memory: {
    total: number;       // Linux usable
    installed: number;   // hardware real
  };
  cpuinfo: {
    cpus: number;
  };
}
