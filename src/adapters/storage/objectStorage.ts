import { config } from "@/config/env";
import { mkdir } from "node:fs/promises";

type UploadObjectInput = {
	key: string;
	file: File;
	contentType: string;
};

const encoder = new TextEncoder();
const immutableCacheControl = "public, max-age=31536000, immutable";

function toArrayBuffer(input: Uint8Array) {
	const copy = new Uint8Array(input.byteLength);
	copy.set(input);
	return copy.buffer;
}

function toHex(buffer: ArrayBuffer) {
	return Array.from(new Uint8Array(buffer))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function sha256Hex(input: string | Uint8Array) {
	const data = typeof input === "string" ? encoder.encode(input) : input;
	return toHex(await crypto.subtle.digest("SHA-256", toArrayBuffer(data)));
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string) {
	const rawKey = key instanceof Uint8Array ? toArrayBuffer(key) : key;
	return crypto.subtle.sign(
		"HMAC",
		await crypto.subtle.importKey("raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
		toArrayBuffer(encoder.encode(data)),
	);
}

async function getSigningKey(secretAccessKey: string, date: string, region: string) {
	const dateKey = await hmacSha256(encoder.encode(`AWS4${secretAccessKey}`), date);
	const dateRegionKey = await hmacSha256(dateKey, region);
	const dateRegionServiceKey = await hmacSha256(dateRegionKey, "s3");
	return hmacSha256(dateRegionServiceKey, "aws4_request");
}

function encodeS3Path(path: string) {
	return path
		.split("/")
		.map((part) => encodeURIComponent(part))
		.join("/");
}

function getObjectUrl(key: string) {
	const publicBaseUrl = config.storage.publicBaseUrl.replace(/\/$/, "");

	if (publicBaseUrl) {
		return `${publicBaseUrl}/${encodeS3Path(key)}`;
	}

	if (config.storage.driver === "local") {
		return `/user/${encodeS3Path(key)}`;
	}

	const endpoint = config.storage.endpoint.replace(/\/$/, "");
	return `${endpoint}/${config.storage.bucket}/${encodeS3Path(key)}`;
}

async function uploadLocalObject(input: UploadObjectInput) {
	const path = `uploads/${input.key}`;
	const directory = path.split("/").slice(0, -1).join("/");

	await mkdir(directory, { recursive: true });
	await Bun.write(path, input.file);

	return getObjectUrl(input.key);
}

async function uploadS3Object(input: UploadObjectInput) {
	const body = new Uint8Array(await input.file.arrayBuffer());
	const endpoint = config.storage.endpoint.replace(/\/$/, "");
	const objectPath = `/${config.storage.bucket}/${encodeS3Path(input.key)}`;
	const url = new URL(`${endpoint}${objectPath}`);
	const now = new Date();
	const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
	const date = amzDate.slice(0, 8);
	const payloadHash = await sha256Hex(body);
	const credentialScope = `${date}/${config.storage.region}/s3/aws4_request`;
	const headers = {
		"cache-control": immutableCacheControl,
		"content-type": input.contentType,
		host: url.host,
		"x-amz-content-sha256": payloadHash,
		"x-amz-date": amzDate,
	};
	const canonicalHeaders = Object.entries(headers)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${key}:${value.trim()}\n`)
		.join("");
	const signedHeaders = Object.keys(headers).sort().join(";");
	const canonicalRequest = ["PUT", url.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
	const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");
	const signingKey = await getSigningKey(config.storage.secretAccessKey, date, config.storage.region);
	const signature = toHex(await hmacSha256(signingKey, stringToSign));
	const authorization = [
		`AWS4-HMAC-SHA256 Credential=${config.storage.accessKeyId}/${credentialScope}`,
		`SignedHeaders=${signedHeaders}`,
		`Signature=${signature}`,
	].join(", ");

	const response = await fetch(url, {
		method: "PUT",
		headers: {
			...headers,
			authorization,
		},
		body,
	});

	if (!response.ok) {
		throw new Error(`Storage upload failed with status ${response.status}: ${await response.text()}`);
	}

	return getObjectUrl(input.key);
}

export async function uploadObject(input: UploadObjectInput) {
	if (config.storage.driver === "local") {
		return uploadLocalObject(input);
	}

	return uploadS3Object(input);
}
