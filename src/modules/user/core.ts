import { uploadObject } from "@/adapters/storage/objectStorage";
import { db } from "@/adapters/db/kysely";
import { getAvatarMetadata } from "@/modules/user/helpers";
import {
	publicUserFields,
	type UpdateUserNameInput,
	type IUserPublic,
	type UploadAvatarInput,
} from "@/modules/user/types";
import { AppError } from "@/shared/errors/appError";

async function updateUserName(input: UpdateUserNameInput): Promise<IUserPublic> {
	const result = await db
		.updateTable("users")
		.set({
			name: input.name,
			updated_at: new Date(),
		})
		.where("id", "=", input.userId)
		.where("deleted_at", "is", null)
		.returning(publicUserFields)
		.executeTakeFirst();

	if (!result) {
		throw new AppError("User not found", 404);
	}

	return result;
}

async function uploadAvatar(input: UploadAvatarInput): Promise<string> {
	const user = await db
		.selectFrom("users")
		.select("id")
		.where("id", "=", input.userId)
		.where("deleted_at", "is", null)
		.executeTakeFirst();

	if (!user) {
		throw new AppError("User not found", 404);
	}

	const avatar = await getAvatarMetadata(input.avatar);

	const filename = `${input.userId}-${crypto.randomUUID()}.${avatar.extension}`;
	const avatarUrl = await uploadObject({
		key: `avatars/${filename}`,
		file: input.avatar,
		contentType: avatar.contentType,
	});

	await db
		.updateTable("users")
		.set({
			avatar_url: avatarUrl,
			updated_at: new Date(),
		})
		.where("id", "=", input.userId)
		.execute();

	return avatarUrl;
}

export { updateUserName, uploadAvatar };
