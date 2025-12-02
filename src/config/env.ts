export const config = {
	port: Number(Bun.env.PORT || 3000),
	databaseUrl: Bun.env.DATABASE_URL || "postgres://user:password@localhost:5432/mydb",
	redisUrl: Bun.env.REDIS_URL || "redis://localhost:6379",
	secret: Bun.env.SECRET || "",
};
