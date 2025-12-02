import { config } from "@/config/env";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { userModel } from "@/modules/user/model";

interface Tables {
	users: userModel;
}

const dialect = new PostgresDialect({
	pool: new Pool({
		connectionString: config.databaseUrl,
		max: 10,
	}),
});

export const db = new Kysely<Tables>({
	dialect,
	log: ["query", "error"],
});
