import { Elysia } from "elysia";
import { logger } from "@bogeychan/elysia-logger";
import { errorHandler } from "@/adapters/http/middlewares/errorHandler";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";

import { config } from "@/config/env";
import { healthRoutes } from "@/adapters/http/routes/health";
import { authRoutes } from "@/modules/auth/routes";
import { userRoutes } from "@/modules/user/routes";

export function createHttp() {
	const app = new Elysia()
		.get("/", ({ set }) => {
			set.status = 204;
		})
		.use(healthRoutes)
		.use(logger())
		.onError(errorHandler)
		.use(
			cors({
				origin: config.corsOrigin,
				methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				credentials: true,
				allowedHeaders: ["Content-Type", "Authorization"],
			}),
		);

	if (config.enableDocs) {
		app.use(
			openapi({
				path: "/docs",
				references: [],
				documentation: {
					info: {
						title: "OpenAPI - Documentation",
						description: "OpenAPI Documentation for our RestAPI",
						version: "1.0.0",
					},
					components: {
						securitySchemes: {
							bearer: {
								type: "http",
								scheme: "bearer",
								bearerFormat: "JWT",
							},
						},
					},
					tags: [
						{ name: "Auth", description: "Authentication Routes" },
						{ name: "User", description: "User Routes" },
					],
				},
				scalar: {
					showToolbar: "never",
				},
				exclude: {
					paths: ["/health", "/ready", "/"],
				},
			}),
		);
	}

	app.use(authRoutes).use(userRoutes);

	return app;
}
