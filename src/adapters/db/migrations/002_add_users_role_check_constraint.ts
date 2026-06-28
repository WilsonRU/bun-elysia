import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await sql`
		alter table users
		add constraint users_role_check
		check (role in ('user', 'member', 'admin'))
	`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
	await sql`
		alter table users
		drop constraint if exists users_role_check
	`.execute(db);
}
