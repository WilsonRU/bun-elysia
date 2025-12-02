import { db } from "@/adapters/db/kysely";
import type { UpdateUserNameInput, UserPublic } from "@/modules/user/types";

async function updateUserName(input: UpdateUserNameInput): Promise<UserPublic> {
	const result = await db
		.updateTable("users")
		.set({
			name: input.name,
			updated_at: new Date(),
		})
		.where("id", "=", input.userId)
		.returningAll()
		.executeTakeFirst();

	return result as UserPublic;
}

export { updateUserName };
