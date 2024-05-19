import { Status } from "@prisma/client";
import { Badge } from "./ui/badge";

const StatusBadge = ({ statusObj, size }: { statusObj: Status; size: string }) => {
	function getStatusColor(statusObj: Status) {
		return `bg-${statusObj.color}-100 text-${statusObj.color}-600 dark:bg-${statusObj.color}-900/20 dark:text-${statusObj.color}-400`;
	}

	return (
		<Badge className={`px-3 py-1 w-${size === "xs" ? "24" : "28"} text-${size} ${getStatusColor(statusObj)}`} variant="outline">
			{statusObj.name}
		</Badge>
	);
};

export default StatusBadge;
