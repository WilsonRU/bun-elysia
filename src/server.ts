import { db } from "@/adapters/db/kysely";
import { config } from "@/config/env";
import app from "@/index";

app.listen(config.port);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, async () => {
		await db.destroy();
		process.exit(0);
	});
}
