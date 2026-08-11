import { ProxmoxClient } from "../clientAPI/ProxmoxClient.js";
import { ProxmoxNode } from "../models/Node.js";
import { VMFactory } from "../services/VMFactory.js";
import { ZfsPool } from "../models/ZfsPool.js";
import type { RawVM } from "../interfaces/RawVM.js";

export class NodeService {

  constructor(
    private readonly proxmox: ProxmoxClient,
    private readonly vmFactory: VMFactory
  ) {}


  async getNodes(): Promise<ProxmoxNode[]> {

    const nodes = await this.proxmox.fetchNodes();

    const vmsRaw = await this.proxmox.fetchVMs();


    return Promise.all(
      nodes.map(async (node) => {


        const [
          status,
          zfsRaw
        ] = await Promise.all([
          this.proxmox.fetchNodeStatusRaw(node.node),
          this.proxmox.fetchZfsPools(node.node),
        ]);


        /*
         * Construction des objets métier VM.
         *
         * Le NodeService ne connaît pas
         * les détails Proxmox (maxmem, maxcpu, hastate...)
         */
        const vms = (vmsRaw ?? [])
          .filter((vm: RawVM) => vm.node === node.node)
          .map(vm => this.vmFactory.build(vm));



        /*
         * Les ressources RAM sont calculées
         * à partir des VM réservées.
         *
         * Objectif :
         * simuler la capacité nécessaire
         * en cas de bascule HA.
         */
        const ramUsed = vms.reduce(
          (sum, vm) => sum + vm.ram,
          0
        );


        const ramTotal = status?.memory?.total ?? 0;


        const ram = {
          total: ramTotal,
          used: ramUsed,
          available: Math.max(ramTotal - ramUsed, 0),
          usage: ramTotal > 0
            ? ramUsed / ramTotal
            : 0,
        };



        /*
         * CPU réservé par les VM.
         */
        const cpuUsed = vms.reduce(
          (sum, vm) => sum + vm.vcpu,
          0
        );


        const cpuTotal = status?.cpuinfo?.cpus ?? 0;


        const cpu = {
          total: cpuTotal,
          used: cpuUsed,
          usage: cpuTotal > 0
            ? cpuUsed / cpuTotal
            : 0,
        };



        /*
         * Construction des objets ZFS.
         *
         */
        const pools = (Array.isArray(zfsRaw) ? zfsRaw : [])
        .map(raw =>
          new ZfsPool(
            raw.storage,
            raw.total ?? 0,
            raw.used ?? 0,
            raw.avail ?? 0,
            raw.total > 0
              ? (raw.used ?? 0) / raw.total
              : 0
          )
        );


        const zfsTotal = pools.reduce(
          (sum, pool) => sum + pool.total,
          0
        );


        const zfsUsed = pools.reduce(
          (sum, pool) => sum + pool.used,
          0
        );


        const zfs = {
          total: zfsTotal,
          used: zfsUsed,
          available: Math.max(zfsTotal - zfsUsed, 0),
          usage: zfsTotal > 0
            ? zfsUsed / zfsTotal
            : 0,
          pools,
        };



        /*
         * Ici seulement :
         * Raw Proxmox -> Objet métier Node
         */
        return new ProxmoxNode(
          node.node,
          ram,
          cpu,
          zfs,
          vms
        );

      })
    );
  }
}