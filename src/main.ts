import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";

import { config } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";


async function bootstrap(): Promise<void> {

  const isDevelopment = process.env.NODE_ENV !== "production";
  
  const app = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true
        }
      }
    }
  });


  /**
   * Publication du dashboard statique.
   */
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "dashboard"),
    prefix: "/"
  });


  /**
   * Enregistrement des routes HTTP.
   *
   * Les dépendances métier sont construites dans
   * compositionRoot.ts et utilisées par les routes.
   */
  await registerRoutes(app);


  /**
   * Démarrage du serveur.
   */
  await app.listen({
    port: config.server.port,
    host: config.server.host
  });


  app.log.info(
    `ClusterLens démarré sur ${config.server.host}:${config.server.port}`
  );
}


bootstrap();