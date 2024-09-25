"use client";
import { DatePicker } from "@/app/(protected)/tasks/new/_components/DatePicker";
import { UserExtended } from "@/app/users/_actions/getUserById";
import { UsersSelection } from "@/components/UsersSelection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucia";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import { useFormState } from "react-dom";
import submitTask from "../../new/_actions/submitTask";

const initialState = {
	message: null,
};

const TaskForm = ({ users, user, task }: { users: UserExtended[]; user: User; task?: any }) => {
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [formState, formAction] = useFormState(submitTask, initialState);
	const [attachments, setAttachments] = useState(task?.attachments || []);

	// const handleDescriptionChange = (index: number, value: string) => {
	// 	const newAttachments = [...attachments];
	// 	newAttachments[index].description = value;
	// 	setAttachments(newAttachments);
	// };

	const handleRemoveAttachment = async (index: number): Promise<void> => {
		setAttachments(attachments.filter((_: any, i: number) => i !== index));
		try {
			await fetch(`/api/attachments/${attachments[index].id}/remove`, {
				method: "DELETE",
			});
		} catch (err) {
			console.error(err);
		}
	};

	const handleAddAttachment = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const files = event.target.files ? Array.from(event.target.files) : [];
		const newAttachments = files.map((file, index) => ({
			path: file.name,
			file,
			description: "",
		}));
		setAttachments(newAttachments);
	};

	return (
		<Card className="container mx-auto max-w-4xl px-3 py-3 md:px-8 md:py-6">
			<div className="container mx-auto max-w-4xl p-0">
				<h1 className="mb-4 md:mb-8 text-2xl md:text-3xl font-bold">{task ? "Edit Task" : "New Task"}</h1>
				<form className="space-y-3 md:space-y-6" action={formAction}>
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input name="title" placeholder="Enter task title" defaultValue={task ? task.title : undefined} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea name="description" rows={8} placeholder="Enter task description" defaultValue={task ? task.description : undefined} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="flex md:justify-start">
							<div className="flex flex-col space-y-3 w-60">
								<Label htmlFor="dueDate">Due Date</Label>
								<DatePicker onChange={setSelectedDate} defaultDate={task?.dueDate} />
								<input type="hidden" name="dueDate" value={selectedDate?.toISOString() ?? ""} />
							</div>
						</div>
						<div className="flex md:justify-end">
							<div className="flex flex-col space-y-3 w-60">
								<Label className="text-left" htmlFor="assignedUser">
									Assigned To
								</Label>
								<UsersSelection users={users} onChange={setSelectedUserId} defaultUser={task?.assignedToUser} />
								{/* Hidden input fields ensures formData is submitted */}
								<input type="hidden" name="assignedToUserId" value={selectedUserId ?? ""} />
							</div>
						</div>
					</div>
					{/* Source fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="flex md:justify-start">
							<div className="flex flex-col space-y-3 w-60">
								<Label className="text-left" htmlFor="source">
									Source
								</Label>
								<Input name="source" placeholder="(optional) Task source" defaultValue={task ? task.source : undefined} />
								{/* Hidden input fields ensures formData is submitted */}
								<input type="hidden" name="source" value={task ? task.source : ""} />
							</div>
						</div>
						<div className="flex md:justify-end">
							<div className="flex flex-col space-y-3 w-60">
								<Label className="text-left" htmlFor="sourceLink">
									Source Link
								</Label>
								<Input name="sourceLink" placeholder="(optional) Source link" defaultValue={task ? task.sourceLink : undefined} />
								{/* Hidden input fields ensures formData is submitted */}
								<input type="hidden" name="sourceLink" value={task ? task.sourceLink : ""} />
							</div>
						</div>
					</div>
					{/* TODO show list of attachments and option to remove them */}
					<div className="space-y-2">
						<div>
							<Label className="text-left" htmlFor="sourceAttachment">
								Source Attachments
							</Label>
						</div>
						{attachments.map((attachment: { id: Key | null | undefined; path: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; description: string | number | readonly string[] | undefined; }, index: number) => (
							<div key={attachment.id} className="grid grid-cols-3 gap-5">
								<div className="text-muted-foreground text-sm">{attachment.path}</div>
								{/* <Input
									name={`sourceAttDesc${index}`}
									placeholder="Description"
									defaultValue={attachment.description}
									onChange={(e) => handleDescriptionChange(index, e.target.value)}
								/>{" "} */}
								<Button className="bg-red-400 text-sm max-w-16" type="button" size="sm" onClick={() => handleRemoveAttachment(index)}>
									Remove
								</Button>
							</div>
						))}
						<div className="text-sm">{attachments.length > 0 ? "Replace existing" : "Add"} attachments</div>
						<Input className="space-y-3 w-60" name="sourceAttachments" type="file" multiple accept="*" onChange={handleAddAttachment} />
					</div>
					{formState?.message && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Task could not be created</AlertTitle>
							<AlertDescription>{formState?.message}</AlertDescription>
						</Alert>
					)}
					<div className="flex justify-between">
						<div className="flex justify-center md:justify-end">
							<Button asChild>
								<Link href={`/tasks/${task?.id ? task.id : "?status=1%2C5%2C2"}`}>Cancel</Link>
							</Button>
						</div>
						<div className="flex justify-center md:justify-end">
							<Button type="submit">{task ? "Save Task" : "Create Task"}</Button>
						</div>
					</div>
					{task && <input type="hidden" name="taskId" value={task.id} />}
					<input type="hidden" name="editingUser" value={user.id} />
				</form>
			</div>
		</Card>
	);
};

export default TaskForm;
