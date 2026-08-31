import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import TemplateForm from "../../_components/TemplateForm";

export default async function EditChecklistTemplatePage({ params }: { params: { id: string } }) {
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);
	if (!userPermissions?.isAdmin) return notFound();

	const { id } = await params;
	const templateId = Number(id);
	if (!Number.isFinite(templateId)) return notFound();

	const template = await prisma.checklistTemplate.findUnique({
		where: { id: templateId },
		include: { items: { orderBy: { position: "asc" } } },
	});
	if (!template) return notFound();

	return <TemplateForm template={{ id: template.id, name: template.name, items: template.items.map((i) => ({ id: i.id, text: i.text })) }} />;
}
