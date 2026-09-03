"use client";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const CustomLabel = ({ value, rawNumber }: any) => {
	const displayValue = rawNumber > 1 ? `${rawNumber.toFixed(1)} days` : rawNumber <= 1 ? `${(rawNumber * 24).toFixed(1)} hours` : `${(value * 100).toFixed(0)}%`;
	return (
		<div style={{ position: "absolute", width: "100%", textAlign: "center", top: "50%", transform: "translateY(-50%)", zIndex: 3 }}>
			{/* Sits on top of the filled bar, so it tracks the bar colour's flavour: dark ink on Latte's
			    saturated fills would be unreadable, white ink on Mocha's pastel fills equally so. */}
			<span style={{ color: "hsl(var(--chart-label-foreground))" }}>{displayValue}</span>
		</div>
	);
};

export default function UserStatBarChart({ data, title, rawNumber }: { data: number; title: string; rawNumber?: number }) {
	const chartData = [{ v: data, r: 1 - data, raw: rawNumber }];
	const firstBarValue = chartData[0].v;

	return (
		<div id="status-chart" className={`fade-in`} style={{ position: "relative" }}>
			<div className="p-0" style={{ height: "40px" }}>
				<h2 className="text-sm tracking-tight">{title}</h2>
			</div>
			<div style={{ position: "relative", height: "30px" }}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart layout="vertical" width={100} height={30} data={chartData} margin={{ top: 0, right: 1, bottom: 0, left: 1 }}>
						<XAxis type="number" hide />
						<YAxis type="category" hide />
						<Bar dataKey="v" fill={`hsl(var(--chart-meter-good))`} barSize={20} stackId="a" />
						<Bar dataKey="r" fill={`hsl(var(--chart-meter-bad))`} barSize={20} stackId="a" />
					</BarChart>
				</ResponsiveContainer>
				<CustomLabel value={firstBarValue} rawNumber={rawNumber} />
			</div>
		</div>
	);
}
