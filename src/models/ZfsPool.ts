  export class ZfsPool {
    constructor(
      public name: string,
      public total: number,
      public used: number,
      public available: number,
      public usedFraction: number
    ) {}
  
    get physicalUsed(): number {
      return this.used;
    }
  
    get percent(): number {
      return this.usedFraction * 100;
    }
  }