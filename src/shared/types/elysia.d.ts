import "elysia";
import { JWTPayloadInput } from "@elysiajs/jwt";

declare module "elysia" {
	interface JwtClaims extends JWTPayloadInput {
		[key: string]: any;
	}

	interface Context {
		jwt: {
			sign: (payload: unknown, options?: { exp?: number }) => string;
			verify: (token: string) => unknown;
		};
		user?: JwtClaims | null;
	}
}
