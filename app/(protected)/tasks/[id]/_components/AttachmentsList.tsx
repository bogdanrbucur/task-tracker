"use client";
import { useEffect, useState } from "react";

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

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleClosePopup();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleClosePopup]);

	return (
		<div>
			{attachments.map((att) => (
				<div key={att.id}>
					{isPhoto(att.path) ? (
						<span onClick={() => handlePhotoClick(`/api/attachments/${att.id}`)} className="text-blue-600 hover:underline cursor-pointer">
							{att.description}
						</span>
					) : (
						<a href={`/api/attachments/${att.id}`} target="_blank" className="text-blue-600 hover:underline">
							{att.description}
						</a>
					)}
				</div>
			))}

			{selectedPhoto && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" onClick={handleClosePopup}>
					<div className="relative" onClick={(e) => e.stopPropagation()}>
						<img src={selectedPhoto} alt="Source attachment" className="max-w-[85vw] max-h-[85vh] rounded-xl fade-in" />
						<button onClick={handleClosePopup} className="absolute top-0 right-0 m-2 text-white bg-black bg-opacity-80 rounded-full py-1 px-2">
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
