import { db } from "@/adapters/db/kysely";
import { FileMigrationProvider, Migrator } from "kysely";
import * as path from "node:path";
import { promises as fs } from "node:fs";

async function migrate() {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(__dirname, "../migrations"),
		}),
	});
	const { error, results } = await migrator.migrateToLatest();
	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`Migrated: "${it.migrationName}"`);
		} else if (it.status === "Error") {
			console.error(`Migration failed: "${it.migrationName}"`);
		}
	});

	if (error) {
		console.error(error);
		process.exit(1);
	}
	await db.destroy();
}

if (require.main === module) {
	migrate().catch(console.error);
}

export { migrate };
