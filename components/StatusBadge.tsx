import { Status } from "@prisma/client";
import { Badge } from "./ui/badge";

const StatusBadge = ({ statusObj, size }: { statusObj: Status; size: string }) => {
	// The -100/-700 rungs are already flavour-aware (see tailwind.config.ts): -100 is the accent's
	// tint - a pale wash in Latte, a dark wash in Macchiato - and -700 its readable ink in either.
	// That makes the `dark:` half of this pair redundant; it also fixes the old pairing, where
	// `dark:bg-*-900/20` sat only ~4.0-4.4:1 under its own text.
	//
	// The border carries the chip's edge. Fills sit only 1.2-1.6:1 off the surface behind them,
	// which reads fine when the hue differs from the background but vanishes when it doesn't -
	// the blue chip on Macchiato's navy base being the case that exposed it.
	function getStatusColor(statusObj: Status) {
		return `bg-${statusObj.color}-100 text-${statusObj.color}-700 border-${statusObj.color}-400/40`;
	}

	return (
		<Badge className={`px-2 py-1 min-w-28 text-${size} justify-center ${getStatusColor(statusObj)} whitespace-nowrap`} variant="outline" data-testid="status-badge">
			{statusObj.displayName}
		</Badge>
	);
};

export default StatusBadge;
