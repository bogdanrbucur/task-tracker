import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import DeleteTemplateButton from "./DeleteTemplateButton";

export interface TemplateRow {
	id: number;
	name: string;
	_count: { items: number };
}

export default function TemplatesTable({ templates }: { templates: TemplateRow[] }) {
	if (templates.length === 0) {
		return <p className="py-6 text-center text-sm text-muted-foreground">No checklist templates yet.</p>;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="py-1.5">Name</TableHead>
					<TableHead className="py-1.5">Items</TableHead>
					<TableHead className="py-1.5">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{templates.map((template) => (
					<TableRow key={template.id}>
						<TableCell className="py-1.5">{template.name}</TableCell>
						<TableCell className="py-1.5">{template._count.items}</TableCell>
						<TableCell className="grid grid-cols-1 md:grid-cols-2 py-1.5 gap-1 md:gap-2">
							<Button size="sm" className="gap-1 min-w-24 max-w-32" asChild>
								<Link href={`/checklist-templates/${template.id}/edit`}>
									Edit <SquarePen size="18" />
								</Link>
							</Button>
							<DeleteTemplateButton template={template} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
