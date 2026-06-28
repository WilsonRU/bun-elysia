import { describe, expect, it } from "bun:test";
import { getAvatarMetadata } from "@/modules/user/helpers";
import { AppError } from "@/shared/errors/appError";

describe("getAvatarMetadata", () => {
	it("detects PNG files by signature bytes", async () => {
		const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00])], "avatar.bin");

		await expect(getAvatarMetadata(file)).resolves.toEqual({
			extension: "png",
			contentType: "image/png",
		});
	});

	it("detects JPEG files by signature bytes", async () => {
		const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "avatar.bin");

		await expect(getAvatarMetadata(file)).resolves.toEqual({
			extension: "jpg",
			contentType: "image/jpeg",
		});
	});

	it("rejects files without an accepted avatar signature", async () => {
		const file = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], "avatar.bin");

		await expect(getAvatarMetadata(file)).rejects.toEqual(new AppError("Invalid avatar file", 400));
	});
});
