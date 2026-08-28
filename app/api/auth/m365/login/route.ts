// Starts the Microsoft 365 (Entra ID) authorization code flow.

import logger from "@/lib/logging";
import { M365_STATE_COOKIE, M365_VERIFIER_COOKIE, getEntraClient, getM365Config, m365CookieOptions } from "@/lib/m365";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	const config = getM365Config();
	// With the feature off the endpoint does not exist at all, rather than existing and refusing.
	if (!config) return new NextResponse(null, { status: 404 });

	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	// openid/profile/email give us the id_token claims we match on. User.Read is only needed for the
	// Graph fallback in the callback, for tenants where the optional "email" claim is not configured.
	const url = getEntraClient(config).createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email", "User.Read"]);

	const cookieStore = await cookies();
	cookieStore.set(M365_STATE_COOKIE, state, m365CookieOptions);
	cookieStore.set(M365_VERIFIER_COOKIE, codeVerifier, m365CookieOptions);

	logger("M365 sign-in started");

	return NextResponse.redirect(url.toString());
}
