import type { HAResource } from "../../models/HAResource.js";

export class HARuleResolver {

  resolveTarget(
    vmId: number,
    haResources: HAResource[],
    failedNodes: Set<string>
  ): string | undefined {

    const resource = haResources.find(
      resource => resource.vmId === vmId
    );

    const nodes = resource?.rule?.nodes;

    if (!nodes?.length) {
      return undefined;
    }

    return [...nodes]
      .sort((a, b) => a.priority - b.priority)
      .find(
        target => !failedNodes.has(target.node)
      )
      ?.node;
  }
}