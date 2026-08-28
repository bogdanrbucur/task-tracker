// Server action to remove a user's Microsoft 365 link, so they can re-link to a different tenant
// account (e.g. after their tenant account was recreated and got a new object id).
"use server";

import { getAdminActor } from "@/actions/auth/require-auth";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function unlinkMicrosoft(prevState: any, formData: FormData) {
	// Only admins, and the actor comes from the session rather than the form.
	const actor = await getAdminActor();
	if (!actor) return { message: "You do not have permission to perform this action." };

	const schema = z.object({ id: z.string().length(25, { message: "Invalid user ID." }) });

	try {
		const data = schema.parse({ id: formData.get("id") as string });

		const user = await prisma.user.findUnique({ where: { id: data.id }, select: { email: true, entraUpn: true } });
		if (!user) throw new Error("User not found.");

		// Only the link is cleared. The user stays active and keeps whatever password they have -
		// unlinking is a correction of the tenant mapping, not a way to lock somebody out.
		await prisma.user.update({
			where: { id: data.id },
			data: { entraOid: null, entraUpn: null, entraLinkedAt: null },
		});

		logger(`Microsoft 365 link removed from ${user.email} (was ${user.entraUpn ?? "unknown"}) by ${actor.user.email}`);
	} catch (error) {
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		else return { message: (error as any).message };
	}

	revalidatePath(`/users/${formData.get("id")}`);
}
