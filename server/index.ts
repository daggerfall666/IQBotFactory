import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { requestLogger, errorLogger } from "./middleware/requestLogger";
import { logger } from "./utils/logger";
import { type Server } from "http";
import { AddressInfo } from "net";

const app = express();

// Wrap the entire initialization in a try-catch
(async () => {
  try {
    app.set('trust proxy', 1);

    // Add initial request logging
    logger.info("Server initialization started");

    // Basic middleware setup with error handling
    try {
      app.use(express.json({ limit: '15mb' }));
      app.use(express.urlencoded({ extended: false }));
      app.use(requestLogger);
    } catch (err) {
      logger.error("Middleware setup failed:", err);
      throw err;
    }

    // Original request timing middleware
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }

          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }

          log(logLine);
        }
      });

      next();
    });

    // Register routes with error handling
    let server: Server;
    try {
      logger.info("Registering routes...");
      server = await registerRoutes(app);
      logger.info("Routes registered successfully");
    } catch (err) {
      logger.error("Route registration failed:", err);
      throw err;
    }

    // Add error logging middleware
    app.use(errorLogger);

    // Generic error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Enhanced error logging
      logger.error("Application Error", {
        status,
        message,
        stack: err.stack,
        path: _req.path,
        method: _req.method,
        query: _req.query,
        body: _req.body,
        headers: _req.headers,
        ip: _req.ip
      });

      res.status(status).json({ message });
    });

    // Setup Vite with error handling
    try {
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }
    } catch (err) {
      logger.error("Vite setup failed:", err);
      throw err;
    }

    // Start the server on port 5000 (required)
    const PORT = 5000;
    server.listen({
      port: PORT,
      host: "0.0.0.0",
    }, () => {
      const address = server.address() as AddressInfo;
      logger.info(`Server started successfully on port ${address.port}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. This application must run on port ${PORT}. Please ensure no other process is using this port.`);
      } else {
        logger.error("Server startup error:", err);
      }
      process.exit(1);
    });

  } catch (err) {
    logger.error("Fatal server error during initialization:", err);
    process.exit(1);
  }
})();