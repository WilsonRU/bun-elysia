import { createHttp } from "@/adapters/http/elysia";
import { db } from "@/adapters/db/kysely";

const app = createHttp();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, async () => {
		await db.destroy();
		process.exit(0);
	});
}

export default app;
