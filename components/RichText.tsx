import LightboxImage from "@/components/ImageLightbox";
import { DESCRIPTION_IMAGE_URL_PREFIX } from "@/lib/richText";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/**
 * The single rendering surface for user-authored markdown.
 *
 * Raw HTML is never rendered: react-markdown ignores it unless `rehype-raw` is added,
 * so user input cannot inject markup and no sanitiser is required. Do not add rehype-raw.
 *
 * `remark-breaks` turns single newlines into line breaks, which is what makes the existing
 * plain-text descriptions render exactly as they did under `whitespace-pre-wrap`.
 */

// Only these protocols may appear in a link. Anything else (javascript:, data:, file:) is dropped.
const ALLOWED_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];

function transformUrl(url: string, key: string): string {
	if (key === "src") {
		// Images may only come from our own auth-gated route. This blocks remote hosts being used
		// as tracking pixels and blocks data: URIs.
		return url.startsWith(DESCRIPTION_IMAGE_URL_PREFIX) ? url : "";
	}

	// Relative links (no protocol) stay within the app and are safe
	if (url.startsWith("/") || url.startsWith("#")) return url;

	try {
		const protocol = new URL(url, "https://relative.invalid").protocol;
		return ALLOWED_LINK_PROTOCOLS.includes(protocol) ? url : "";
	} catch {
		return "";
	}
}

export default function RichText({ source, className }: { source: string; className?: string }) {
	return (
		<div
			className={cn(
				// min-w-0 is required: without it a grid/flex ancestor sizes itself to the intrinsic
				// width of a wide table or code block, overflowing the page instead of scrolling
				"prose prose-sm md:prose-base dark:prose-invert max-w-none min-w-0 break-words",
				// Preserve the muted body colour the plain-text description used to have
				"prose-p:text-gray-500 dark:prose-p:text-gray-400 prose-li:text-gray-500 dark:prose-li:text-gray-400",
				className
			)}
		>
			<Markdown
				remarkPlugins={[remarkGfm, remarkBreaks]}
				urlTransform={transformUrl}
				components={{
					a: ({ href, children }) =>
						href ? (
							<a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-600 hover:underline">
								{children}
							</a>
						) : (
							<span>{children}</span>
						),
					img: ({ src, alt }) => <LightboxImage src={typeof src === "string" ? src : undefined} alt={alt} />,
					// Wide tables scroll inside their own container instead of breaking the page layout on mobile
					table: ({ children }) => (
						<div className="overflow-x-auto">
							<table>{children}</table>
						</div>
					),
					pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
				}}
			>
				{source}
			</Markdown>
		</div>
	);
}
