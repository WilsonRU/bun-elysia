import { describe, expect, it } from "bun:test";
import { parseBearerToken } from "@/adapters/http/middlewares/auth";

describe("parseBearerToken", () => {
	it("extracts a bearer token", () => {
		expect(parseBearerToken("Bearer token-123")).toBe("token-123");
	});

	it("accepts case-insensitive bearer scheme and trims token", () => {
		expect(parseBearerToken("bearer   token-123   ")).toBe("token-123");
	});

	it("rejects missing or malformed authorization headers", () => {
		expect(parseBearerToken(null)).toBeNull();
		expect(parseBearerToken("token-123")).toBeNull();
		expect(parseBearerToken("Basic token-123")).toBeNull();
		expect(parseBearerToken("Bearer")).toBeNull();
	});
});
