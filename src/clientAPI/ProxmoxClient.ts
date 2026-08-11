import axios, { type AxiosInstance } from "axios";
import https from "https";
import { config } from "../config/env.js";
import type { RawVM } from "../interfaces/RawVM.js";
import type { RawNodeSummary } from "../interfaces/RawNodeSummary.js";
import type { RawStorage } from "../interfaces/RawStorage.js";
import type { RawZfsPool } from "../interfaces/RawZfsPool.js";
import type { RawReplication } from "../interfaces/RawReplication.js";
import type { RawHAResource } from "../interfaces/RawHAResource.js";
import type { RawHARule } from "../interfaces/RawHARule.js";

/** Enveloppe générique de l'API Proxmox */
interface PveResponse<T> {
  data: T;
}

export class ProxmoxClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: `${config.proxmox.host}/api2/json`,
      headers: {
        Authorization: `PVEAPIToken=${config.proxmox.tokenId}=${config.proxmox.tokenSecret}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.proxmox.verifySSL,
      }),
      timeout: 10_000,
    });
  }

  fetchVMs() {
    return this.http.get<PveResponse<RawVM[]>>("/cluster/resources?type=vm")
      .then(r => r.data.data);
  }

  fetchNodes() {
    return this.http.get<PveResponse<RawNodeSummary[]>>("/nodes")
      .then(r => r.data.data.filter(n => n.status === "online"));
  }

  async fetchNodeReport(nodeName: string) {
    const res = await this.http.get<PveResponse<any>>(
      `/nodes/${nodeName}/report`
    );
  
    return res.data?.data;
  }

  fetchNodeStatusRaw(node: string) {
    return this.http
      .get(`/nodes/${node}/status`)
      .then(r => r.data.data);
  }

  fetchNodeReportRaw(node: string) {
    return this.http
      .get(`/nodes/${node}/report`)
      .then(r => r.data.data)
      .catch(() => null);
  }

  async fetchNodeResources() {
    const res = await this.http.get<PveResponse<any[]>>(
      "/cluster/resources?type=node"
    );

    return res.data.data;
  }

  fetchNodeStorage(node: string) {
    return this.http.get<PveResponse<RawStorage[]>>(`/nodes/${node}/storage`)
      .then(r => r.data.data);
  }

  async fetchAllStorage(): Promise<RawStorage[]> {
    const nodes = await this.fetchNodeResources();
  
    const perNode = await Promise.all(
      nodes.map(async (n) => {
        const res = await this.http.get<PveResponse<RawStorage[]>>(
          `/nodes/${n.node}/storage`
        );
  
        console.log("NODE =", n.node);
        console.table(res.data.data);
  
        return res.data.data;
      })
    );
  
    return perNode.flat();
  }

  async fetchZfsPools(node: string) : Promise<RawZfsPool[]> {
    /*const res = await this.http.get<PveResponse<any>>(
      `/nodes/${node}/disks/zfs`
    );
    */

    const res = await this.http.get<PveResponse<RawZfsPool[]>>(
      `/nodes/${node}/storage`
    );
    console.log(
      "ZFS RAW",
      node,
      res.data.data.filter((s: any) => s.type === "zfspool")
    );
   // return res.data.data;
    return res.data.data.filter(
      (s: any) => s.type === 'zfspool'
    );
  }

  //Replication ZFS
  async fetchReplications(): Promise<RawReplication[]> {
    const res = await this.http.get<PveResponse<RawReplication[]>>(
      "/cluster/replication"
    );
  
    const data = res.data?.data;
  
    if (!Array.isArray(data)) {
      console.warn("No replication data returned from Proxmox");
      return [];
    }

   // console.log("REPLICATION RAW =", data);
  
    return data;
  }

  // Haute dispo (different de la replication)
  async fetchHAResources(): Promise<RawHAResource[]> {
    const res = await this.http.get<PveResponse<RawHAResource[]>>(
      "/cluster/ha/resources"
    );
  
    return res.data.data;
  }

  // Groupes HA et ordre de priorité des noeuds
  async fetchHARules(): Promise<RawHARule[]> {
    const res = await this.http.get<PveResponse<RawHARule[]>>(
      "/cluster/ha/rules"
    );
  
    return res.data.data ?? [];
  }

}