import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { notFound } from "next/navigation";
import TemplateForm from "../_components/TemplateForm";

export default async function NewChecklistTemplatePage() {
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);
	if (!userPermissions?.isAdmin) return notFound();

	return <TemplateForm />;
}
