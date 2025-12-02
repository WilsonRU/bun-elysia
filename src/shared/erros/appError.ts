export class AppError extends Error {
	constructor(
		public readonly message: string,
		public readonly statusCode = 400,
		public readonly details?: any,
	) {
		super(message);
	}
}
