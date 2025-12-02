import { db } from "@/adapters/db/kysely";
import type { signinInput, sigupInput } from "@/modules/core/types";
import { type UserPublic, UserRole } from "@/modules/user/types";
import { AppError } from "@/shared/erros/appError";

async function signin(input: signinInput): Promise<UserPublic> {
	const user = await db.selectFrom("users").selectAll().where("email", "=", input.email).executeTakeFirst();

	if (!user) {
		throw new AppError("Invalid email or password", 401);
	}

	const isValid = await Bun.password.verify(input.password, user.password);
	if (!isValid) {
		throw new AppError("Invalid password", 401);
	}

	return user as UserPublic;
}

async function signup(input: sigupInput): Promise<void> {
	const existingUser = await db.selectFrom("users").selectAll().where("email", "=", input.email).executeTakeFirst();

	if (existingUser) {
		throw new AppError("Email already in use", 409);
	}

	const hashedPassword = await Bun.password.hash(input.password);

	await db.transaction().execute(async (trx) => {
		await trx
			.insertInto("users")
			.values({
				name: input.name,
				email: input.email,
				password: hashedPassword,
				role: UserRole.FREE,
				created_at: new Date(),
			})
			.execute();
	});
}

export { signin, signup };
