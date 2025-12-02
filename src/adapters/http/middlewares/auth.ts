import Elysia from "elysia";
import { JwtPlugin } from "@/adapters/http/security/jwt";

export const authGuard = new Elysia().use(JwtPlugin).macro({
	protectedRoute: {
		value: true,
		async resolve({ status, request: { headers }, jwt }) {
			const authHeader = headers.get("Authorization");
			if (!authHeader) return status(401, "Missing Authorization header");

			const token = authHeader.replace(/^Bearer\s+/i, "");
			if (!token) return status(401, "Invalid Authorization format");

			const payload = await jwt.verify(token);
			if (!payload) return status(401, "Invalid token");

			return { user: Number(payload.sub) };
		},
	},
});
