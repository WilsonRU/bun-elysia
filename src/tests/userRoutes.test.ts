import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import Elysia from "elysia";
import { mkdir, unlink } from "node:fs/promises";
import { JwtPlugin } from "@/adapters/http/security/jwt";
import { config } from "@/config/env";

const authUser = {
	id: 1,
	role: "user" as const,
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
const updateUserNameMock = mock();
const uploadAvatarMock = mock();

mock.module("@/adapters/db/kysely", () => ({
	db: {
		selectFrom: selectFromMock,
	},
}));

mock.module("@/modules/user/core", () => ({
	updateUserName: updateUserNameMock,
	uploadAvatar: uploadAvatarMock,
}));

const { userRoutes } = await import("@/modules/user/routes");

const avatarPath = "uploads/avatars/test-avatar.png";
const user = {
	id: 1,
	name: "Ada Lovelace",
	email: "ada@example.com",
	role: "user" as const,
	avatar_url: "/user/avatars/test-avatar.png",
	created_at: new Date("2026-01-01T00:00:00.000Z"),
	updated_at: null,
};

async function createToken() {
	const tokenApp = new Elysia().use(JwtPlugin).get("/token", ({ jwt }) =>
		jwt.sign({
			sub: String(authUser.id),
			aud: config.jwtAudience,
			iss: config.jwtIssuer,
		}),
	);

	const response = await tokenApp.fetch(new Request("http://localhost/token"));
	return response.text();
}

describe("userRoutes", () => {
	beforeAll(async () => {
		await mkdir("uploads/avatars", { recursive: true });
		await Bun.write(avatarPath, new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
	});

	beforeEach(() => {
		executeTakeFirstMock.mockResolvedValue(authUser);
		selectFromMock.mockClear();
		updateUserNameMock.mockReset();
		uploadAvatarMock.mockReset();
	});

	afterAll(async () => {
		await unlink(avatarPath).catch(() => {});
	});

	it("requires authentication to access avatar files", async () => {
		const response = await userRoutes.fetch(new Request("http://localhost/user/avatars/avatar.png"));

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Missing Authorization header");
	});

	it("updates the authenticated user name", async () => {
		updateUserNameMock.mockResolvedValue(user);
		const token = await createToken();

		const response = await userRoutes.fetch(
			new Request("http://localhost/user/", {
				method: "PUT",
				headers: {
					authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					name: "Ada Lovelace",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(updateUserNameMock).toHaveBeenCalledWith({
			userId: 1,
			name: "Ada Lovelace",
		});
		expect(await response.json()).toMatchObject({
			message: "User updated successfully",
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		});
	});

	it("uploads an avatar for the authenticated user", async () => {
		uploadAvatarMock.mockResolvedValue("/user/avatars/avatar.png");
		const token = await createToken();
		const form = new FormData();
		form.append("avatar", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: "image/png" }), "avatar.png");

		const response = await userRoutes.fetch(
			new Request("http://localhost/user/avatar", {
				method: "POST",
				headers: {
					authorization: `Bearer ${token}`,
				},
				body: form,
			}),
		);

		expect(response.status).toBe(200);
		expect(uploadAvatarMock).toHaveBeenCalledWith({
			userId: 1,
			avatar: expect.any(File),
		});
		expect(await response.json()).toEqual({
			message: "Avatar uploaded successfully",
			avatar_url: "/user/avatars/avatar.png",
		});
	});

	it("serves authenticated avatar files", async () => {
		const token = await createToken();
		const response = await userRoutes.fetch(
			new Request("http://localhost/user/avatars/test-avatar.png", {
				headers: {
					authorization: `Bearer ${token}`,
				},
			}),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
	});
});
