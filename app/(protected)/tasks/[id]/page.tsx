/**
 * v0 by Vercel.
 * @see https://v0.dev/t/JrUA9HgbhjF
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import AvatarAndName from "@/components/AvatarAndName";
import TaskHistory from "@/app/(protected)/tasks/TaskHistory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { dueColor, formatDate } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Calendar as CalendarIcon } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

// This is the type of the props passed to the page component
interface Props {
	params: { id: string };
}

export default async function TaskDetailsPage({ params }: Props) {
	// TODO check authentication
	//

	// TODO error handling if id is not a number
	//

	const task = await prisma.task.findUnique({
		where: { id: Number(params.id) },
		include: {
			assignedToUser: true,
			createdByUser: true,
			status: true,
			changes: true,
			comments: true,
		},
	});

	// If the issue is not found, we return a 404 page, included in Next.js
	if (!task) return notFound();

	return (
		<Card className="container mx-auto px-4 py-8 md:px-6 md:py-12">
			<div className="grid gap-6 md:grid-cols-[2fr_1fr]">
				<div>
					<div className="space-y-4">
						<div>
							<h1 className="text-2xl font-bold">{task.title}</h1>
							<p className="text-gray-500 dark:text-gray-400">{task.description}</p>
						</div>
						<div className="flex items-center gap-4 justify-between">
							<Badge className="px-3 py-1 text-sm" variant="secondary">
								{task.status.name}
							</Badge>
							<div className="flex gap-4">
								<Button asChild size="sm" variant="outline">
									<Link href={`/tasks/${task.id}/edit`}>Edit</Link>
								</Button>
								<Button size="sm" variant="outline">
									Complete
								</Button>
							</div>
						</div>
						<div className="grid md:grid-cols-2">
							<div>
								<div className="mb-2">Assigned to:</div>
								<AvatarAndName firstName={task.assignedToUser?.firstName} lastName={task.assignedToUser?.lastName} />
							</div>
							<div>
								<div className="mb-2">Due on:</div>
								<div className="flex items-center">
									<CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
									<div className={dueColor(task.dueDate)}>{formatDate(task.dueDate)}</div>
								</div>
							</div>
						</div>
					</div>
					<Separator className="my-6" />
					{/* START Comments section */}
					<div className="space-y-6">
						<h2 className="text-lg font-semibold">Comments</h2>
						<div className="space-y-4">
							<div className="flex items-start gap-4">
								<Avatar>
									<AvatarImage alt="@shadcn" />
									<AvatarFallback>OD</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<div className="font-medium">Olivia Davis</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">2 days ago</div>
									</div>
									<p className="text-sm text-gray-500 dark:text-gray-400">Great work so far! I have a few suggestions to improve the layout and typography.</p>
								</div>
							</div>
							<div className="flex items-start gap-4">
								<Avatar>
									<AvatarImage alt="@shadcn" />
									<AvatarFallback>JD</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<div className="font-medium">John Doe</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">3 days ago</div>
									</div>
									<p className="text-sm text-gray-500 dark:text-gray-400">Looks good! Let me know if you need any help with the implementation.</p>
								</div>
							</div>
						</div>
					</div>
					{/* END Comments section */}
				</div>
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Task History</CardTitle>
						</CardHeader>
						<TaskHistory changes={task.changes} />
					</Card>
				</div>
			</div>
		</Card>
	);
}
