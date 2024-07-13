import prisma from "@/prisma/client";
import { User } from "@prisma/client";
import { generateRandomString, alphabet, sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";

export default async function generatePassChangeToken(user: User, minutes: number = 15): Promise<string> {
	// Create a unique random password reset token
	const secret = generateRandomString(10, alphabet("a-z", "0-9"));
	const encodedText = new TextEncoder().encode(user.email + Date.now().toString() + secret);
	const shaArrayBuffer = await sha256(encodedText);
	const token = encodeHex(shaArrayBuffer);

	console.log(token);

	// Write the token to the database and give it a 15 min expiry
	const newToken = await prisma.passwordResetToken.create({
		data: {
			userId: user.id,
			token,
			expiresAt: new Date(Date.now() + minutes * 60 * 1000), // 15 min default
		},
	});

	return token;
}
