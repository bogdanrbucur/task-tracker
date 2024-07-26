(async () => {
	const { Argon2id } = await import("oslo/password");

	const pass = "P@sw0rd123";

	async function hash(pass) {
		const hashed = await new Argon2id().hash(pass);
		return hashed;
	}

	const hashed = await hash(pass);
	console.log(hashed);
})();
