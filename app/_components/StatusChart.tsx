"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { StatusTasksChartData } from "../statusTasksChartData";

interface Props {
	data: StatusTasksChartData[];
	isGuest: boolean;
}

export default function StatusChart({ data, isGuest }: Props) {
	const router = useRouter();
	const [inPieActiveIndex, setInPieActiveIndex] = useState<number | undefined>(undefined);

	function onInPieHover(_: any, index: number | undefined) {
		setInPieActiveIndex(index);
	}

	const totalTasks = data.reduce((acc, curr) => acc + curr.value, 0);
	const hovered = inPieActiveIndex !== undefined ? data[inPieActiveIndex] : undefined;
	// Total already sits in the title above, so the center defaults to the most
	// urgent slice instead of repeating it; hovering any slice takes over from there
	const centerSlice = hovered ?? data.find((d) => d.slug === "overdue");

	return (
		<div id="status-chart" className={`fade-in ${isGuest ? "" : "hidden"} md:block border-none p-3 pr-0 space-y-2 md:px-6 md:pr-0`}>
			<div className="p-0">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{`${totalTasks} open tasks`}</h4>
			</div>
			<div className="relative w-full h-[90%]">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart width={600} height={400}>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							labelLine={false}
							innerRadius={75}
							outerRadius={115}
							fill="hsl(var(--muted))"
							dataKey="value"
							activeIndex={inPieActiveIndex}
							activeShape={inPieHover}
							onMouseEnter={onInPieHover}
							onMouseLeave={() => setInPieActiveIndex(undefined)}
							onClick={() => {
								router.push(data[inPieActiveIndex!].url);
							}}
							style={{ outline: "none" }}
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={`hsl(var(--chart-${entry.slug}))`}
									// Latte's official accents sit only 1.1-1.6:1 apart from each other, so
									// touching slices would read as one mass; a card-coloured stroke draws
									// the boundary instead of relying on the colour difference.
									stroke="hsl(var(--card))"
									strokeWidth={2}
								/>
							))}
						</Pie>
						<Legend iconSize={10} iconType="circle" formatter={customLegend} payload={legendPayload(data)} />
					</PieChart>
				</ResponsiveContainer>
				{/* Center label: most urgent slice at rest, swaps to whichever slice is hovered */}
				{centerSlice && (
					<div
						className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 -translate-y-4 text-center px-2"
						style={{ color: `hsl(var(--chart-${centerSlice.slug}-ink))` }}
					>
						<span className="text-2xl font-semibold leading-none">{centerSlice.value}</span>
						<span className="text-xs leading-tight" style={{ maxWidth: 130 }}>
							{centerSlice.name}
						</span>
						<span className="text-xs leading-tight opacity-80">{`${((centerSlice.value / totalTasks) * 100).toFixed(0)}%`}</span>
					</div>
				)}
			</div>
		</div>
	);
}

// Highlight only: a single slightly-larger sector, no detached outer ring
const inPieHover = (props: any) => {
	const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

	return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
};

// Recharts would colour the legend with each slice's fill, which is the softened chart colour -
// too weak at text size. Build the payload ourselves so the swatch and label use the ink rung.
const legendPayload = (data: StatusTasksChartData[]) =>
	data.map((entry) => ({ value: entry.name, type: "circle" as const, color: `hsl(var(--chart-${entry.slug}-ink))` }));

const customLegend = (value: string, entry: any) => {
	const { color } = entry;

	return (
		<span className="text-sm" style={{ color }}>
			{value}
		</span>
	);
};
