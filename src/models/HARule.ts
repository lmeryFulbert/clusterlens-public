export interface HANodePriority {
    node: string;
    priority: number;
  }
  
  
  export class HARule {
  
    constructor(
      public readonly rule?: string,
      public readonly type?: string,
      public readonly nodes: HANodePriority[] = []
    ) {}
  
  }