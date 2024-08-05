"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { StatusColors } from "../page";
import { StatusTasksChartData } from "../statusTasksChartData";

interface Props {
	data: StatusTasksChartData[];
	colors: StatusColors;
	isGuest: boolean;
}

export default function StatusChart({ data, colors, isGuest }: Props) {
	const router = useRouter();
	const [inPieActiveIndex, setInPieActiveIndex] = useState<number | undefined>(undefined);

	function onInPieHover(_: any, index: number | undefined) {
		setInPieActiveIndex(index);
	}

	const totalTasks = data.reduce((acc, curr) => acc + curr.value, 0);

	return (
		<div id="status-chart" className={`fade-in ${isGuest ? "" : "hidden"} md:block border-none p-3 pr-0 space-y-2 md:px-6 md:pr-0`}>
			<div className="p-0">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{`${totalTasks} open tasks`}</h4>
			</div>
			<ResponsiveContainer width="100%" height="90%">
				<PieChart width={600} height={400}>
					<Pie
						data={data}
						cx="50%"
						cy="55%"
						labelLine={false}
						// label={inPieLabel}
						innerRadius={75}
						outerRadius={115}
						fill="#8884d8"
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
							<Cell key={`cell-${index}`} fill={`hsl(var(--chart-${entry.slug}))`} />
						))}
					</Pie>
					<Legend iconSize={10} iconType="circle" formatter={customLegend} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}

const inPieHover = (props: any) => {
	const RADIAN = Math.PI / 180;
	const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, inprogress, overdue, completed } = props;
	const sin = Math.sin(-RADIAN * midAngle);
	const cos = Math.cos(-RADIAN * midAngle);
	const sx = cx + (outerRadius + 10) * cos;
	const sy = cy + (outerRadius + 10) * sin;
	const mx = cx + (outerRadius + 30) * cos;
	const my = cy + (outerRadius + 30) * sin;
	const ex = mx + (cos >= 0 ? 1 : -1) * 25;
	const ey = my;
	const textAnchor = cos >= 0 ? "start" : "end";

	return (
		<g>
			<text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill}>
				{payload.name}
			</text>
			<text x={cx} y={cy} dy={10} textAnchor="middle" fill={fill}>
				{`${value} (${(percent * 100).toFixed(0)}%)`}
			</text>
			<Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
			<Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
		</g>
	);
};

const customLegend = (value: string, entry: any) => {
	const { color } = entry;

	return (
		<span className="text-sm" style={{ color }}>
			{value}
		</span>
	);
};
