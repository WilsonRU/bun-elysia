import type { Generated } from "kysely";

export interface userModel {
	id: Generated<number>;
	name: string;
	email: string;
	password: string;
	role: "user" | "member" | "admin";
	avatar_url: string | null;
	created_at: Date;
	updated_at: Date | null;
	deleted_at: Date | null;
}
