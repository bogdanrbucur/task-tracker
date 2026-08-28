// Microsoft 365 (Entra ID) OAuth configuration.
//
// The feature is opt-in: with M365_AUTH_ENABLED unset the app behaves exactly as it did before
// OAuth existed - no button on the sign-in page, and the two /api/auth/m365 routes 404.
//
// Config is read per call rather than captured at module load, for the same reason as lib/logging.ts:
// this module is imported by the Next server, and the env may not be loaded when it is first evaluated.

import { MicrosoftEntraId } from "arctic";

export type M365Config = {
	tenantId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
};

// Returns the config only when the feature is switched on AND fully configured. A half-filled
// .env.local degrades to password-only sign-in rather than throwing on every request.
export function getM365Config(): M365Config | null {
	if (process.env.M365_AUTH_ENABLED !== "true") return null;

	const tenantId = process.env.M365_TENANT_ID?.trim();
	const clientId = process.env.M365_CLIENT_ID?.trim();
	const clientSecret = process.env.M365_CLIENT_SECRET?.trim();
	// Reuse BASE_URL, which already anchors the links in password-reset emails.
	const baseUrl = process.env.BASE_URL?.trim();

	if (!tenantId || !clientId || !clientSecret || !baseUrl) return null;

	return {
		tenantId,
		clientId,
		clientSecret,
		redirectUri: `${baseUrl.replace(/\/+$/, "")}${M365_CALLBACK_PATH}`,
	};
}

export const M365_CALLBACK_PATH = "/api/auth/m365/callback";
export const M365_LOGIN_PATH = "/api/auth/m365/login";

export function isM365Enabled(): boolean {
	return getM365Config() !== null;
}

export function getEntraClient(config: M365Config) {
	return new MicrosoftEntraId(config.tenantId, config.clientId, config.clientSecret, config.redirectUri);
}

// Short-lived cookies carrying the CSRF state and the PKCE verifier across the round trip to Microsoft.
export const M365_STATE_COOKIE = "m365_state";
export const M365_VERIFIER_COOKIE = "m365_verifier";

export const m365CookieOptions = {
	path: "/",
	httpOnly: true,
	// Mirrors lib/lucia.ts - the dev server runs on plain http.
	secure: process.env.NODE_ENV === "production",
	// The browser arrives back here via a top-level redirect from login.microsoftonline.com,
	// so the cookies must survive a cross-site navigation. "lax" does that; "strict" would not.
	sameSite: "lax",
	maxAge: 60 * 10,
} as const;

// The fixed set of failures the callback may report back to /sign-in. Nothing from the token is
// ever reflected into the URL - the page maps these codes to messages itself.
export type M365ErrorCode = "no_account" | "inactive" | "already_linked" | "wrong_tenant" | "oauth_failed" | "identity_unresolved";

export const m365ErrorMessages: Record<M365ErrorCode, string> = {
	no_account: "No account found for this Microsoft user. Ask an administrator to create your account.",
	inactive: "Your account is deactivated. Contact an administrator.",
	already_linked: "This account is already linked to a different Microsoft user. Ask an administrator to unlink it.",
	wrong_tenant: "That Microsoft account does not belong to this organisation.",
	oauth_failed: "Microsoft sign-in failed. Please try again.",
	identity_unresolved: "Could not verify your Microsoft account. Please try again in a moment.",
};
