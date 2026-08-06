"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Full-screen image overlay. Click anywhere outside the image, or press Escape, to close.
 * Extracted from AttachmentsList so inline description images can reuse the same behaviour.
 */
export function ImageLightboxOverlay({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<div className="z-50 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
			<div className="relative" onClick={(e) => e.stopPropagation()}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={src} alt={alt || "Image"} className="max-w-[85vw] max-h-[85vh] rounded-xl fade-in" />
				<button onClick={onClose} className="absolute top-0 right-0 m-2 text-white bg-black bg-opacity-80 rounded-full py-1 px-2">
					Close
				</button>
			</div>
		</div>
	);
}

/** An inline image that opens in the lightbox when clicked. Used for images embedded in markdown. */
export default function LightboxImage({ src, alt }: { src?: string; alt?: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const close = useCallback(() => setIsOpen(false), []);

	// urlTransform blocks disallowed sources by emptying the src - fall back to the alt text
	if (!src) return <span className="text-muted-foreground italic">{alt || "image"}</span>;

	return (
		<>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={alt || ""}
				loading="lazy"
				onClick={() => setIsOpen(true)}
				className="max-w-full h-auto rounded-md border border-border cursor-zoom-in my-2"
			/>
			{isOpen && <ImageLightboxOverlay src={src} alt={alt} onClose={close} />}
		</>
	);
}
