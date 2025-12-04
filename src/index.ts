import { createHttp } from "@/adapters/http/elysia";
import { config } from "@/config/env";

const app = createHttp();

app.listen(config.port, () => {
	console.log(`🦊 HTTP is running at 0.0.0.0:${config.port}`);
});