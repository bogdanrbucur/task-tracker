import { Status } from "@prisma/client";
import { Badge } from "./ui/badge";

const StatusBadge = ({ statusObj, size }: { statusObj: Status; size: string }) => {
	function getStatusColor(statusObj: Status) {
		return `bg-${statusObj.color}-100 text-${statusObj.color}-600 dark:bg-${statusObj.color}-900/20 dark:text-${statusObj.color}-400`;
	}

	return (
		<Badge className={`px-2 py-1 min-w-28 text-${size} justify-center ${getStatusColor(statusObj)} whitespace-nowrap`} variant="outline" data-testid="status-badge">
			{statusObj.displayName}
		</Badge>
	);
};

export default StatusBadge;
