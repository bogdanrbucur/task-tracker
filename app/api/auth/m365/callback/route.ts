// Completes the Microsoft 365 (Entra ID) authorization code flow and issues a Lucia session.

import { resolveM365User } from "@/actions/auth/link-m365";
import logger from "@/lib/logging";
import { lucia } from "@/lib/lucia";
import {
	M365_STATE_COOKIE,
	M365_VERIFIER_COOKIE,
	type M365ErrorCode,
	getEntraClient,
	getM365Config,
} from "@/lib/m365";
import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

type IdTokenClaims = {
	tid?: string;
	aud?: string;
	oid?: string;
	email?: string;
	upn?: string;
	preferred_username?: string;
};

export async function GET(req: NextRequest) {
	const config = getM365Config();
	if (!config) return new NextResponse(null, { status: 404 });

	// Built from our own configured redirect URI, not the incoming request's Host header - req.url's
	// origin reflects whatever Host the request arrived with, which the reverse proxy may not fully
	// control. The redirect_uri sent to Microsoft is already safe (Microsoft validates it against the
	// app registration), but that says nothing about where THIS route sends the browser afterwards.
	const origin = new URL(config.redirectUri).origin;
	const fail = (code: M365ErrorCode) => NextResponse.redirect(`${origin}/sign-in?error=${code}`);

	const cookieStore = await cookies();
	const storedState = cookieStore.get(M365_STATE_COOKIE)?.value ?? null;
	const codeVerifier = cookieStore.get(M365_VERIFIER_COOKIE)?.value ?? null;

	// One round trip per pair, whatever the outcome.
	cookieStore.delete(M365_STATE_COOKIE);
	cookieStore.delete(M365_VERIFIER_COOKIE);

	const params = new URL(req.url).searchParams;
	const code = params.get("code");
	const state = params.get("state");

	if (params.get("error")) {
		// The user cancelled at the Microsoft prompt, or consent was refused.
		logger(`M365 sign-in aborted at the provider: ${params.get("error")}`);
		return fail("oauth_failed");
	}

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		logger("M365 sign-in rejected: missing or mismatched state/verifier");
		return fail("oauth_failed");
	}

	let claims: IdTokenClaims;
	let accessToken: string | null = null;

	try {
		const tokens = await getEntraClient(config).validateAuthorizationCode(code, codeVerifier);
		// The id_token's signature is not re-verified: we fetched it ourselves over TLS straight from
		// Microsoft's token endpoint, authenticated with our client secret and the PKCE verifier. It
		// never passed through the browser, so there is nothing for an attacker to have substituted.
		claims = decodeIdToken(tokens.idToken()) as IdTokenClaims;
		accessToken = tokens.accessToken();
	} catch (error) {
		logger(`M365 token exchange failed: ${error instanceof Error ? error.message : String(error)}`);
		return fail("oauth_failed");
	}

	// Defence in depth: the app registration is single-tenant and the authority is scoped to our
	// tenant id, but assert the token really came from that tenant anyway.
	if (claims.tid !== config.tenantId) {
		logger(`M365 sign-in rejected: token from tenant "${claims.tid}"`);
		return fail("wrong_tenant");
	}

	// Same reasoning as the tid check above: this token was minted for whoever redeemed the
	// authorization code with our client secret, which can only be us - but asserting aud costs
	// nothing and matches standard OIDC validation.
	if (claims.aud !== config.clientId) {
		logger(`M365 sign-in rejected: token audience "${claims.aud}" does not match our client id`);
		return fail("oauth_failed");
	}

	if (!claims.oid) {
		logger("M365 sign-in rejected: id_token carried no oid claim");
		return fail("oauth_failed");
	}

	const upn = claims.upn ?? claims.preferred_username ?? null;
	let email = claims.email ?? null;

	// The "email" optional claim is not configured on every tenant. Recover the mailbox from Graph
	// so that matching by email address still works if that app-registration step was missed.
	if (!email && accessToken) {
		try {
			const res = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			if (res.ok) {
				const profile = (await res.json()) as { mail?: string | null };
				email = profile.mail ?? null;
			}
		} catch (error) {
			// Not fatal - we can still match on the UPN below.
			logger(`M365 Graph lookup failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// Neither identifier resolved - most likely a transient Graph failure rather than a genuinely
	// unregistered user, so this gets its own message instead of the misleading "no account found".
	if (!email && !upn) {
		logger("M365 sign-in rejected: could not resolve an email or UPN for this identity");
		return fail("identity_unresolved");
	}

	try {
		const result = await resolveM365User({ oid: claims.oid, email, upn });
		if ("error" in result) return fail(result.error);

		const session = await lucia.createSession(result.user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		// Never log the cookie value - same rule as the password sign-in action.
		cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

		logger(`${result.user.email} signed in with Microsoft 365`);

		return NextResponse.redirect(`${origin}/`);
	} catch (error) {
		// A DB hiccup (or a race on the entraOid unique constraint from a near-simultaneous retry)
		// must land the user back on a normal error page, not Next's raw error page.
		logger(`M365 sign-in failed while linking/signing in: ${error instanceof Error ? error.message : String(error)}`);
		return fail("oauth_failed");
	}
}
