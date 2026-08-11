import dotenv from "dotenv";

dotenv.config();

console.log("=== ENV DEBUG ===");
console.log("PVE_HOST =", process.env.PVE_HOST);
console.log("PVE_TOKEN_ID =", process.env.PVE_TOKEN_ID);
console.log("PVE_TOKEN_SECRET =", process.env.PVE_TOKEN_SECRET);
console.log("PVE_VERIFY_SSL =", process.env.PVE_VERIFY_SSL);
console.log("PORT =", process.env.PORT);

/**
 * Centralise et valide toutes les variables d'environnement au démarrage.
 * L'application crashe explicitement si une variable obligatoire est absente.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${key}`);
  }
  return value;
}

export const config = {
  proxmox: {
    host: requireEnv("PVE_HOST"),
    tokenId: requireEnv("PVE_TOKEN_ID"),
    tokenSecret: requireEnv("PVE_TOKEN_SECRET"),
    /** Désactiver la vérification TLS pour les certs auto-signés Proxmox */
    verifySSL: process.env.PVE_VERIFY_SSL !== "false",
  },
  server: {
    port: parseInt(process.env.PORT ?? "3000", 10),
    host: process.env.HOST ?? "0.0.0.0",
  },
} as const;
