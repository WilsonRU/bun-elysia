import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("users")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("email", "text", (col) => col.notNull().unique())
		.addColumn("password", "text", (col) => col.notNull())
		.addColumn("role", "varchar(50)", (col) => col.notNull().defaultTo("free"))
		.addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn("updated_at", "timestamptz")
		.addColumn("deleted_at", "timestamptz")
		.execute();

	await db.schema.createIndex("users_email_unique_idx").on("users").column("email").unique().execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropIndex("users_email_unique_idx").ifExists().execute();
	await db.schema.dropTable("users").execute();
}
