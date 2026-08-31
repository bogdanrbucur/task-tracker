"use client";
import { DatePicker } from "@/app/(protected)/tasks/new/_components/DatePicker";
import { UserExtended } from "@/app/users/_actions/getUserById";
import MarkdownEditor from "@/components/MarkdownEditor";
import { UsersSelection } from "@/components/UsersSelection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/richText";
import { AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { EligibleParentTask } from "../../_actions/getEligibleParentTasks";
import submitTask from "../../new/_actions/submitTask";
import AttachmentsUpload, { TaskAttachments } from "./AttachmentsUpload";
import ChecklistEditor, { ChecklistItemDraft, ChecklistTemplateOption } from "./ChecklistEditor";
import { ParentTaskSelection } from "./ParentTaskSelection";

const initialState = {
	message: null,
};

interface Props {
	users: UserExtended[];
	// Present (with an id) only when editing an existing task. Duplicate/Add sub-task prefill
	// through the separate `prefill` prop instead, so this form still submits as a create.
	task?: any;
	// Prefilled field values for a new task - from Duplicate (copyFromTaskId set) or nothing more
	// than a parent-task link (Add sub-task, via defaultParentId alone).
	prefill?: {
		title?: string;
		description?: string;
		dueDate?: Date | null;
		source?: string | null;
		sourceLink?: string | null;
		assignedToUser?: { id: string; firstName: string; lastName: string } | null;
	};
	eligibleParents?: EligibleParentTask[];
	defaultParentId?: number | null;
	defaultChecklistItems?: ChecklistItemDraft[];
	checklistTemplates?: ChecklistTemplateOption[];
	copyFromTaskId?: number;
	dueDateWasNotCopied?: boolean;
	notice?: string;
}

const TaskForm = ({ users, task, prefill, eligibleParents = [], defaultParentId = null, defaultChecklistItems, checklistTemplates, copyFromTaskId, dueDateWasNotCopied, notice }: Props) => {
	const isEditing = !!task?.id;
	const values = task ?? prefill ?? {};

	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(values.dueDate ? new Date(values.dueDate) : null);
	const [parentId, setParentId] = useState<number | null>(defaultParentId);
	const [formState, formAction] = useActionState(submitTask, initialState);

	// Non-blocking heads-up when a sub-task's due date is later than its parent's - the rule is to
	// warn, not to refuse the save.
	const selectedParent = eligibleParents.find((p) => p.id === parentId);
	const dueAfterParent = !!(selectedDate && selectedParent && selectedDate > new Date(selectedParent.dueDate));

	return (
		<Card className="container mx-auto max-w-4xl px-3 py-3 md:px-8 md:py-6">
			<div className="container mx-auto max-w-4xl p-0">
				<h1 className="mb-4 md:mb-8 text-2xl md:text-3xl font-bold">{isEditing ? "Edit Task" : copyFromTaskId ? "New Task (copied)" : "New Task"}</h1>
				{notice && (
					<Alert variant="default" className="mb-4 border-orange-400 text-orange-600 dark:text-orange-400">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>{notice}</AlertDescription>
					</Alert>
				)}
				<form className="space-y-3 md:space-y-6" action={formAction}>
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input name="title" placeholder="Enter task title" defaultValue={values.title ?? undefined} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<MarkdownEditor name="description" rows={8} placeholder="Enter task description" defaultValue={values.description ?? ""} maxLength={MAX_DESCRIPTION_LENGTH} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="flex md:justify-start">
							<div className="flex flex-col space-y-3 w-60">
								<Label htmlFor="dueDate">Due date</Label>
								<DatePicker onChange={setSelectedDate} defaultDate={values.dueDate ?? undefined} />
								<input type="hidden" name="dueDate" value={selectedDate?.toISOString() ?? ""} />
								{dueDateWasNotCopied && (
									<p className="text-sm text-orange-600 dark:text-orange-400">The original task&apos;s due date had passed, so it was not copied - pick a new one.</p>
								)}
							</div>
						</div>
						<div className="flex md:justify-end">
							<div className="flex flex-col space-y-3 w-60">
								<Label className="text-left" htmlFor="assignedUser">
									Assigned to
								</Label>
								<UsersSelection users={users} onChange={setSelectedUserId} defaultUser={values.assignedToUser ?? undefined} />
								{/* Hidden input fields ensures formData is submitted */}
								<input type="hidden" name="assignedToUserId" value={selectedUserId ?? ""} />
							</div>
						</div>
					</div>
					<div className="flex flex-col space-y-3">
						<Label htmlFor="parentId">
							Parent task <span className="font-normal text-muted-foreground">(optional)</span> - if this task is a sub-task
						</Label>
						<ParentTaskSelection tasks={eligibleParents} defaultParentId={defaultParentId} onChange={setParentId} />
					</div>
					{dueAfterParent && (
						<Alert variant="default" className="border-orange-400 text-orange-600 dark:text-orange-400" data-testid="due-after-parent-warning">
							<AlertTriangle className="h-4 w-4" />
							<AlertTitle>Due date is after the parent task&apos;s</AlertTitle>
							<AlertDescription>This due date is later than parent task #{selectedParent!.id}&apos;s. This is allowed, but you may want to align the dates.</AlertDescription>
						</Alert>
					)}
					<ChecklistEditor defaultItems={defaultChecklistItems} templates={checklistTemplates} />
					{copyFromTaskId && <input type="hidden" name="copyFromTaskId" value={copyFromTaskId} />}
					{/* Source fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="flex md:justify-start">
							<div className="flex flex-col space-y-3 w-60">
								<Label className="text-left" htmlFor="source">
									Source
								</Label>
								<Input name="source" placeholder="(optional) Task source" defaultValue={values.source ?? undefined} />
								{/* Hidden input fields ensures formData is submitted */}
								<input type="hidden" name="source" value={values.source ?? ""} />
							</div>
						</div>
						<div className="flex md:justify-end">
							<div className="flex flex-col space-y-3 w-60">
								<Label className="text-left" htmlFor="sourceLink">
									Source link
								</Label>
								<Input name="sourceLink" placeholder="(optional) Source link" defaultValue={values.sourceLink ?? undefined} />
								{/* Hidden input fields ensures formData is submitted */}
								<input type="hidden" name="sourceLink" value={values.sourceLink ?? ""} />
							</div>
						</div>
					</div>
					{/* Show list of attachments and option to remove them */}
					{isEditing ? (
						<AttachmentsUpload taskId={task.id} taskAttachments={task.attachments.filter((a: TaskAttachments) => a.type === "source")} type="source" />
					) : (
						<div className="space-y-2">
							<div>
								<Label className="text-left text-orange-600 dark:text-orange-400" htmlFor="sourceAttachment">
									{copyFromTaskId
										? "Source attachments were copied from the original task. To add more, edit this task after creation."
										: "To add source attachments, edit the task after creation."}
								</Label>
							</div>
						</div>
					)}
					{formState?.message && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Task could not be saved</AlertTitle>
							<AlertDescription>{formState?.message}</AlertDescription>
						</Alert>
					)}
					<div className="flex justify-between">
						<div className="flex justify-center md:justify-end">
							<Button asChild>
								<Link href={`/tasks/${isEditing ? task.id : "?status=1%2C5%2C2"}`}>Cancel</Link>
							</Button>
						</div>
						<div className="flex justify-center md:justify-end">
							<SubmitButton isEditing={isEditing} />
						</div>
					</div>
					{isEditing && <input type="hidden" name="taskId" value={task.id} />}
				</form>
			</div>
		</Card>
	);
};

// Button component that uses useFormStatus to be able to access the pending state
function SubmitButton({ isEditing }: { isEditing: boolean }) {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending}>
			{pending ? "Saving..." : isEditing ? "Save Task" : "Create Task"}
		</Button>
	);
}

export default TaskForm;
