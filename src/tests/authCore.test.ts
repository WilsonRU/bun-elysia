import { beforeEach, describe, expect, it, mock } from "bun:test";
import { AppError } from "@/shared/errors/appError";
import { createAuthCore } from "@/modules/auth/core";
import type { db as database } from "@/adapters/db/kysely";

const selectExecuteTakeFirstMock = mock();
const insertExecuteMock = mock();
const transactionExecuteMock = mock(async (callback: (trx: unknown) => unknown) => callback(transactionMock));

const selectQuery = {
	select() {
		return selectQuery;
	},
	where() {
		return selectQuery;
	},
	executeTakeFirst: selectExecuteTakeFirstMock,
};

const insertQuery = {
	values() {
		return insertQuery;
	},
	execute: insertExecuteMock,
};

const transactionMock = {
	insertInto() {
		return insertQuery;
	},
};

const dbMock = {
	selectFrom() {
		return selectQuery;
	},
	transaction() {
		return {
			execute: transactionExecuteMock,
		};
	},
} as unknown as typeof database;

const { signin, signup } = createAuthCore({ db: dbMock });

const user = {
	id: 1,
	name: "Ada Lovelace",
	email: "ada@example.com",
	role: "user" as const,
	avatar_url: null,
	created_at: new Date("2026-01-01T00:00:00.000Z"),
	updated_at: null,
};

describe("auth core", () => {
	beforeEach(() => {
		selectExecuteTakeFirstMock.mockReset();
		insertExecuteMock.mockReset();
		transactionExecuteMock.mockClear();
	});

	it("rejects signin when the user does not exist", async () => {
		selectExecuteTakeFirstMock.mockResolvedValue(undefined);

		try {
			await signin({ email: "ada@example.com", password: "secret123" });
			throw new Error("Expected signin to fail");
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).message).toBe("Invalid email or password");
			expect((error as AppError).statusCode).toBe(401);
		}
	});

	it("rejects signin when the password is invalid", async () => {
		selectExecuteTakeFirstMock.mockResolvedValue({
			...user,
			password: await Bun.password.hash("correct-password"),
		});

		try {
			await signin({ email: "ada@example.com", password: "wrong-password" });
			throw new Error("Expected signin to fail");
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).message).toBe("Invalid email or password");
			expect((error as AppError).statusCode).toBe(401);
		}
	});

	it("maps unique violations during signup to a conflict error", async () => {
		insertExecuteMock.mockRejectedValue({ code: "23505" });

		try {
			await signup({ name: "Ada Lovelace", email: "ada@example.com", password: "secret123" });
			throw new Error("Expected signup to fail");
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).message).toBe("Email already in use");
			expect((error as AppError).statusCode).toBe(409);
		}
	});

	it("propagates unknown signup errors", async () => {
		const error = new Error("database unavailable");
		insertExecuteMock.mockRejectedValue(error);

		await expect(signup({ name: "Ada Lovelace", email: "ada@example.com", password: "secret123" })).rejects.toBe(error);
	});
});
