"use client";
import { useRouter } from "next/navigation";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DeptTaskChartData } from "../deptTasksChartData";

interface Props {
	data: DeptTaskChartData[];
	isGuest: boolean;
}

const SEGMENTS = [
	// Fills use the softened chart colour; the tooltip labels use the -ink rung. See globals.css.
	{ key: "overdue" as const, label: "Overdue", color: "hsl(var(--chart-overdue))", statusId: 5 },
	{ key: "inprogress" as const, label: "In Progress", color: "hsl(var(--chart-inprogress))", statusId: 1 },
	{ key: "completed" as const, label: "Pending Review", color: "hsl(var(--chart-pendingreview))", statusId: 2 },
];

// entry.url points at the combined status list (all 3 open statuses) for the whole bar;
// clicking a single segment should only filter to that segment's status
function segmentUrl(entryUrl: string, statusId: number) {
	return entryUrl.replace(/status=[^&]+/, `status=${statusId}`);
}

// A department can have zero tasks in a given status, so the visually first/last
// segment of its bar isn't always the same SEGMENTS index - round corners based on
// which segments actually have width, not on fixed position
function edgeSegmentKeys(entry: DeptTaskChartData) {
	const visible = SEGMENTS.filter((segment) => entry[segment.key] > 0);
	return { first: visible[0]?.key, last: visible[visible.length - 1]?.key };
}

const BAR_RADIUS = 4;
// Stacked segments differ from each other by only ~1.1-1.3:1 in luminance - they are told apart by
// hue, not brightness - so touching segments blur into one bar. A hairline gap separates them, the
// same job the donut's stroke does.
const SEGMENT_GAP = 2;
// Fixed height per department row, so spacing stays constant whether there are
// 3 departments or 15 - the chart grows with the data instead of stretching to
// fill whatever panel height happens to be available
const ROW_HEIGHT = 56;

function roundedBarPath(x: number, y: number, width: number, height: number, roundLeft: boolean, roundRight: boolean) {
	const rl = roundLeft ? Math.min(BAR_RADIUS, width) : 0;
	const rr = roundRight ? Math.min(BAR_RADIUS, width) : 0;

	return `
		M${x + rl},${y}
		H${x + width - rr}
		${rr ? `A${rr},${rr} 0 0 1 ${x + width},${y + rr}` : ""}
		V${y + height - rr}
		${rr ? `A${rr},${rr} 0 0 1 ${x + width - rr},${y + height}` : ""}
		H${x + rl}
		${rl ? `A${rl},${rl} 0 0 1 ${x},${y + height - rl}` : ""}
		V${y + rl}
		${rl ? `A${rl},${rl} 0 0 1 ${x + rl},${y}` : ""}
		Z
	`;
}

export default function DepartmentsBarChart({ data, isGuest }: Props) {
	const router = useRouter();

	// Busiest departments first (most open tasks); overdue count breaks ties
	const sorted = [...data].sort((a, b) => b.value - a.value || b.overdue - a.overdue);

	return (
		<div id="dept-chart" className={`fade-in ${isGuest ? "" : "hidden"} md:flex md:flex-col h-full border-none p-3 pr-0 space-y-2 md:px-6 md:pr-0`}>
			<div className="p-0">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Department distribution</h4>
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto" data-testid="dept-chart-rendered">
				<ResponsiveContainer width="100%" height={sorted.length * ROW_HEIGHT}>
					<BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 32, bottom: 8, left: 0 }} barCategoryGap="30%" barSize={28}>
						<XAxis type="number" hide />
						<YAxis
							type="category"
							dataKey="name"
							width={150}
							axisLine={false}
							tickLine={false}
							tick={{ fill: "hsl(var(--foreground))", fontSize: 13 }}
						/>
						<Tooltip content={<DeptTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
						{SEGMENTS.map((segment, segmentIndex) => (
							<Bar
								key={segment.key}
								dataKey={segment.key}
								stackId="dept"
								fill={segment.color}
								style={{ cursor: "pointer" }}
								onClick={(entry: any) => router.push(segmentUrl(entry.url, segment.statusId))}
								shape={(props: any) => {
									const { x, y, width, height, payload } = props;
									if (!width) return <g />;
									const { first, last } = edgeSegmentKeys(payload);
									// Every segment but the visually last gives up its trailing pixels to the gap
									const isLast = segment.key === last;
									const drawn = isLast ? width : Math.max(1, width - SEGMENT_GAP);
									return <path d={roundedBarPath(x, y, drawn, height, segment.key === first, isLast)} fill={segment.color} />;
								}}
							>
								{sorted.map((entry, index) => (
									<Cell key={`cell-${entry.name}-${index}`} />
								))}
								{segmentIndex === SEGMENTS.length - 1 && <LabelList dataKey="value" position="right" style={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />}
							</Bar>
						))}
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

const DeptTooltip = ({ active, payload, label }: any) => {
	if (!active || !payload?.length) return null;
	const row: DeptTaskChartData = payload[0].payload;

	return (
		<div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
			<p className="font-semibold mb-1">{label}</p>
			<p style={{ color: "hsl(var(--chart-overdue-ink))" }}>{row.overdue} Overdue</p>
			<p style={{ color: "hsl(var(--chart-inprogress-ink))" }}>{row.inprogress} In Progress</p>
			<p style={{ color: "hsl(var(--chart-pendingreview-ink))" }}>{row.completed} Pending Review</p>
		</div>
	);
};
