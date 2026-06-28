import "elysia";
import type { JWTPayloadInput } from "@elysiajs/jwt";
import type { AuthUser } from "@/modules/user/types";

declare module "elysia" {
	interface JwtClaims extends JWTPayloadInput {
		[key: string]: unknown;
	}

	interface Context {
		jwt: {
			sign: (payload: unknown, options?: { exp?: number }) => string;
			verify: (token: string) => unknown;
		};
		authUser?: AuthUser;
	}
}
