const nodeEnv = Bun.env.NODE_ENV || "development";

if (!["development", "test", "production"].includes(nodeEnv)) {
	throw new Error("NODE_ENV must be one of: development, test, production");
}

const isProduction = nodeEnv === "production";

function readEnv(name: string, fallback?: string) {
	const value = Bun.env[name] || fallback;

	if (!value || (isProduction && fallback && !Bun.env[name])) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

function readOptionalEnv(name: string) {
	return Bun.env[name] || "";
}

function readBooleanEnv(name: string, fallback: boolean) {
	const value = Bun.env[name];
	if (!value) return fallback;

	if (value === "true") return true;
	if (value === "false") return false;

	throw new Error(`${name} must be either true or false`);
}

function readNumberEnv(name: string, fallback: number) {
	const value = Bun.env[name];
	if (!value) return fallback;

	const number = Number(value);
	if (!Number.isInteger(number) || number <= 0) {
		throw new Error(`${name} must be a positive integer`);
	}

	return number;
}

function readNonNegativeNumberEnv(name: string, fallback: number) {
	const value = Bun.env[name];
	if (!value) return fallback;

	const number = Number(value);
	if (!Number.isInteger(number) || number < 0) {
		throw new Error(`${name} must be a non-negative integer`);
	}

	return number;
}

const storageDriver = Bun.env.STORAGE_DRIVER || "local";

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
		readEnv(name);
	}
}

const secret = readEnv("SECRET");

if (isProduction && secret.length < 32) {
	throw new Error("SECRET must be at least 32 characters in production");
}

export const config = {
	nodeEnv,
	databaseUrl: readEnv("DATABASE_URL", "postgres://user:password@localhost:5432/mydb"),
	dbPoolMax: readNumberEnv("DB_POOL_MAX", 10),
	redisUrl: readEnv("REDIS_URL", "redis://localhost:6379"),
	secret,
	corsOrigin: readEnv("CORS_ORIGIN", "http://localhost:5173"),
	enableDocs: readBooleanEnv("ENABLE_DOCS", !isProduction),
	dbLogQueries: nodeEnv === "development" && readBooleanEnv("DB_LOG_QUERIES", true),
	jwtAudience: readEnv("JWT_AUDIENCE", "app-web"),
	jwtIssuer: readEnv("JWT_ISSUER", "hitransfer-api"),
	authUserCacheTtlMs: readNonNegativeNumberEnv("AUTH_USER_CACHE_TTL_MS", isProduction ? 30_000 : 0),
	authUserCacheMax: readNumberEnv("AUTH_USER_CACHE_MAX", 1_000),
	storage: {
		driver: storageDriver as "local" | "s3" | "r2",
		bucket: readOptionalEnv("STORAGE_BUCKET"),
		endpoint: readOptionalEnv("STORAGE_ENDPOINT"),
		region: readOptionalEnv("STORAGE_REGION"),
		accessKeyId: readOptionalEnv("STORAGE_ACCESS_KEY_ID"),
		secretAccessKey: readOptionalEnv("STORAGE_SECRET_ACCESS_KEY"),
		publicBaseUrl: readOptionalEnv("STORAGE_PUBLIC_BASE_URL"),
	},
	isProduction,
};
