// Deletes a checklist template and its items (cascade). Admin-only. Always allowed - tasks store
// copies of checklist items, so no task references a template.
"use server";

import { PERMISSION_DENIED, getAdminActor } from "@/actions/auth/require-auth";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export default async function deleteTemplate(prevState: any, formData: FormData) {
	const actor = await getAdminActor();
	if (!actor) return { message: PERMISSION_DENIED };

	try {
		const { id } = z.object({ id: z.coerce.number().int().positive() }).parse({ id: formData.get("id") });
		const template = await prisma.checklistTemplate.findUnique({ where: { id } });
		if (!template) throw new Error("Template not found.");
		await prisma.checklistTemplate.delete({ where: { id } });
		logger(`Checklist template deleted: ${template.name}`);
	} catch (error) {
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		return { message: (error as any).message };
	}

	revalidatePath("/checklist-templates");
	return { success: true };
}
