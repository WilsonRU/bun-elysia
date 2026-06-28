import { describe, expect, it } from "bun:test";
import { createConfig } from "@/config/env";

const baseEnv = {
	NODE_ENV: "development",
	SECRET: "development-secret",
};

describe("createConfig", () => {
	it("uses a development secret fallback outside production", () => {
		const config = createConfig({
			NODE_ENV: "test",
		});

		expect(config.secret).toBe("development-secret");
	});

	it("requires SECRET in production", () => {
		expect(() =>
			createConfig({
				NODE_ENV: "production",
				DATABASE_URL: "postgres://user:password@localhost:5432/app",
				CORS_ORIGIN: "https://example.com",
				JWT_AUDIENCE: "app-web",
				JWT_ISSUER: "api",
				STORAGE_DRIVER: "s3",
				STORAGE_BUCKET: "bucket",
				STORAGE_ENDPOINT: "https://s3.us-east-1.amazonaws.com",
				STORAGE_REGION: "us-east-1",
				STORAGE_ACCESS_KEY_ID: "access-key",
				STORAGE_SECRET_ACCESS_KEY: "secret-key",
			}),
		).toThrow("Missing required environment variable: SECRET");
	});

	it("rejects local storage in production", () => {
		expect(() =>
			createConfig({
				...baseEnv,
				NODE_ENV: "production",
				SECRET: "production-secret-with-at-least-32-chars",
				DATABASE_URL: "postgres://user:password@localhost:5432/app",
				CORS_ORIGIN: "https://example.com",
				JWT_AUDIENCE: "app-web",
				JWT_ISSUER: "api",
				STORAGE_DRIVER: "local",
			}),
		).toThrow("STORAGE_DRIVER=local is not supported in production");
	});

	it("accepts s3 storage when required variables are present", () => {
		const config = createConfig({
			...baseEnv,
			STORAGE_DRIVER: "s3",
			STORAGE_BUCKET: "bucket",
			STORAGE_ENDPOINT: "https://s3.us-east-1.amazonaws.com",
			STORAGE_REGION: "us-east-1",
			STORAGE_ACCESS_KEY_ID: "access-key",
			STORAGE_SECRET_ACCESS_KEY: "secret-key",
		});

		expect(config.storage.driver).toBe("s3");
		expect(config.storage.bucket).toBe("bucket");
	});

	it("accepts r2 storage when required variables are present", () => {
		const config = createConfig({
			...baseEnv,
			STORAGE_DRIVER: "r2",
			STORAGE_BUCKET: "bucket",
			STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
			STORAGE_REGION: "auto",
			STORAGE_ACCESS_KEY_ID: "access-key",
			STORAGE_SECRET_ACCESS_KEY: "secret-key",
		});

		expect(config.storage.driver).toBe("r2");
		expect(config.storage.region).toBe("auto");
	});

	it("requires storage credentials for s3-compatible drivers", () => {
		expect(() =>
			createConfig({
				...baseEnv,
				STORAGE_DRIVER: "r2",
			}),
		).toThrow("Missing required environment variable: STORAGE_BUCKET");
	});

	it("validates DB_POOL_MAX", () => {
		expect(() =>
			createConfig({
				...baseEnv,
				DB_POOL_MAX: "0",
			}),
		).toThrow("DB_POOL_MAX must be a positive integer");
	});

	it("validates AUTH_USER_CACHE_MAX", () => {
		expect(() =>
			createConfig({
				...baseEnv,
				AUTH_USER_CACHE_MAX: "-1",
			}),
		).toThrow("AUTH_USER_CACHE_MAX must be a positive integer");
	});
});
