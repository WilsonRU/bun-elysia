export enum UserRole {
	FREE = "free",
	PAID = "paid",
	ADMIN = "admin",
}

export type UserPublic = {
	id: number;
	name: string;
	email: string;
	role: "free" | "paid" | "admin";
	created_at: Date;
	updated_at?: Date;
};

export type UpdateUserNameInput = {
	userId: number;
	name: string;
};
