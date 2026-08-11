export interface ReplicationItem  {
    vmId: string;
    source: string;
    target: string;
    schedule?: string;
    enabled: boolean;
    
    diskSize: number; // octets
  }
  
  export class Replication {
    constructor(
      public readonly links: ReplicationItem []
    ) {}
  
    getByVM(vmId: string): ReplicationItem   | undefined {
      return this.links.find(l => l.vmId === vmId);
    }
  
    getTargets(vmId: string): string[] {
      return this.links
        .filter(l => l.vmId === vmId)
        .map(l => l.target);
    }
  }