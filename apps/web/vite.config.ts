import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      // Serve os docs do projeto em /project-docs/* para visualização no admin
      name: "serve-project-docs",
      configureServer(server) {
        const docsRoot = path.resolve(__dirname, "../../docs");
        server.middlewares.use("/project-docs", (req, res, next) => {
          const filePath = path.join(docsRoot, decodeURIComponent(req.url ?? ""));
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime: Record<string, string> = {
              ".html": "text/html",
              ".pdf": "application/pdf",
              ".md": "text/plain",
            };
            res.setHeader("Content-Type", mime[ext] ?? "application/octet-stream");
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
