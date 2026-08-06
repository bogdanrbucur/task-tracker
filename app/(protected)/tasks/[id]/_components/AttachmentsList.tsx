"use client";
import { ImageLightboxOverlay } from "@/components/ImageLightbox";
import { useState } from "react";

const isPhoto = (fileName: string) => {
	const photoExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
	const fileExtension = fileName.split(".").pop()?.toLowerCase();
	return photoExtensions.includes(fileExtension || "");
};

interface Attachment {
	id: string;
	taskId: number;
	path: string;
	description: string | null;
	time: Date;
	type: string;
}

export default function AttachmentList({ attachments }: { attachments: Attachment[] }) {
	const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

	const handlePhotoClick = (photoUrl: string) => {
		setSelectedPhoto(photoUrl);
	};

	const handleClosePopup = () => {
		setSelectedPhoto(null);
	};

	return (
		<div>
			{attachments.map((att) => (
				<div key={att.id}>
					{isPhoto(att.path) ? (
						<span onClick={() => handlePhotoClick(`/api/attachments/${att.id}`)} className="text-blue-600 hover:underline cursor-pointer">
							{att.description}
						</span>
					) : (
						<a href={`/api/attachments/${att.id}`} target="_blank" className="text-blue-600 hover:underline" data-testid="completion-attachment">
							{att.description}
						</a>
					)}
				</div>
			))}

			{selectedPhoto && <ImageLightboxOverlay src={selectedPhoto} alt="Source attachment" onClose={handleClosePopup} />}
		</div>
	);
}
