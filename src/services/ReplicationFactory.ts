import type { RawReplication } from "../interfaces/RawReplication.js";
import type { ReplicationItem  } from "../models/Replication.js";

export class ReplicationFactory {

    build(raw: RawReplication, diskSize: number): ReplicationItem  {

        const replic: ReplicationItem  = {
            vmId: raw.guest,
            source: raw.source,
            target: raw.target,
            enabled: raw.enabled === 1,
            diskSize
        };

        if (raw.schedule) {
            replic.schedule = raw.schedule;
        }

        return replic;
    }
}