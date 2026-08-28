// Whether the password sign-in form is offered at all. Defaults to on: password auth requires no
// setup, so an unset flag must never lock everyone out. Only an explicit "false" turns it off -
// meant for once M365 is rolled out and password login is retired.
export function isPasswordAuthEnabled(): boolean {
	return process.env.PASSWORD_AUTH_ENABLED !== "false";
}
