type EnvSource = Record<string, string | undefined>;

function readEnv(env: EnvSource, name: string, isProduction: boolean, fallback?: string) {
	const value = env[name] || fallback;

	if (!value || (isProduction && fallback && !env[name])) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

function readOptionalEnv(env: EnvSource, name: string) {
	return env[name] || "";
}

function readBooleanEnv(env: EnvSource, name: string, fallback: boolean) {
	const value = env[name];
	if (!value) return fallback;

	if (value === "true") return true;
	if (value === "false") return false;

	throw new Error(`${name} must be either true or false`);
}

function readNumberEnv(env: EnvSource, name: string, fallback: number) {
	const value = env[name];
	if (!value) return fallback;

	const number = Number(value);
	if (!Number.isInteger(number) || number <= 0) {
		throw new Error(`${name} must be a positive integer`);
	}

	return number;
}

function readNonNegativeNumberEnv(env: EnvSource, name: string, fallback: number) {
	const value = env[name];
	if (!value) return fallback;

	const number = Number(value);
	if (!Number.isInteger(number) || number < 0) {
		throw new Error(`${name} must be a non-negative integer`);
	}

	return number;
}

function createConfig(env: EnvSource) {
	const nodeEnv = env.NODE_ENV || "development";

	if (!["development", "test", "production"].includes(nodeEnv)) {
		throw new Error("NODE_ENV must be one of: development, test, production");
	}

	const isProduction = nodeEnv === "production";
	const storageDriver = env.STORAGE_DRIVER || "local";

	if (!["local", "s3", "r2"].includes(storageDriver)) {
		throw new Error("STORAGE_DRIVER must be one of: local, s3, r2");
	}

	if (isProduction && storageDriver === "local") {
		throw new Error("STORAGE_DRIVER=local is not supported in production");
	}

	if (storageDriver === "s3" || storageDriver === "r2") {
		for (const name of [
			"STORAGE_BUCKET",
			"STORAGE_ENDPOINT",
			"STORAGE_REGION",
			"STORAGE_ACCESS_KEY_ID",
			"STORAGE_SECRET_ACCESS_KEY",
		]) {
			readEnv(env, name, isProduction);
		}
	}

	const secret = readEnv(env, "SECRET", isProduction, "development-secret");

	if (isProduction && secret.length < 32) {
		throw new Error("SECRET must be at least 32 characters in production");
	}

	return {
		nodeEnv,
		databaseUrl: readEnv(env, "DATABASE_URL", isProduction, "postgres://user:password@localhost:5432/mydb"),
		dbPoolMax: readNumberEnv(env, "DB_POOL_MAX", 10),
		redisUrl: readEnv(env, "REDIS_URL", isProduction, "redis://localhost:6379"),
		secret,
		corsOrigin: readEnv(env, "CORS_ORIGIN", isProduction, "http://localhost:5173"),
		enableDocs: readBooleanEnv(env, "ENABLE_DOCS", !isProduction),
		dbLogQueries: nodeEnv === "development" && readBooleanEnv(env, "DB_LOG_QUERIES", true),
		jwtAudience: readEnv(env, "JWT_AUDIENCE", isProduction, "app-web"),
		jwtIssuer: readEnv(env, "JWT_ISSUER", isProduction, "hitransfer-api"),
		authUserCacheTtlMs: readNonNegativeNumberEnv(env, "AUTH_USER_CACHE_TTL_MS", isProduction ? 30_000 : 0),
		authUserCacheMax: readNumberEnv(env, "AUTH_USER_CACHE_MAX", 1_000),
		storage: {
			driver: storageDriver as "local" | "s3" | "r2",
			bucket: readOptionalEnv(env, "STORAGE_BUCKET"),
			endpoint: readOptionalEnv(env, "STORAGE_ENDPOINT"),
			region: readOptionalEnv(env, "STORAGE_REGION"),
			accessKeyId: readOptionalEnv(env, "STORAGE_ACCESS_KEY_ID"),
			secretAccessKey: readOptionalEnv(env, "STORAGE_SECRET_ACCESS_KEY"),
			publicBaseUrl: readOptionalEnv(env, "STORAGE_PUBLIC_BASE_URL"),
		},
		isProduction,
	};
}

const config = createConfig(Bun.env);

export { config, createConfig };
