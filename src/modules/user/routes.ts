import Elysia, { t } from "elysia";
import { authGuard } from "@/adapters/http/middlewares/auth";

import { updateUserName, uploadAvatar } from "@/modules/user/core";
import { TUserPublic } from "@/modules/user/types";

type UserRoutesContext = {
	authGuard: typeof authGuard;
	updateUserName: typeof updateUserName;
	uploadAvatar: typeof uploadAvatar;
};

function createUserRoutes(context: UserRoutesContext = { authGuard, updateUserName, uploadAvatar }) {
	return new Elysia({ prefix: "/user" })
		.use(context.authGuard)
		.get(
			"/avatars/:filename",
			async (ctx) => {
				const { params, status } = ctx;

				if (!/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/.test(params.filename)) {
					return status(404, "File not found");
				}

				const file = Bun.file(`uploads/avatars/${params.filename}`);
				if (!(await file.exists())) {
					return status(404, "File not found");
				}

				return new Response(file, {
					headers: {
						"cache-control": "public, max-age=31536000, immutable",
					},
				});
			},
			{
				protectedRoute: true,
				RBAC: ["user", "member", "admin"],
				detail: {
					summary: "Get User Avatar",
					tags: ["User"],
					security: [{ bearer: [] }],
					description: "Get a user avatar file",
				},
			},
		)
		.put(
			"/",
			async (ctx) => {
				const { authUser, body } = ctx;

				const data = await context.updateUserName({
					userId: authUser.id,
					name: body.name,
				});

				return { message: "User updated successfully", user: data };
			},
			{
				protectedRoute: true,
				RBAC: ["user", "member", "admin"],
				body: t.Object({
					name: t.String({
						minLength: 3,
						maxLength: 50,
					}),
				}),
				response: {
					200: t.Object({
						message: t.String(),
						user: TUserPublic,
					}),
				},
				detail: {
					summary: "Update User Information",
					tags: ["User"],
					security: [{ bearer: [] }],
					description: "Update user information",
				},
			},
		)
		.post(
			"/avatar",
			async (ctx) => {
				const { authUser, body } = ctx;

				const avatar = await context.uploadAvatar({
					userId: authUser.id,
					avatar: body.avatar,
				});

				return { message: "Avatar uploaded successfully", avatar_url: avatar };
			},
			{
				protectedRoute: true,
				RBAC: ["user", "member", "admin"],
				body: t.Object({
					avatar: t.File({ maxSize: 5 * 1024 * 1024 }),
				}),
				response: {
					200: t.Object({
						message: t.String(),
						avatar_url: t.String(),
					}),
					400: t.Object({
						message: t.String(),
					}),
					404: t.Object({
						message: t.String(),
					}),
				},
				detail: {
					summary: "Upload User Avatar",
					tags: ["User"],
					security: [{ bearer: [] }],
					description: "Upload or update user avatar",
				},
			},
		);
}

const userRoutes = createUserRoutes();

export { createUserRoutes, userRoutes };
