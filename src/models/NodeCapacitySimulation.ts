export class NodeCapacitySimulation {

  constructor(
    public readonly nodeName: string,

    /**
     * CPU actuellement consommé sur le node.
     */
    public readonly cpuUsed: number,

    /**
     * CPU ajouté par les VM arrivant en failover.
     */
    public readonly cpuFailover: number,

    /**
     * CPU total disponible sur le node.
     */
    public readonly cpuTotal: number,

    /**
     * RAM actuellement consommée sur le node.
     */
    public readonly ramUsed: number,

    /**
     * RAM ajoutée par les VM arrivant en failover.
     */
    public readonly ramFailover: number,

    /**
     * RAM totale disponible sur le node.
     */
    public readonly ramTotal: number
  ) {}


  /**
   * CPU projeté après failover.
   */
  get cpuProjected(): number {
    return this.cpuUsed + this.cpuFailover;
  }


  /**
   * Taux CPU projeté.
   */
  get cpuProjectedUsage(): number {
    return this.cpuTotal > 0
      ? this.cpuProjected / this.cpuTotal
      : 0;
  }


  /**
   * RAM projetée après failover.
   */
  get ramProjected(): number {
    return this.ramUsed + this.ramFailover;
  }


  /**
   * Taux RAM projeté.
   */
  get ramProjectedUsage(): number {
    return this.ramTotal > 0
      ? this.ramProjected / this.ramTotal
      : 0;
  }


  /**
   * Représentation JSON exposée par l'API.
   *
   * Les getters TypeScript ne sont pas sérialisés
   * automatiquement par JSON.stringify().
   *
   * On expose donc explicitement les valeurs projetées
   * pour éviter tout recalcul côté frontend.
   */
  toJSON() {
    return {
      nodeName: this.nodeName,

      cpuUsed: this.cpuUsed,
      cpuFailover: this.cpuFailover,
      cpuProjected: this.cpuProjected,
      cpuTotal: this.cpuTotal,
      cpuProjectedUsage: this.cpuProjectedUsage,

      ramUsed: this.ramUsed,
      ramFailover: this.ramFailover,
      ramProjected: this.ramProjected,
      ramTotal: this.ramTotal,
      ramProjectedUsage: this.ramProjectedUsage
    };
  }
}