import { Status } from "@prisma/client";
import { Badge } from "./ui/badge";

const StatusBadge = ({ statusObj }: { statusObj: Status }) => {
	function getStatusColor(statusObj: Status) {
		return `px-3 py-1 text-xs ${statusObj.color}`;
	}

	return (
		<Badge className={getStatusColor(statusObj)} variant="secondary">
			{statusObj.name}
		</Badge>
	);
};

export default StatusBadge;
