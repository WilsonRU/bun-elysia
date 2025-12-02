import { Elysia, t } from "elysia";
import { authGuard } from "@/adapters/http/middlewares/auth";
import { RBAC } from "@/adapters/http/middlewares/rbac";
import { updateUserName } from "./core";

export const userRoutes = new Elysia({ prefix: "/user" })
	.use(authGuard)
	.use(RBAC)
	.put(
		"/",
		async (ctx) => {
			const { user, body } = ctx;

			const data = await updateUserName({
				userId: user,
				name: body.name,
			});

			return { message: "User updated successfully", user: data };
		},
		{
			protectedRoute: true,
			RBAC: ["free", "paid", "admin"],
			body: t.Object({
				name: t.String({
					minLength: 3,
					maxLength: 50,
				}),
			}),
			response: {
				200: t.Object({
					message: t.String(),
					user: t.Object({
						id: t.Number(),
						name: t.String(),
						email: t.String({ format: "email" }),
						role: t.Union([t.Literal("free"), t.Literal("paid"), t.Literal("admin")]),
						created_at: t.Date(),
						updated_at: t.Optional(t.Date()),
					}),
				}),
			},
			detail: {
				summary: "Update User Information",
				tags: ["User"],
				security: [{ bearer: [] }],
				description: "Update user information",
			},
		},
	);
