import { uploadObject } from "@/adapters/storage/objectStorage";
import { db as database } from "@/adapters/db/kysely";
import { getAvatarMetadata } from "@/modules/user/helpers";
import {
	publicUserFields,
	type UpdateUserNameInput,
	type IUserPublic,
	type UploadAvatarInput,
} from "@/modules/user/types";
import { AppError } from "@/shared/errors/appError";

type UserCoreContext = {
	db: typeof database;
	getAvatarMetadata: typeof getAvatarMetadata;
	uploadObject: typeof uploadObject;
};

function createUserCore(context: UserCoreContext = { db: database, getAvatarMetadata, uploadObject }) {
	async function updateUserName(input: UpdateUserNameInput): Promise<IUserPublic> {
		const result = await context.db
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
		const user = await context.db
			.selectFrom("users")
			.select("id")
			.where("id", "=", input.userId)
			.where("deleted_at", "is", null)
			.executeTakeFirst();

		if (!user) {
			throw new AppError("User not found", 404);
		}

		const avatar = await context.getAvatarMetadata(input.avatar);

		const filename = `${input.userId}-${crypto.randomUUID()}.${avatar.extension}`;
		const avatarUrl = await context.uploadObject({
			key: `avatars/${filename}`,
			file: input.avatar,
			contentType: avatar.contentType,
		});

		await context.db
			.updateTable("users")
			.set({
				avatar_url: avatarUrl,
				updated_at: new Date(),
			})
			.where("id", "=", input.userId)
			.execute();

		return avatarUrl;
	}

	return { updateUserName, uploadAvatar };
}

const { updateUserName, uploadAvatar } = createUserCore();

export { createUserCore, updateUserName, uploadAvatar };
