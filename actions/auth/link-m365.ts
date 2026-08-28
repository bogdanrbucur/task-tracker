// Resolves a Microsoft 365 identity to an existing app user, linking it on first sign-in.
//
// Deliberately NOT a "use server" module - for the same reason as require-auth.ts, this must not
// become a callable endpoint. It is imported by the OAuth callback route handler only.
//
// This never creates users. Accounts are created by admins in the FE (app/users/_actions/createUser.ts);
// OAuth only ever attaches a tenant identity to a row that already exists.

import logger from "@/lib/logging";
import type { M365ErrorCode } from "@/lib/m365";
import prisma from "@/prisma/client";
import type { User } from "@prisma/client";

export type M365Identity = {
	/** Entra object id - stable across UPN and mailbox renames. */
	oid: string;
	/** The mailbox address, e.g. bogdanb-it@example.com. May be absent for accounts without a mailbox. */
	email: string | null;
	/** The username / userPrincipalName, e.g. bogdanb@example.com. */
	upn: string | null;
};

type Result = { user: User } | { error: M365ErrorCode };

export async function resolveM365User(identity: M365Identity): Promise<Result> {
	const email = identity.email?.trim().toLowerCase() || null;
	const upn = identity.upn?.trim().toLowerCase() || null;

	// Already linked: the object id is the key from the second sign-in onwards, so a user keeps
	// working even if their mailbox or username is renamed in the tenant.
	let user = await prisma.user.findUnique({ where: { entraOid: identity.oid } });

	if (!user) {
		// First sign-in. Users are registered by email address, but the tenant username is a
		// different address, so try the mailbox first and fall back to the username.
		if (email) user = await prisma.user.findUnique({ where: { email } });
		if (!user && upn) user = await prisma.user.findUnique({ where: { email: upn } });

		if (!user) {
			logger(`M365 sign-in rejected: no user registered for mail "${email ?? "-"}" or UPN "${upn ?? "-"}"`);
			return { error: "no_account" };
		}

		// The matched row belongs to someone else's tenant account. An admin has to unlink it first;
		// silently re-pointing it would let one tenant user take over another's app account.
		if (user.entraOid && user.entraOid !== identity.oid) {
			logger(`M365 sign-in rejected: user ${user.id} is already linked to a different Microsoft account`);
			return { error: "already_linked" };
		}
	}

	// An admin deactivated this user (app/users/[id]/_actions/toggleUser.ts). A successful tenant
	// sign-in must never bring them back - only an admin re-activating them can.
	if (user.status === "inactive") {
		logger(`M365 sign-in rejected: user ${user.id} (${user.email}) is deactivated`);
		return { error: "inactive" };
	}

	// An admin created them but they never opened the welcome email. Signing in against the tenant
	// is proof enough of identity, so treat it as the verification step. hashedPassword stays null:
	// they simply cannot use the password form until they go through "Forgot password".
	const needsActivation = user.status === "unverified" || !user.active;

	const linked = await prisma.user.update({
		where: { id: user.id },
		data: {
			entraOid: identity.oid,
			entraUpn: upn ?? user.entraUpn,
			entraLinkedAt: user.entraLinkedAt ?? new Date(),
			...(needsActivation ? { active: true, status: "active" } : {}),
		},
	});

	if (needsActivation) logger(`M365 sign-in activated previously unverified user ${linked.id} (${linked.email})`);

	return { user: linked };
}
