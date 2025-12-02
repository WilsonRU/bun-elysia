import Elysia from "elysia";
import { db } from "@/adapters/db/kysely";
import { JwtPlugin } from "@/adapters/http/security/jwt";
import { authGuard } from "@/adapters/http/middlewares/auth";
import { AppError } from "@/shared/erros/appError";

export const RBAC = new Elysia()
	.use(JwtPlugin)
	.use(authGuard)
	.macro({
		RBAC: (roles: string[]) => ({
			protectedRoute: true,
			async resolve(context: any) {
				const user = await db
					.selectFrom("users")
					.where("id", "=", (context as any).user)
					.selectAll()
					.executeTakeFirstOrThrow();

				if (!roles.includes(user.role)) {
					throw new AppError("You do not have permission to access this resource.", 403);
				}
			},
		}),
	});
