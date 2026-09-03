import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import prisma from "@/prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import TemplatesTable from "./_components/TemplatesTable";

export default async function ChecklistTemplatesPage() {
	// Only admins can manage checklist templates.
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);
	if (!userPermissions?.isAdmin) return notFound();

	const templates = await prisma.checklistTemplate.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true, _count: { select: { items: true } } },
	});

	return (
		<Card className="container mx-auto px-0 md:px-0 max-w-2xl">
			<div className="fade-in container mx-auto p-2 md:px-7">
				<div className="flex items-center justify-between py-3">
					<h1 className="text-xl font-bold">Checklist templates</h1>
					<Button size="sm" asChild>
						<Link href="/checklist-templates/new">New template</Link>
					</Button>
				</div>
				<TemplatesTable templates={templates} />
			</div>
		</Card>
	);
}
