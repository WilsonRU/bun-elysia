import Elysia, { t } from "elysia";
import { JwtPlugin } from "@/adapters/http/security/jwt";

import { signin, signup } from "@/modules/core/core";

export const authRoutes = new Elysia({ prefix: "/core" })
	.use(JwtPlugin)
	.post(
		"/signin",
		async (ctx) => {
			const { body, jwt } = ctx;

			const user = await signin({
				email: body.email,
				password: body.password,
			});

			const token = await jwt.sign({
				sub: String(user.id),
				aud: "app-web",
			});

			ctx.set.status = 200;
			return {
				user,
				token,
			};
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 6 }),
			}),
			response: {
				200: t.Object({
					user: t.Object({
						id: t.Number(),
						name: t.String(),
						email: t.String({ format: "email" }),
						created_at: t.Date({ format: "date-time" }),
					}),
					token: t.String(),
				}),
				401: t.Object({
					message: t.String(),
				}),
			},
			detail: {
				tags: ["Core"],
				description: "User Login",
				summary: "Authenticate user",
			},
		},
	)
	.post(
		"/signup",
		async (ctx) => {
			const { body } = ctx;

			await signup({
				name: body.name,
				email: body.email,
				password: body.password,
			});

			ctx.set.status = 201;
			return { message: "User created successfully" };
		},
		{
			body: t.Object({
				name: t.String({ minLength: 3, maxLength: 50 }),
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 6 }),
			}),
			response: {
				201: t.Object({
					message: t.String(),
				}),
				409: t.Object({
					message: t.String(),
				}),
			},
			detail: {
				tags: ["Core"],
				description: "User Registration",
				summary: "Register a new user",
			},
		},
	);
