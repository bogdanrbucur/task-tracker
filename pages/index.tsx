import { GetStaticProps } from "next";
import { getVersion } from "../lib/getVersion";

interface HomeProps {
	version: string;
}

export const getStaticProps: GetStaticProps = async () => {
	const version = getVersion();
	return {
		props: {
			version,
		},
	};
};

const Home: React.FC<HomeProps> = ({ version }) => {
	return (
		<div>
			<h1>Welcome to Task Tracker</h1>
			<p>Version: {version}</p>
		</div>
	);
};

export default Home;
