import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { db as database } from "@/adapters/db/kysely";
import { createUserCore } from "@/modules/user/core";
import { AppError } from "@/shared/errors/appError";

const selectExecuteTakeFirstMock = mock();
const updateExecuteTakeFirstMock = mock();
const updateExecuteMock = mock();
const updateSetMock = mock();
const getAvatarMetadataMock = mock();
const uploadObjectMock = mock();

const selectQuery = {
	select() {
		return selectQuery;
	},
	where() {
		return selectQuery;
	},
	executeTakeFirst: selectExecuteTakeFirstMock,
};

const updateQuery = {
	set(input: unknown) {
		updateSetMock(input);
		return updateQuery;
	},
	where() {
		return updateQuery;
	},
	returning() {
		return updateQuery;
	},
	executeTakeFirst: updateExecuteTakeFirstMock,
	execute: updateExecuteMock,
};

const dbMock = {
	selectFrom() {
		return selectQuery;
	},
	updateTable() {
		return updateQuery;
	},
} as unknown as typeof database;

const { updateUserName, uploadAvatar } = createUserCore({
	db: dbMock,
	getAvatarMetadata: getAvatarMetadataMock,
	uploadObject: uploadObjectMock,
});

const user = {
	id: 1,
	name: "Ada Lovelace",
	email: "ada@example.com",
	role: "user" as const,
	avatar_url: null,
	created_at: new Date("2026-01-01T00:00:00.000Z"),
	updated_at: null,
};

describe("user core", () => {
	beforeEach(() => {
		selectExecuteTakeFirstMock.mockReset();
		updateExecuteTakeFirstMock.mockReset();
		updateExecuteMock.mockReset();
		updateSetMock.mockReset();
		getAvatarMetadataMock.mockReset();
		uploadObjectMock.mockReset();
	});

	it("updates a user name", async () => {
		updateExecuteTakeFirstMock.mockResolvedValue({ ...user, name: "Grace Hopper" });

		const result = await updateUserName({ userId: 1, name: "Grace Hopper" });

		expect(result).toMatchObject({
			id: 1,
			name: "Grace Hopper",
			email: "ada@example.com",
		});
		expect(updateSetMock).toHaveBeenCalledWith({
			name: "Grace Hopper",
			updated_at: expect.any(Date),
		});
	});

	it("rejects name updates when the user does not exist", async () => {
		updateExecuteTakeFirstMock.mockResolvedValue(undefined);

		try {
			await updateUserName({ userId: 404, name: "Grace Hopper" });
			throw new Error("Expected updateUserName to fail");
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).message).toBe("User not found");
			expect((error as AppError).statusCode).toBe(404);
		}
	});

	it("uploads an avatar and stores the generated avatar URL", async () => {
		const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "avatar.png");
		selectExecuteTakeFirstMock.mockResolvedValue({ id: 1 });
		getAvatarMetadataMock.mockResolvedValue({
			extension: "png",
			contentType: "image/png",
		});
		uploadObjectMock.mockResolvedValue("/user/avatars/1-avatar.png");
		updateExecuteMock.mockResolvedValue(undefined);

		const result = await uploadAvatar({ userId: 1, avatar: file });

		expect(result).toBe("/user/avatars/1-avatar.png");
		expect(getAvatarMetadataMock).toHaveBeenCalledWith(file);
		expect(uploadObjectMock).toHaveBeenCalledWith({
			key: expect.stringMatching(/^avatars\/1-.+\.png$/),
			file,
			contentType: "image/png",
		});
		expect(updateSetMock).toHaveBeenCalledWith({
			avatar_url: "/user/avatars/1-avatar.png",
			updated_at: expect.any(Date),
		});
	});

	it("rejects avatar uploads when the user does not exist", async () => {
		const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "avatar.png");
		selectExecuteTakeFirstMock.mockResolvedValue(undefined);

		try {
			await uploadAvatar({ userId: 404, avatar: file });
			throw new Error("Expected uploadAvatar to fail");
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).message).toBe("User not found");
			expect((error as AppError).statusCode).toBe(404);
		}

		expect(getAvatarMetadataMock).not.toHaveBeenCalled();
		expect(uploadObjectMock).not.toHaveBeenCalled();
	});
});
