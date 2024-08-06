"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { DeptTaskChartData } from "../deptTasksChartData";
import { StatusColors } from "../page";

const COLORS = ["#16a34a", "#ef4444", "#3b82f6", "#f97316", "#a855f7", "#64748b", "#e035d2"];

interface Props {
	data: DeptTaskChartData[];
	statusColors: StatusColors;
	isGuest: boolean;
}

export default function DepartmentsChart({ data, statusColors, isGuest }: Props) {
	const router = useRouter();
	const [inPieActiveIndex, setInPieActiveIndex] = useState<number | undefined>(undefined);

	function onInPieHover(_: any, index: number | undefined) {
		setInPieActiveIndex(index);
	}

	// Do stuff on hover
	const inPieHover = (props: any) => {
		const RADIAN = Math.PI / 180;
		const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value, inprogress, overdue, completed } = props;
		const sin = Math.sin(-RADIAN * midAngle);
		const cos = Math.cos(-RADIAN * midAngle);
		const sx = cx + (outerRadius + 0) * cos;
		const sy = cy + (outerRadius + 10) * sin;
		const mx = cx + (outerRadius + 30) * cos;
		const my = cy + (outerRadius + 30) * sin;
		const ex = mx + (cos >= 0 ? 1 : -1) * 40;
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
				<path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
				<circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
				<text
					className="text-sm"
					fill={"hsl(var(--chart-inprogress))"}
					x={ex + (cos >= 0 ? 1 : -1) * 12}
					y={ey}
					dy={-10}
					textAnchor={textAnchor}
				>{`${inprogress} In Progress`}</text>
				<text className="text-sm" fill={"hsl(var(--chart-overdue))"} x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={5} textAnchor={textAnchor}>{`${overdue} Overdue`}</text>
				<text className="text-sm" fill={"hsl(var(--chart-completed))"} x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={20} textAnchor={textAnchor}>{`${completed} Completed`}</text>
			</g>
		);
	};

	return (
		<div id="dept-chart" className={`fade-in ${isGuest ? "" : "hidden"} md:block border-none p-3 pr-0 space-y-2 md:px-6 md:pr-0`}>
			<div className="p-0">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Department distribution</h4>
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
							<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
						))}
					</Pie>
					<Legend iconSize={10} iconType="circle" formatter={customLegend} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}

const customLegend = (value: string, entry: any) => {
	const { color } = entry;

	return (
		<span className="text-sm" style={{ color }}>
			{value}
		</span>
	);
};
