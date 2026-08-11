export class VM {
  constructor(
    public readonly id: number,          
    public readonly name: string,

    public readonly ram: number,         // bytes (maxmem)
    public readonly vcpu: number,        // maxcpu
    public readonly disque: number,      // maxdisk

    public readonly noeudActuel: string, // node name
    public readonly haActive: boolean
  ) {}

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      ram: this.ram,
      vcpu: this.vcpu,
      disque: this.disque,
      noeudActuel: this.noeudActuel,
      haActive: this.haActive,
    };
  }
}