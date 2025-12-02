import { config } from "@/config/env";
import jwt from "@elysiajs/jwt";
import Elysia from "elysia";

export const JwtPlugin = new Elysia({ name: "jwt" }).use(
	jwt({
		name: "jwt",
		exp: "1d",
		secret: config.secret,
	}),
);
