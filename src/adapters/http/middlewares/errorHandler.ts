import { AppError } from "@/shared/errors/appError";
import { config } from "@/config/env";

type ErrorHandlerContext = {
	code?: string | number;
	error: unknown;
	set: {
		status?: number | string;
	};
};

export function errorHandler(ctx: ErrorHandlerContext) {
	const { code, error, set } = ctx;

	if (error instanceof AppError) {
		set.status = error.statusCode;
		return error.details ? { message: error.message, details: error.details } : { message: error.message };
	}

	if (code === "VALIDATION") {
		set.status = 400;
		try {
			const message = error instanceof Error ? error.message : String(error);
			return { message: "Validation error", details: JSON.parse(message) };
		} catch {
			return { message: error instanceof Error ? error.message : String(error) };
		}
	}

	if (error instanceof Error) {
		set.status = 500;
		if (!config.isProduction) {
			try {
				return { message: "Internal server error", details: JSON.parse(error.message) };
			} catch {
				return { message: error.message };
			}
		}

		return { message: "Internal server error" };
	}

	set.status = 500;
	return { message: "Internal server error" };
}
