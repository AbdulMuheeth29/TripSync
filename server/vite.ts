import type { Express, Request, Response } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".localhost",
      "localhost:3000",
      "127.0.0.1:3000",
      "[::1]",
      "[::1]:3000",
    ],
    host: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: { ...viteConfig.server, ...serverOptions },
    appType: "custom",
  });

  const clientTemplatePath = path.resolve(
    import.meta.dirname,
    "..",
    "client",
    "index.html",
  );

  async function serveHtml(req: Request, res: Response) {
    const url = req.originalUrl;
    try {
      let template = await fs.promises.readFile(clientTemplatePath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res
        .status(200)
        .set({
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      throw e;
    }
  }

  // Serve HTML for page requests BEFORE Vite middlewares (avoids 403 in some environments).
  app.use((req, res, next) => {
    if (
      req.method !== "GET" ||
      /^\/(api|src|vite|@|assets|favicon)/.test(req.path)
    ) {
      return next();
    }
    serveHtml(req, res).catch(next);
  });

  app.use(vite.middlewares);

  app.use((req, res, next) => {
    if (
      req.method !== "GET" ||
      /^\/(api|src|vite|@|assets|favicon)/.test(req.path)
    ) {
      return next();
    }
    serveHtml(req, res).catch((e) => {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    });
  });
}
