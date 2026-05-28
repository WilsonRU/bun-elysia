import Elysia, { Context } from "elysia";
import { db } from "@/adapters/db/kysely";
import { JwtPlugin } from "@/adapters/http/security/jwt";
import { authGuard } from "@/adapters/http/middlewares/auth";
import { AppError } from "@/shared/erros/appError";

type AuthContext = {
	user: number;
};

export const RBAC = new Elysia()
	.use(JwtPlugin)
	.use(authGuard)
	.macro({
		RBAC: (roles: string[]) => ({
			protectedRoute: true,
			async resolve({ user }: Context & AuthContext) {
				const userRecord = await db
					.selectFrom("users")
					.where("id", "=", user)
					.selectAll()
					.executeTakeFirstOrThrow();

				if (!roles.includes(userRecord.role)) {
					throw new AppError("You do not have permission to access this resource.", 403);
				}
			},
		}),
	});
