import { config } from "@/config/env";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Tables } from "@/adapters/db/tables";

const dialect = new PostgresDialect({
	pool: new Pool({
		connectionString: config.databaseUrl,
		max: config.dbPoolMax,
	}),
});

export const db = new Kysely<Tables>({
	dialect,
	log: config.dbLogQueries ? ["query", "error"] : ["error"],
});
