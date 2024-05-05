import ProtectedWrapper from "./ProtectedWrapper";

export default function Home() {
	return (
		<ProtectedWrapper>
			<h1>Hello world!</h1>;
		</ProtectedWrapper>
	);
}
