import { Elysia } from "elysia";
import { logger } from "@bogeychan/elysia-logger";
import { errorHandler } from "@/adapters/http/middlewares/errorHandler";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";

import { authRoutes } from "@/modules/core/routes";
import { userRoutes } from "@/modules/user/routes";

export function createHttp() {
	const app = new Elysia()
		.get("/", () => "Go to /docs to OpenAPI Documentation")
		.use(logger())
		.onError(errorHandler)
		.use(
			cors({
				origin: "*",
				methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				credentials: true,
				allowedHeaders: ["Content-Type", "Authorization"],
			}),
		)
		.use(
			openapi({
				path: "/docs",
				references: [],
				documentation: {
					info: {
						title: "OpenAPI - Documentation",
						description: "This is the OpenAPI Documentation for our API",
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
						{ name: "Core", description: "Authentication Routes" },
						{ name: "User", description: "User Routes" },
					],
				},
				scalar: {
					showToolbar: "never",
				},
				exclude: {
					paths: ["/health", "/"],
				},
			}),
		)
		.use(authRoutes)
		.use(userRoutes);

	return app;
}
