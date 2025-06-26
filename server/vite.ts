import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs/promises";
import path from "path";
import { createServer as createViteServer, type ViteDevServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Enhanced logging with log levels and colors
export function log(message: string, source = "express", level: 'info' | 'warn' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m'
  };

  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const logMessage = `${formattedTime} [${source}] ${message}`;
  console.log(`${colors[level]}${logMessage}${colors.reset}`);
}

// Cache for production mode
let cachedVite: ViteDevServer | null = null;

export async function setupVite(app: Express, server: Server): Promise<ViteDevServer> {
  if (process.env.NODE_ENV === 'production' && cachedVite) {
    return cachedVite;
  }

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
    watch: {
      usePolling: true,
      interval: 100
    }
  };

  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        info: (msg, options) => viteLogger.info(msg, options),
        warn: (msg, options) => viteLogger.warn(msg, options),
        error: (msg, options) => {
          viteLogger.error(msg, options);
          if (process.env.NODE_ENV !== 'development') {
            process.exit(1);
          }
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);

    // Error handling middleware
    app.use((err: Error, _req: Request, _res: Response, next: NextFunction) => {
      log(`Vite error: ${err.message}`, 'vite', 'error');
      next(err);
    });

    // HTML serving middleware with cache busting
    app.use("*", async (req, res, next) => {
      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html"
        );

        let template = await fs.readFile(clientTemplate, "utf-8");

        // Add cache busting and versioning
        const version = process.env.NODE_ENV === 'production' 
          ? process.env.APP_VERSION || '1.0.0'
          : nanoid();

        template = template
          .replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${version}"`)
          .replace(/<title>(.*?)<\/title>/, `<title>$1 | v${version}</title>`);

        const page = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    if (process.env.NODE_ENV === 'production') {
      cachedVite = vite;
    }

    return vite;
  } catch (err) {
    log(`Failed to create Vite server: ${err.message}`, 'vite', 'error');
    throw err;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist");

  // More descriptive error message
  if (!fs.existsSync(distPath)) {
    const errorMessage = `Build directory not found at ${distPath}. Please run 'npm run build' first.`;
    log(errorMessage, 'static', 'error');
    throw new Error(errorMessage);
  }

  // Serve static files with cache control
  app.use(express.static(distPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  }));

  // SPA fallback with proper error handling
  app.use("*", (req, res, next) => {
    const indexPath = path.join(distPath, "index.html");

    fs.access(indexPath)
      .then(() => res.sendFile(indexPath))
      .catch(err => {
        log(`SPA fallback failed: ${err.message}`, 'static', 'error');
        next(err);
      });
  });
}
