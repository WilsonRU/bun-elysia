import { db } from "@/adapters/db/kysely";
import { isUniqueViolation } from "@/adapters/db/errors";
import type { SigninInput, SignupInput } from "@/modules/auth/types";
import { type IUserPublic, publicUserFields, UserRole } from "@/modules/user/types";
import { AppError } from "@/shared/errors/appError";

async function signin(input: SigninInput): Promise<IUserPublic> {
	const user = await db
		.selectFrom("users")
		.select([...publicUserFields, "password"])
		.where("email", "=", input.email)
		.where("deleted_at", "is", null)
		.executeTakeFirst();

	if (!user) {
		throw new AppError("Invalid email or password", 401);
	}

	const isValid = await Bun.password.verify(input.password, user.password);
	if (!isValid) {
		throw new AppError("Invalid email or password", 401);
	}

	const { password: _, ...publicUser } = user;
	return publicUser;
}

async function signup(input: SignupInput): Promise<void> {
	const hashedPassword = await Bun.password.hash(input.password);

	try {
		await db.transaction().execute(async (trx) => {
			await trx
				.insertInto("users")
				.values({
					name: input.name,
					email: input.email,
					password: hashedPassword,
					role: UserRole.USER,
					created_at: new Date(),
				})
				.execute();
		});
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new AppError("Email already in use", 409);
		}

		throw error;
	}
}

export { signin, signup };
