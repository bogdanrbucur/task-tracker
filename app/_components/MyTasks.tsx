import SingleUserTasks from "@/components/SingleUserTasks";
import { Task } from "@prisma/client";

function MyTasks({ tasks, hasSubordinates }: { tasks: Task[]; hasSubordinates: boolean }) {
	const title = tasks.length == 0 ? `No open tasks ✅` : tasks.length == 1 ? `My open task 📋` : `My ${tasks.length} open tasks 📋`;
	return (
		<>
			<div className="p-3 space-y-2 md:px-6">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{title}</h4>
			</div>
			<div id="my-tasks" className={`flex-grow h-${tasks.length == 0 ? "1/6" : "auto"} overflow-auto min-h-36 p-3 space-y-2 md:px-6 pr-0`}>
				<SingleUserTasks tasks={tasks} />
			</div>
		</>
	);
}

export default MyTasks;
