export interface RawReplication {
  id: string;
  guest: string;     // VMID
  source: string;
  target: string;
  schedule?: string;
  enabled?: number;
  type?: string;
  comment?: string;
}