import SingleUserTasks from "@/components/SingleUserTasks";
import { Task } from "@prisma/client";

function MyTasks({ tasks, hasSubordinates }: { tasks: Task[]; hasSubordinates: boolean }) {
	const title = tasks.length == 0 ? `No open tasks` : tasks.length == 1 ? `My open task` : `My ${tasks.length} open tasks`;
	return (
		<div id="my-tasks" className={`flex-grow h-5/6 overflow-auto border-none p-3 pr-0 space-y-2 md:px-6 md:pr-0`}>
			<div className="p-0">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{title}</h4>
			</div>
			<SingleUserTasks tasks={tasks} />
		</div>
	);
}

export default MyTasks;
