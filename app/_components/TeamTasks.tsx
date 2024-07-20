import MultipleUserTasks from "@/components/MultipleUserTasks";
import { TaskExtended } from "../(protected)/tasks/page";

function TeamTasks({ tasks }: { tasks: TaskExtended[] }) {
	const title = tasks.length == 0 ? `No open team tasks 👌` : tasks.length == 1 ? `My team's task` : `My team's ${tasks.length} open tasks`;
	return (
		<div id="my-tasks" className="flex-grow h-auto overflow-auto border-none p-3 pr-0 space-y-2 md:px-6 md:pr-0">
			<div className="p-0">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{title}</h4>
			</div>
			<MultipleUserTasks tasks={tasks} />
		</div>
	);
}

export default TeamTasks;
