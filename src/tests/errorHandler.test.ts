import { describe, expect, it } from "bun:test";
import { errorHandler } from "@/adapters/http/middlewares/errorHandler";
import { AppError } from "@/shared/errors/appError";

describe("errorHandler", () => {
	it("returns application errors with status and optional details", () => {
		const set: { status?: number | string } = {};

		const response = errorHandler({
			error: new AppError("Invalid input", 422, { field: "email" }),
			set,
		});

		expect(set.status).toBe(422);
		expect(response).toEqual({
			message: "Invalid input",
			details: { field: "email" },
		});
	});

	it("normalizes validation errors", () => {
		const set: { status?: number | string } = {};

		const response = errorHandler({
			code: "VALIDATION",
			error: new Error(JSON.stringify([{ path: "/name", message: "Expected string" }])),
			set,
		});

		expect(set.status).toBe(400);
		expect(response).toEqual({
			message: "Validation error",
			details: [{ path: "/name", message: "Expected string" }],
		});
	});
});
