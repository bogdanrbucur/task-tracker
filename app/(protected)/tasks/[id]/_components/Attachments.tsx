import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import getTaskAttachments from "../../_actions/getTaskAttachments";

async function Attachments(taskId: number) {
	// const initialTaskAttachments = await getTaskAttachments(taskId);
	const [attachments, setAttachments] = useState((await getTaskAttachments(taskId)) || []);
	const [descriptions, setDescriptions] = useState<string[]>([]);
	const [newDescription, setNewDescription] = useState<string>("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [attachmentError, setAttachmentError] = useState<string | null>(null);

	// Get the actual descriptions from each attachment
	useEffect(() => {
		const descriptions = attachments.map((attachment) => attachment.description);
		setDescriptions(descriptions as string[]);
	}, []);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files && files.length > 0) {
			setSelectedFile(files[0]);
		}
	};

	const handleAddAttachment = async () => {
		if (selectedFile && newDescription) {
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("description", newDescription);

			try {
				const response = await fetch(`/api/attachments?id=${taskId}&type=source`, {
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
				setAttachments(updatedAttachments);
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
		setAttachments(updatedAttachments);
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
		setAttachments(updatedAttachments);
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
					Source Attachments
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
					/>
					<Button className="bg-red-400 text-sm max-w-16" type="button" size="sm" onClick={() => handleRemoveAttachment(index)}>
						Remove
					</Button>
				</div>
			))}
			<div className="text-sm">Add attachment</div>
			<div className="grid grid-cols-3 gap-5">
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

export default Attachments;
