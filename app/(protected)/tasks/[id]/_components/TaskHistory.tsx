import { Change } from "@prisma/client";
import { format } from "date-fns";
import { CardContent } from "../../../../../components/ui/card";

const TaskHistory = ({ changes }: { changes: Change[] }) => {
	return (
		<CardContent className="space-y-4">
			{changes.map((change) => (
				<div key={change.id} className="space-y-1.5">
					<div className="flex items-center gap-2">
						<ClockIcon />
						<div className="text-xs text-gray-500 dark:text-gray-400">{format(change.time, "dd MMM yyyy HH:mm")}</div>
					</div>
					<div className="text-sm text-gray-500 dark:text-gray-400">{change.changes}</div>
				</div>
			))}
		</CardContent>
	);
};

function ClockIcon() {
	return (
		<svg
			className="flex-shrink-0 text-gray-500 dark:text-gray-400"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	);
}

export default TaskHistory;
