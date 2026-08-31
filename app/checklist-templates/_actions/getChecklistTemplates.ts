// Loads checklist templates for the "Templates" picker on the task create/edit form. Plain read
// helper (not "use server") - called from server components only.

import prisma from "@/prisma/client";

export interface ChecklistTemplateForPicker {
	id: number;
	name: string;
	items: { text: string }[];
}

export async function getChecklistTemplatesForPicker(): Promise<ChecklistTemplateForPicker[]> {
	return prisma.checklistTemplate.findMany({
		orderBy: { name: "asc" },
		select: {
			id: true,
			name: true,
			items: { orderBy: { position: "asc" }, select: { text: true } },
		},
	});
}
