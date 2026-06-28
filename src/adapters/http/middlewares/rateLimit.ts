type RateLimitOptions = {
	windowMs: number;
	max: number;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
	const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	return request.headers.get("cf-connecting-ip") || forwardedFor || "unknown";
}

export function createRateLimit(options: RateLimitOptions) {
	return ({ request, status }: { request: Request; status: any }) => {
		const now = Date.now();
		const key = `${request.method}:${new URL(request.url).pathname}:${getClientIp(request)}`;
		const bucket = buckets.get(key);

		if (!bucket || bucket.resetAt <= now) {
			buckets.set(key, { count: 1, resetAt: now + options.windowMs });
			return;
		}

		bucket.count += 1;

		if (bucket.count > options.max) {
			return status(429, { message: "Too many requests" });
		}
	};
}
