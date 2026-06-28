import { t } from "elysia";

enum UserRole {
	USER = "user",
	MEMBER = "member",
	ADMIN = "admin",
}

const TUserPublic = t.Object({
	id: t.Number(),
	name: t.String(),
	email: t.String({ format: "email" }),
	role: t.Union([t.Literal("user"), t.Literal("member"), t.Literal("admin")]),
	avatar_url: t.Nullable(t.String()),
	created_at: t.Date(),
	updated_at: t.Nullable(t.Date()),
});

const publicUserFields = ["id", "name", "email", "role", "avatar_url", "created_at", "updated_at"] as const;

type IUserPublic = {
	id: number;
	name: string;
	email: string;
	role: "user" | "member" | "admin";
	avatar_url: string | null;
	created_at: Date;
	updated_at: Date | null;
};

type AuthUser = Pick<IUserPublic, "id" | "role">;

type UpdateUserNameInput = {
	userId: number;
	name: string;
};

type UploadAvatarInput = {
	userId: number;
	avatar: File;
};

export {
	UserRole,
	TUserPublic,
	publicUserFields,
	type AuthUser,
	type IUserPublic,
	type UpdateUserNameInput,
	type UploadAvatarInput,
};
