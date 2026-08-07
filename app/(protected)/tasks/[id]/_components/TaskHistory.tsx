import { parseDescriptionChange } from "@/lib/descriptionDiff";
import { formatDate, formatDateWithTime } from "@/lib/utilityFunctions";
import { Change } from "@prisma/client";
import { CardContent } from "../../../../../components/ui/card";

const TaskHistory = ({ changes }: { changes: Change[] }) => {
	return (
		<CardContent className="space-y-4 px-3 md:px-6 pb-3 md:pb-6">
			{changes.map((change) => {
				const descriptionDiff = parseDescriptionChange(change.changes);
				return (
					<div key={change.id} className="space-y-1.5">
						<div className="flex items-center gap-2">
							<ClockIcon />
							<div className="text-xs text-gray-500 dark:text-gray-400">{formatDateWithTime(change.time)}</div>
						</div>
						{descriptionDiff ? (
							<>
								<div className="text-xs md:text-sm text-gray-500 dark:text-gray-400" data-testid="change-text">
									Description changed by {descriptionDiff.editor}
								</div>
								<div className="whitespace-pre-wrap rounded border border-input bg-muted/30 p-2 text-xs md:text-sm" data-testid="description-diff">
									{descriptionDiff.parts.map((part, index) =>
										part.added ? (
											<ins key={index} className="bg-green-100 text-green-900 no-underline dark:bg-green-900/40 dark:text-green-300">
												{part.value}
											</ins>
										) : part.removed ? (
											<del key={index} className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300">
												{part.value}
											</del>
										) : (
											<span key={index}>{part.value}</span>
										)
									)}
								</div>
							</>
						) : (
							<div className="text-xs md:text-sm text-gray-500 dark:text-gray-400" data-testid="change-text">
								{change.changes}
							</div>
						)}
					</div>
				);
			})}
		</CardContent>
	);
};

function ClockIcon() {
	return (
		<svg
			className="flex-shrink-0 text-gray-500 dark:text-gray-400"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	);
}

export default TaskHistory;
