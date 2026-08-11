export class VMSimulation {

    constructor(
      public readonly vmId: number,
      public readonly vmName: string,
  
      /**
       * Nœud réel d'origine de la VM.
       */
      public readonly homeNode: string,
  
      /**
       * Nœud sur lequel la VM se trouverait
       * dans la simulation.
       */
      public readonly currentNode: string,
  
      /**
       * Indique si la VM est déclarée HA.
       */
      public readonly ha: boolean,
  
      /**
       * Indique si la VM a changé de nœud
       * dans la simulation.
       */
      public readonly migrated: boolean,
  
      /**
       * Indique si la VM reste disponible.
       *
       * Une VM non HA sur un nœud en panne
       * sera par exemple :
       *
       * available = false
       */
      public readonly available: boolean
    ) {}
  
  }