import { beforeEach, describe, expect, it, mock } from "bun:test";
import Elysia from "elysia";
import { errorHandler } from "@/adapters/http/middlewares/errorHandler";
import { AppError } from "@/shared/errors/appError";
import { createAuthRoutes } from "@/modules/auth/routes";

const signinMock = mock();
const signupMock = mock();
const authRoutes = createAuthRoutes({ signin: signinMock, signup: signupMock });
const app = new Elysia().onError(errorHandler).use(authRoutes);

const user = {
	id: 1,
	name: "Ada Lovelace",
	email: "ada@example.com",
	role: "user" as const,
	avatar_url: null,
	created_at: new Date("2026-01-01T00:00:00.000Z"),
	updated_at: null,
};

describe("authRoutes", () => {
	beforeEach(() => {
		signinMock.mockReset();
		signupMock.mockReset();
	});

	it("signs in a user and returns a token", async () => {
		signinMock.mockResolvedValue(user);

		const response = await app.fetch(
			new Request("http://localhost/auth/signin", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					email: "ada@example.com",
					password: "secret123",
				}),
			}),
		);

		const body = await response.json();

		expect(response.status).toBe(200);
		expect(signinMock).toHaveBeenCalledWith({
			email: "ada@example.com",
			password: "secret123",
		});
		expect(body.user).toMatchObject({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatar_url: user.avatar_url,
		});
		expect(typeof body.token).toBe("string");
		expect(body.token.length).toBeGreaterThan(0);
	});

	it("signs up a user", async () => {
		signupMock.mockResolvedValue(undefined);

		const response = await app.fetch(
			new Request("http://localhost/auth/signup", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					name: "Ada Lovelace",
					email: "ada@example.com",
					password: "secret123",
				}),
			}),
		);

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			message: "User created successfully",
		});
		expect(signupMock).toHaveBeenCalledWith({
			name: "Ada Lovelace",
			email: "ada@example.com",
			password: "secret123",
		});
	});

	it("returns 401 when signin fails", async () => {
		signinMock.mockRejectedValue(new AppError("Invalid email or password", 401));

		const response = await app.fetch(
			new Request("http://localhost/auth/signin", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					email: "ada@example.com",
					password: "wrong-password",
				}),
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			message: "Invalid email or password",
		});
	});

	it("returns 409 when signup uses an existing email", async () => {
		signupMock.mockRejectedValue(new AppError("Email already in use", 409));

		const response = await app.fetch(
			new Request("http://localhost/auth/signup", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					name: "Ada Lovelace",
					email: "ada@example.com",
					password: "secret123",
				}),
			}),
		);

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			message: "Email already in use",
		});
	});

	it("rejects invalid signup payloads before calling the core", async () => {
		const response = await app.fetch(
			new Request("http://localhost/auth/signup", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					name: "Ada Lovelace",
					email: "not-an-email",
					password: "123",
				}),
			}),
		);

		expect(response.status).toBe(400);
		expect(signupMock).not.toHaveBeenCalled();
		expect(await response.json()).toMatchObject({
			message: "Validation error",
		});
	});
});
