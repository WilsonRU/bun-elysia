const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

function hasDatabaseErrorCode(error: unknown, code: string) {
	return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

export function isUniqueViolation(error: unknown) {
	return hasDatabaseErrorCode(error, POSTGRES_UNIQUE_VIOLATION_CODE);
}
