import { AppError } from "@/shared/erros/appError";

export function errorHandler(ctx: any) {
	const { code, error, set } = ctx as { code?: string; error: any; set: { status?: number | string } };

	if (error instanceof AppError) {
		set.status = error.statusCode;
		return { error: error.message, details: error.details };
	}

	if (code === "VALIDATION") {
		set.status = 400;
		try {
			return { error: JSON.parse(error.message) };
		} catch {
			return { error: error.message };
		}
	}

	if (error instanceof Error) {
		set.status = 500;
		try {
			return { error: JSON.parse(error.message) };
		} catch {
			return { error: error.message };
		}
	}

	set.status = 500;
	return { error: "Erro interno no servidor" };
}
