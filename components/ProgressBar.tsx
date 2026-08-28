// Completion bar for a task's derived progress (from its sub-tasks and/or checklist items).
//
// Two variants, not two components: they share the same fill logic and only differ in how much
// context fits around it. "full" - "X of Y done · Z%" above a wide bar - is for the task detail
// page, where there's a whole row to itself. "compact" - just a short bar and a percentage - is
// for tight spaces: the tasks table's Status column, a sub-task row, and the mobile title row.
// A ring was tried in all three of those first; it read as an out-of-place loading spinner next to
// the rest of the app's flat, rectangular controls (badges, buttons), so this replaces it.

import { cn } from "@/lib/utils";

interface Props {
	percent: number;
	done?: number;
	total?: number;
	variant?: "full" | "compact";
	className?: string;
}

export default function ProgressBar({ percent, done, total, variant = "full", className }: Props) {
	const clamped = Math.min(100, Math.max(0, Math.round(percent)));
	const fillClass = clamped === 100 ? "bg-green-500" : "bg-primary";

	if (variant === "compact") {
		return (
			<div className={cn("flex items-center gap-1.5", className)} data-testid="progress-bar" data-percent={clamped}>
				<div className="h-1.5 w-14 shrink-0 rounded-full bg-muted overflow-hidden">
					<div className={cn("h-full rounded-full transition-[width]", fillClass)} style={{ width: `${clamped}%` }} />
				</div>
				<span className="text-xs text-muted-foreground shrink-0">{clamped}%</span>
			</div>
		);
	}

	return (
		<div className={cn("space-y-1", className)} data-testid="progress-bar" data-percent={clamped}>
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted-foreground">
					{done} of {total} done
				</span>
				<span className="font-medium">{clamped}%</span>
			</div>
			<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
				<div className={cn("h-full rounded-full transition-[width]", fillClass)} style={{ width: `${clamped}%` }} />
			</div>
		</div>
	);
}
