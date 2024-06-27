import { Card, CardHeader } from "@/components/ui/card";
import ProtectedWrapper from "./ProtectedWrapper";

export default function Home() {
	return (
		<Card className="container mx-auto px-0 md:px-0">
			<div className="container py-3">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card id="departments-chart" className="hidden md:block h-96">
						<CardHeader>
							<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Departments</h4>
						</CardHeader>
					</Card>
					<Card id="status-chart" className="hidden md:block h-96">
						<CardHeader>
							<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Status</h4>
						</CardHeader>
					</Card>
					<Card id="my-tasks" className="h-96">
						<CardHeader>
							<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">My open tasks</h4>
						</CardHeader>
					</Card>
					<Card id="team-tasks" className="h-96">
						<CardHeader>
							<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">My team's open tasks</h4>
						</CardHeader>
					</Card>
				</div>
			</div>
		</Card>
	);
}
