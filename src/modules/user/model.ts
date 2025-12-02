import type { Generated } from "kysely";

export interface userModel {
	id: Generated<number>;
	name: string;
	email: string;
	password: string;
	role: "free" | "paid" | "admin";
	created_at: Date;
	updated_at: Date | null;
	deleted_at: Date | null;
}
