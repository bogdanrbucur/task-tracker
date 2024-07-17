import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
	return (
		<main className="flex flex-col justify-center items-center">
			<div className="flex flex-col items-center gap-12 mt-28">
				<h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight text-center">Our robots searched, but could not find the page you're looking for.</h3>
				<Image src="/404.png" width={300} height={300} alt="404 Not Found" />
				<Link href="/" className="scroll-m-20 text-xl font-semibold tracking-tight text-muted-foreground hover:text-foreground">
					Let's go home
				</Link>
			</div>
		</main>
	);
}
