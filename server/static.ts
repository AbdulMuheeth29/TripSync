import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for non-file GET requests (no path pattern to avoid path-to-regexp "Missing parameter name" in Express 5).
  app.use((_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
