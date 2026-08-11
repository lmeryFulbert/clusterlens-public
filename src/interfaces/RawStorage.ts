/** Réponse brute de /storage */
export interface RawStorage {
    storage: string;
    node?: string;
    total?: number;
    used?: number;
    avail?: number;
    type?: string;
    content?: string;
    shared?: number;
  }