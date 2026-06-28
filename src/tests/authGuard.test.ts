import { beforeEach, describe, expect, it, mock } from "bun:test";
import Elysia from "elysia";
import { JwtPlugin } from "@/adapters/http/security/jwt";
import { config } from "@/config/env";
import { createAuthGuard } from "@/adapters/http/middlewares/auth";
import type { db as database } from "@/adapters/db/kysely";

const authUser = {
	id: 1,
	role: "user" as const,
};

const configMock = {
	...config,
	authUserCacheTtlMs: 1_000,
	authUserCacheMax: 1_000,
};

const executeTakeFirstMock = mock(async () => authUser);
const selectQuery = {
	select() {
		return selectQuery;
	},
	where() {
		return selectQuery;
	},
	executeTakeFirst: executeTakeFirstMock,
};

const selectFromMock = mock(() => selectQuery);
const dbMock = {
	selectFrom: selectFromMock,
} as unknown as typeof database;

function createProtectedApp() {
	return new Elysia()
		.use(createAuthGuard({ db: dbMock, config: configMock }))
		.get("/protected", ({ authUser }) => authUser, {
			protectedRoute: true,
		});
}

async function createToken(payload: { sub?: string; aud?: string; iss?: string } = {}) {
	const tokenApp = new Elysia().use(JwtPlugin).get("/token", ({ jwt }) =>
		jwt.sign({
			sub: payload.sub ?? String(authUser.id),
			aud: payload.aud ?? config.jwtAudience,
			iss: payload.iss ?? config.jwtIssuer,
		}),
	);

	const response = await tokenApp.fetch(new Request("http://localhost/token"));
	return response.text();
}

describe("authGuard", () => {
	beforeEach(() => {
		executeTakeFirstMock.mockResolvedValue(authUser);
		executeTakeFirstMock.mockClear();
		selectFromMock.mockClear();
	});

	it("rejects invalid tokens", async () => {
		const response = await createProtectedApp().fetch(
			new Request("http://localhost/protected", {
				headers: {
					authorization: "Bearer invalid-token",
				},
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid token");
	});

	it("rejects tokens with an invalid audience", async () => {
		const token = await createToken({ aud: "other-app" });

		const response = await createProtectedApp().fetch(
			new Request("http://localhost/protected", {
				headers: {
					authorization: `Bearer ${token}`,
				},
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid token audience");
	});

	it("rejects tokens with an invalid issuer", async () => {
		const token = await createToken({ iss: "other-api" });

		const response = await createProtectedApp().fetch(
			new Request("http://localhost/protected", {
				headers: {
					authorization: `Bearer ${token}`,
				},
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid token issuer");
	});

	it("uses cached authenticated users on repeated requests", async () => {
		const app = createProtectedApp();
		const token = await createToken({ sub: String(authUser.id) });

		for (let i = 0; i < 2; i++) {
			const response = await app.fetch(
				new Request("http://localhost/protected", {
					headers: {
						authorization: `Bearer ${token}`,
					},
				}),
			);

			expect(response.status).toBe(200);
		}

		expect(selectFromMock).toHaveBeenCalledTimes(1);
	});
});
