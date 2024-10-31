import getVersion from "../lib/getVersion";

export default function Home() {
	const version = getVersion();

	return (
		<div>
			<h1>Welcome to Task Tracker</h1>
			<p>Version: {version}</p>
		</div>
	);
}
