import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import getTaskAttachments from "../../_actions/getTaskAttachments";

export interface TaskAttachments {
	id: string;
	taskId: number;
	path: string;
	description: string | null;
	time: Date;
	type: string;
}

// Constants for attachment restrictions
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Component for uploading and managing attachments
export default function AttachmentsUpload({ taskId, taskAttachments, type }: { taskId: number; taskAttachments: TaskAttachments[]; type: "source" | "completion" }) {
	const [attachments, setAttachments] = useState(taskAttachments || []);
	const [descriptions, setDescriptions] = useState<string[]>([]);
	const [newDescription, setNewDescription] = useState<string>("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [attachmentError, setAttachmentError] = useState<string | null>(null);

	// Get the actual descriptions from each attachment
	useEffect(() => {
		const descriptions = taskAttachments.map((attachment) => attachment.description);
		setDescriptions(descriptions as string[]);
	}, []);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files && files.length > 0) {
			const file = files[0];

			// Check if the number of attachments exceeds the maximum allowed
			if (attachments.length >= MAX_ATTACHMENTS) {
				setAttachmentError(`You can only upload up to ${MAX_ATTACHMENTS} attachments.`);
				return;
			}

			// Check if the file size exceeds the maximum allowed size
			if (file.size > MAX_FILE_SIZE_BYTES) {
				setAttachmentError(`File size must not exceed ${MAX_FILE_SIZE_MB} MB.`);
				return;
			}

			setSelectedFile(file);
			setAttachmentError(null); // Clear any previous errors
		}
	};

	const handleAddAttachment = async () => {
		if (selectedFile && newDescription) {
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("description", newDescription);

			try {
				const response = await fetch(`/api/attachments?id=${taskId}&type=${type}`, {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error(response.statusText);
				}

				const data = (await response.json()) as {
					id: string;
					path: string;
					description: string | null;
				};
				console.log("File uploaded successfully:", data);
				const updatedAttachments = await getTaskAttachments(taskId);
				setAttachments(updatedAttachments.filter((a) => a.type === type));
				setDescriptions([...descriptions, newDescription]);
				setNewDescription(""); // Reset the new description input
				setSelectedFile(null); // Reset the selected file input
				if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the file input
				setAttachmentError(null);
			} catch (error) {
				console.error("Error uploading file:", error);
				setAttachmentError(`Error uploading file ${selectedFile?.name}: ${error}`);
			}
		}
	};

	const handleDescriptionChange = (index: number, newDescription: string) => {
		const updatedDescriptions = [...descriptions];
		updatedDescriptions[index] = newDescription;
		setDescriptions(updatedDescriptions);

		const updatedAttachments = [...attachments];
		updatedAttachments[index].description = newDescription;
		setAttachments(updatedAttachments.filter((a) => a.type === type));
	};

	const handleRemoveAttachment = async (index: number) => {
		const updatedDescriptions = descriptions.filter((_, i) => i !== index);
		try {
			const response = await fetch(`/api/attachments/${attachments[index].id}/remove`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(response.statusText);
			}
			setAttachmentError(null);
		} catch (error) {
			console.error("Error deleting file:", error);
			setAttachmentError(`Error deleting file ${selectedFile?.name}: ${error}`);
		}

		const updatedAttachments = await getTaskAttachments(taskId);
		setAttachments(updatedAttachments.filter((a) => a.type === type));
		setDescriptions(updatedDescriptions);
	};
	return (
		<div className="space-y-2">
			{attachmentError && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Attachment Error</AlertTitle>
					<AlertDescription>{attachmentError}</AlertDescription>
				</Alert>
			)}
			<div>
				<Label className="text-left" htmlFor="sourceAttachment">
					{type === "source" ? "Source" : type === "completion" ? "Completion" : null} attachments
				</Label>
			</div>
			{attachments.map((attachment, index: number) => (
				<div key={attachment.id} className="grid grid-cols-3 gap-5">
					<div className="text-muted-foreground text-sm">{attachment.path}</div>
					<Input
						type="text"
						placeholder="Description"
						defaultValue={attachment.description as string}
						onChange={(e) => handleDescriptionChange(index, e.target.value)}
						required
						disabled={type === "completion"}
					/>
					<Button className="bg-red-400 text-sm max-w-16" type="button" size="sm" onClick={() => handleRemoveAttachment(index)}>
						Remove
					</Button>
				</div>
			))}
			<div className="text-sm">Add attachment</div>
			<div className="grid grid-cols-3 gap-5 items-center">
				<Input className="space-y-3 w-60" type="file" accept="*" onChange={handleFileChange} ref={fileInputRef} />
				<Input
					className=""
					name="newDescription"
					type="text"
					placeholder="Description for new attachment"
					value={newDescription}
					onChange={(e) => setNewDescription(e.target.value)}
				/>
				<input type="hidden" name="sourceAttachmentsDescriptions" value={descriptions} />
				<Button className="text-sm max-w-16" type="button" size="sm" onClick={handleAddAttachment}>
					Add
				</Button>
			</div>
		</div>
	);
}
