import Elysia, { t } from "elysia";
import { JwtPlugin } from "@/adapters/http/security/jwt";
import { config } from "@/config/env";
import { createRateLimit } from "@/adapters/http/middlewares/rateLimit";

import { signin, signup } from "@/modules/auth/core";
import { TUserPublic } from "@/modules/user/types";

const authRateLimit = createRateLimit({
	windowMs: 60 * 1000,
	max: 10,
});

type AuthRoutesContext = {
	signin: typeof signin;
	signup: typeof signup;
};

function createAuthRoutes(context: AuthRoutesContext = { signin, signup }) {
	return new Elysia({ prefix: "/auth" })
		.use(JwtPlugin)
		.post(
			"/signin",
			async (ctx) => {
				const { body, jwt } = ctx;

				const user = await context.signin({
					email: body.email,
					password: body.password,
				});

				const token = await jwt.sign({
					sub: String(user.id),
					aud: config.jwtAudience,
					iss: config.jwtIssuer,
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
						user: TUserPublic,
						token: t.String(),
					}),
					401: t.Object({
						message: t.String(),
					}),
					429: t.Object({
						message: t.String(),
					}),
				},
				beforeHandle: authRateLimit,
				detail: {
					tags: ["Auth"],
					description: "User Login",
					summary: "Authenticate user",
				},
			},
		)
		.post(
			"/signup",
			async (ctx) => {
				const { body } = ctx;

				await context.signup({
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
					429: t.Object({
						message: t.String(),
					}),
				},
				beforeHandle: authRateLimit,
				detail: {
					tags: ["Auth"],
					description: "User Registration",
					summary: "Register a new user",
				},
			},
		);
}

const authRoutes = createAuthRoutes();

export { authRoutes, createAuthRoutes };
