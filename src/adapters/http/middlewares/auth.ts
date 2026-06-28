import Elysia from "elysia";
import { db as database } from "@/adapters/db/kysely";
import { JwtPlugin } from "@/adapters/http/security/jwt";
import { config as appConfig } from "@/config/env";
import type { AuthUser } from "@/modules/user/types";

type AuthGuardContext = {
	db: typeof database;
	config: typeof appConfig;
};

function parseBearerToken(authHeader: string | null) {
	if (!authHeader) return null;

	const match = authHeader.match(/^Bearer\s+(.+)$/i);
	return match?.[1]?.trim() || null;
}

function getCachedAuthUser(
	authUserCache: Map<number, { user: AuthUser; expiresAt: number }>,
	config: typeof appConfig,
	userId: number,
) {
	if (config.authUserCacheTtlMs === 0) return null;

	const cached = authUserCache.get(userId);
	if (!cached) return null;

	if (cached.expiresAt <= Date.now()) {
		authUserCache.delete(userId);
		return null;
	}

	return cached.user;
}

function setCachedAuthUser(
	authUserCache: Map<number, { user: AuthUser; expiresAt: number }>,
	config: typeof appConfig,
	user: AuthUser,
) {
	if (config.authUserCacheTtlMs === 0) return;

	if (authUserCache.size >= config.authUserCacheMax) {
		const now = Date.now();

		for (const [userId, cached] of authUserCache) {
			if (cached.expiresAt <= now) {
				authUserCache.delete(userId);
			}
		}

		if (authUserCache.size >= config.authUserCacheMax) {
			const oldestUserId = authUserCache.keys().next().value;
			if (oldestUserId !== undefined) {
				authUserCache.delete(oldestUserId);
			}
		}
	}

	authUserCache.set(user.id, {
		user,
		expiresAt: Date.now() + config.authUserCacheTtlMs,
	});
}

function createAuthGuard(context: AuthGuardContext = { db: database, config: appConfig }) {
	const authUserCache = new Map<number, { user: AuthUser; expiresAt: number }>();
	const { config, db } = context;

	return new Elysia().use(JwtPlugin).macro({
		protectedRoute: {
			value: true,
			async resolve({ status, request: { headers }, jwt }) {
				const authHeader = headers.get("Authorization");
				if (!authHeader) return status(401, "Missing Authorization header");

				const token = parseBearerToken(authHeader);
				if (!token) return status(401, "Invalid Authorization format");

				const payload = await jwt.verify(token);
				if (!payload) return status(401, "Invalid token");
				if (payload.aud !== config.jwtAudience) return status(401, "Invalid token audience");
				if (payload.iss !== config.jwtIssuer) return status(401, "Invalid token issuer");

				const userId = Number(payload.sub);
				if (!Number.isInteger(userId)) return status(401, "Invalid token subject");

				const cachedAuthUser = getCachedAuthUser(authUserCache, config, userId);
				if (cachedAuthUser) return { authUser: cachedAuthUser };

				const authUser = await db
					.selectFrom("users")
					.select(["id", "role"])
					.where("id", "=", userId)
					.where("deleted_at", "is", null)
					.executeTakeFirst();

				if (!authUser) return status(401, "Invalid token user");

				setCachedAuthUser(authUserCache, config, authUser);

				return { authUser };
			},
		},
		RBAC(roles: Array<AuthUser["role"]>) {
			return {
				beforeHandle({
					authUser,
					status,
				}: {
					authUser?: AuthUser;
					status: (code: 401 | 403, response: string) => unknown;
				}) {
					if (!authUser) return status(401, "Authentication required");
					if (!roles.includes(authUser.role)) return status(403, "Insufficient permissions");
				},
			};
		},
	});
}

const authGuard = createAuthGuard();

export { authGuard, createAuthGuard, parseBearerToken };
