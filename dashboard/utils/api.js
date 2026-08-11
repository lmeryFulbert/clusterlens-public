/**
 * Récupère l'état réel du cluster.
 */
export async function fetchState() {
  const res = await fetch("/state");

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API /state ${res.status}: ${text}`);
  }

  return await res.json();
}


/**
 * Demande au backend de simuler la panne
 * d'un ou plusieurs noeuds.
 *
 * Exemple :
 *
 * failedNodes = Set("proxmox-01")
 *
 * =>
 *
 * GET /simulation?failedNodes=proxmox-01
 */
export async function fetchHASimulation(failedNodes) {
  const params = new URLSearchParams();

  if (failedNodes.size > 0) {
    params.set(
      "failedNodes",
      [...failedNodes].join(",")
    );
  }

  const url = params.size > 0
    ? `/simulation?${params.toString()}`
    : "/simulation";

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `API /simulation ${res.status}: ${text}`
    );
  }

  return await res.json();
}