import { Status } from "@prisma/client";
import { Badge } from "./ui/badge";

const StatusBadge = ({ statusObj }: { statusObj: Status }) => {
	function getStatusColor(statusObj: Status) {
		return `bg-${statusObj.color}-300 dark:bg-${statusObj.color}-700`;
	}

	return (
		<Badge className={`px-3 py-1 w-fit text-xs ${getStatusColor(statusObj)}`} variant="secondary">
			{statusObj.name}
		</Badge>
	);
};

export default StatusBadge;
