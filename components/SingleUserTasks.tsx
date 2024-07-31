import { dueColor, formatDate } from "@/lib/utilityFunctions";
import { cn } from "@/lib/utils";
import { Task } from "@prisma/client";
import StatusBadge from "@/components/StatusBadge";

import Link from "next/link";

function SingleUserTasks({ tasks }: { tasks: Task[] }) {
	return (
		<div className="grid pr-2 gap-2">
			{tasks.map((task) => (
				<div key={task.id}>
					<Link href={`/tasks/${task.id}`}>
						<h4 className="text-sm md:text-base">{task.title}</h4>
					</Link>
					<div className="flex items-center justify-between">
						<div>
							<div className="text-xs text-gray-500 dark:text-gray-400 flex gap-x-1">
								Due on <div className={cn(dueColor(task), "text-xs")}>{formatDate(task.dueDate)}</div>
							</div>
							{task.completedOn && (
								<div className="text-xs text-gray-500 dark:text-gray-400 flex gap-x-1">
									Completed on <div className={cn(dueColor(task), "text-xs")}>{formatDate(task.completedOn)}</div>
								</div>
							)}
						</div>
						{/* @ts-ignore */}
						<StatusBadge statusObj={task.status} size="xs" />
					</div>
				</div>
			))}
		</div>
	);
}

export default SingleUserTasks;
