import { promises as fs } from "node:fs";
import * as path from "node:path";

const MIGRATIONS_DIR = "src/adapters/db/migrations";
const PAD_LENGTH = 3;

function sanitizeName(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9_-]/g, "");
}

async function ensureDir(dir: string) {
	await fs.mkdir(dir, { recursive: true });
}

async function nextMigrationNumber(files: string[]) {
	const numbers = files
		.map((f) => {
			const match = f.match(/^(\d+)_/);
			return match ? parseInt(match[1], 10) : null;
		})
		.filter((n): n is number => n !== null);

	if (numbers.length === 0) return 1;
	return Math.max(...numbers) + 1;
}

async function createMigration(name: string) {
	if (!name || typeof name !== "string") {
		throw new Error("Nome da migration é obrigatório");
	}

	const safeName = sanitizeName(name);
	if (!safeName) {
		throw new Error("Nome da migration inválido após sanitização");
	}

	const migrationsPath = path.join(process.cwd(), MIGRATIONS_DIR);
	await ensureDir(migrationsPath);

	const allFiles = await fs.readdir(migrationsPath);
	const tsFiles = allFiles.filter((f) => f.endsWith(".ts"));
	let number = await nextMigrationNumber(tsFiles);

	const pad = (n: number) => String(n).padStart(PAD_LENGTH, "0");

	let filename = `${pad(number)}_${safeName}.ts`;
	let filepath = path.join(migrationsPath, filename);
	let attempt = 0;
	while (attempt < 100) {
		try {
			const template = `
				import { Kysely, sql } from 'kysely'

				export async function up(db: Kysely<any>): Promise<void> {
					await db.schema
						.createTable('table_name')
						.addColumn("id", "serial", (col) => col.primaryKey())
						.execute()
				}

				export async function down(db: Kysely<any>): Promise<void> {
					await db.schema.dropTable('table_name').execute()
				}
			`;
			await fs.writeFile(filepath, template, { flag: "wx" });
			console.log(`Migration criada: ${path.relative(process.cwd(), filepath)}`);
			return filepath;
		} catch (err: any) {
			if (err && (err.code === "EEXIST" || err.code === "EISDIR")) {
				number += 1;
				filename = `${pad(number)}_${safeName}.ts`;
				filepath = path.join(migrationsPath, filename);
				attempt += 1;
				continue;
			}
			throw err;
		}
	}

	throw new Error("Falha ao criar migration: muitas tentativas (possível concorrência)");
}

async function main() {
	const migrationName = process.argv[2];
	if (!migrationName) {
		console.error("Uso: node create.js <migration-name>");
		process.exit(2);
	}

	try {
		await createMigration(migrationName);
		process.exit(0);
	} catch (err: any) {
		console.error("Erro ao criar migration:", err?.message ? err.message : err);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}
