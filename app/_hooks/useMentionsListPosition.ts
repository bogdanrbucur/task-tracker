import { useEffect } from "react";

const useMentionsListPosition = (
	isMentioning: boolean,
	textInputRef: React.RefObject<HTMLTextAreaElement>,
	mentionsListRef: React.RefObject<HTMLUListElement>,
	formRef: React.RefObject<HTMLFormElement>
) => {
	useEffect(() => {
		const updateMentionsListPosition = () => {
			if (!textInputRef.current || !mentionsListRef.current) return;

			const getCaretPixelPosition = (textarea: HTMLTextAreaElement) => {
				const computedStyle = window.getComputedStyle(textarea);
				const div = document.createElement("div");
				div.style.position = "absolute";
				div.style.visibility = "hidden";
				div.style.whiteSpace = "pre-wrap";
				div.style.wordWrap = "break-word";
				div.style.width = textarea.offsetWidth + "px";
				div.style.fontFamily = computedStyle.fontFamily;
				div.style.fontSize = computedStyle.fontSize;
				div.style.lineHeight = computedStyle.lineHeight;
				div.style.padding = computedStyle.padding;
				div.style.border = computedStyle.border;
				document.body.appendChild(div);
				const textUpToCaret = textarea.value.substring(0, textarea.selectionStart);
				div.textContent = textUpToCaret;
				const span = document.createElement("span");
				span.textContent = "\u200B";
				div.appendChild(span);
				const { offsetLeft: spanX, offsetTop: spanY } = span;
				document.body.removeChild(div);
				const textAreaRect = textarea.getBoundingClientRect();
				return {
					x: textAreaRect.left + window.scrollX + spanX - textarea.scrollLeft,
					y: textAreaRect.top + window.scrollY + spanY - textarea.scrollTop,
				};
			};

			const caretPos = getCaretPixelPosition(textInputRef.current);
			if (caretPos) {
				mentionsListRef.current.style.top = `${caretPos.y}px`;
				mentionsListRef.current.style.left = `${caretPos.x + window.scrollX + 5}px`;
			}
		};

		if (isMentioning) updateMentionsListPosition();
		window.addEventListener("resize", updateMentionsListPosition);
		textInputRef.current?.addEventListener("input", updateMentionsListPosition);

		return () => {
			window.removeEventListener("resize", updateMentionsListPosition);
			textInputRef.current?.removeEventListener("input", updateMentionsListPosition);
		};
	}, [isMentioning, textInputRef, mentionsListRef]);
};

export default useMentionsListPosition;
