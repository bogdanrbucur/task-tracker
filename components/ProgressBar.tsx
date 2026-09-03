// Completion bar for a task's derived progress (from its sub-tasks and/or checklist items).
//
// Two variants, not two components: they share the same fill logic and only differ in how much
// context fits around it. "full" - "X of Y done · Z%" above a wide bar - is for the task detail
// page, where there's a whole row to itself. "compact" - just a short bar and a percentage - is
// for tight spaces: the tasks table's Status column, a sub-task row, and the mobile title row.
// A ring was tried in all three of those first; it read as an out-of-place loading spinner next to
// the rest of the app's flat, rectangular controls (badges, buttons), so this replaces it.
//
// The fill is sized via `transform: scaleX(...)` on a full-width child, not by setting its own
// `width`. Animating `width` inside a `rounded-full` + `overflow-hidden` track is a known Safari
// rendering trap - it would intermittently paint the track's border with no fill at all until some
// unrelated repaint (e.g. a hover) forced a relayout. `transform` sidesteps layout entirely.

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
	// -600 not -500: Latte's green accent only reaches 2.17:1 against the muted track.
	const fillClass = clamped === 100 ? "bg-green-600" : "bg-primary";

	if (variant === "compact") {
		return (
			// w-28 matches StatusBadge's min-w-28 (see StatusBadge.tsx), so the bar+percentage lines up
			// under the badge instead of sitting at some unrelated width. The track gets a fixed pixel
			// width rather than flex-1: Safari has a long-standing bug where a flex-grow item with
			// overflow-hidden and rounded-full corners collapses to its min-content size (a sliver of
			// just the border) instead of actually growing, and flex-basis/min-width overrides don't
			// reliably fix it there. The percentage gets a fixed width too, right-aligned, so the
			// numbers don't shift the track as they go from one to three digits.
			<div className={cn("flex w-28 items-center gap-1", className)} data-testid="progress-bar" data-percent={clamped}>
				<div className="h-2 w-[72px] shrink-0 rounded-full border border-border bg-muted overflow-hidden">
					<div className={cn("h-full w-full origin-left rounded-full transition-transform", fillClass)} style={{ transform: `scaleX(${clamped / 100})` }} />
				</div>
				<span className="text-xs text-muted-foreground shrink-0 w-9 text-right tabular-nums">{clamped}%</span>
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
				<div className={cn("h-full w-full origin-left rounded-full transition-transform", fillClass)} style={{ transform: `scaleX(${clamped / 100})` }} />
			</div>
		</div>
	);
}
