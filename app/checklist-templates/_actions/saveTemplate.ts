// Creates or updates a checklist template (name + 1-50 ordered items). Admin-only.
"use server";

import { PERMISSION_DENIED, getAdminActor } from "@/actions/auth/require-auth";
import logger from "@/lib/logging";
import prisma from "@/prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TEMPLATE_NAME_MIN, TemplateItemsInput, syncTemplateItems } from "./checklistTemplateShared";

export default async function saveTemplate(prevState: any, formData: FormData) {
	// The checklist-templates pages are admin-only, but this action is reachable on its own.
	const actor = await getAdminActor();
	if (!actor) return { message: PERMISSION_DENIED };

	const schema = z.object({
		id: z.string().optional(),
		name: z.string().trim().min(TEMPLATE_NAME_MIN, { message: `Template name must be at least ${TEMPLATE_NAME_MIN} characters long.` }),
		// The client serialises the item list into one hidden "items" field as JSON.
		items: z.string(),
	});

	try {
		const data = schema.parse({
			id: (formData.get("id") as string) || undefined,
			name: formData.get("name") as string,
			items: formData.get("items") as string,
		});

		const items = TemplateItemsInput.parse(JSON.parse(data.items));

		if (data.id) {
			const id = Number(data.id);
			const existing = await prisma.checklistTemplate.findUnique({ where: { id } });
			if (!existing) throw new Error("Template not found.");
			await prisma.checklistTemplate.update({ where: { id }, data: { name: data.name } });
			await syncTemplateItems(id, items);
			logger(`Checklist template updated: ${data.name}`);
		} else {
			const created = await prisma.checklistTemplate.create({ data: { name: data.name } });
			await syncTemplateItems(created.id, items);
			logger(`New checklist template created: ${data.name}`);
		}
	} catch (error) {
		if (error instanceof z.ZodError) for (const subError of error.errors) return { message: subError.message };
		if (error instanceof SyntaxError) return { message: "Could not read the checklist items." };
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { message: "A template with that name already exists." };
		return { message: (error as any).message };
	}

	revalidatePath("/checklist-templates");
	return { success: true };
}
