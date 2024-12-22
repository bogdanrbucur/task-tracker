import { UserStatsInterface } from "../../_actions/getUserStats";
import UserStatBarChart from "./UserStatBarChart";

function UserStats({ userStats }: { userStats: UserStatsInterface | null }) {
	if (!userStats) return null;
	return (
		<div className="space-y-1">
			<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">User Statistics</h4>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{userStats?.taskCompletionTimeVsAvg && (
					<UserStatBarChart data={userStats?.taskCompletionTimeVsAvg} title="Average task completion time" rawNumber={userStats.userAvgTaskCompletionTime} />
				)}
				{userStats?.taskReviewTimeVsAvg !== null && (
					<UserStatBarChart data={userStats?.taskReviewTimeVsAvg} title="Average task review time" rawNumber={userStats.userAvgTaskReviewTime} />
				)}
				{userStats?.completedBeforeOriginalDueDate !== null && (
					<UserStatBarChart data={userStats?.completedBeforeOriginalDueDate} title="Tasks completed within original due date" />
				)}
				{userStats?.completedBeforeDueDate !== null && <UserStatBarChart data={userStats?.completedBeforeDueDate} title="Tasks completed within due date" />}
			</div>
		</div>
	);
}

export default UserStats;
