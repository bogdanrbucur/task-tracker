import { getVersion } from "@/lib/getVersion";
import { Github, Globe, Linkedin, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
	const version = getVersion();
	return (
		<footer className="flex items-center h-7 px-4">
			<div className="flex text-left text-xs text-muted-foreground items-center">
				<svg height="9" width="9" className="mr-1">
					<circle cx="4" cy="4" r="4" fill={process.env.DEPLOYMENT} />
				</svg>
				{version}
			</div>
			<div className="flex justify-center items-center space-x-2 mx-auto">
				<div className="flex text-xs gap-1 items-center">
					Proudly made in
					<div>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32">
							<path fill="#f6d44a" d="M10 4H22V28H10z"></path>
							<path d="M5,4h6V28H5c-2.208,0-4-1.792-4-4V8c0-2.208,1.792-4,4-4Z" fill="#0c267b"></path>
							<path d="M25,4h6V28h-6c-2.208,0-4-1.792-4-4V8c0-2.208,1.792-4,4-4Z" transform="rotate(180 26 16)" fill="#be2a2c"></path>
							<path
								d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z"
								opacity=".15"
							></path>
							<path d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z" fill="#fff" opacity=".2"></path>
						</svg>
					</div>
				</div>
				{/* <Link href="https://tetrabit.dev" target="_blank">
					<Globe size="16" />
				</Link> */}
				<Link href="https://github.com/bogdanrbucur" target="_blank">
					<Github size="16" />
				</Link>
				<Link href="https://www.linkedin.com/in/bogdan-bucur-60a9b4189" target="_blank">
					<Linkedin size="16" />
				</Link>
				<Link href="mailto:bogdanrbucur@gmail.com">
					<Mail size="16" />
				</Link>
			</div>
		</footer>
	);
}
