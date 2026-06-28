import { db } from "@/adapters/db/kysely";
import Elysia from "elysia";
import { sql } from "kysely";

export const healthRoutes = new Elysia()
	.get("/health", () => ({
		status: "ok",
	}))
	.get("/ready", async ({ set }) => {
		try {
			await sql`select 1`.execute(db);

			return {
				status: "ready",
				dependencies: {
					database: "ok",
				},
			};
		} catch {
			set.status = 503;

			return {
				status: "unready",
				dependencies: {
					database: "error",
				},
			};
		}
	});
