import { AppError } from "@/shared/errors/appError";

type AvatarMetadata = {
	extension: "png" | "jpg";
	contentType: "image/png" | "image/jpeg";
};

async function getAvatarMetadata(file: File): Promise<AvatarMetadata> {
	const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
	const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
	const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

	if (isPng) {
		return {
			extension: "png",
			contentType: "image/png",
		};
	}

	if (isJpeg) {
		return {
			extension: "jpg",
			contentType: "image/jpeg",
		};
	}

	throw new AppError("Invalid avatar file", 400);
}

export { getAvatarMetadata };
