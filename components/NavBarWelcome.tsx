import { UserDetails } from "@/app/users/getUserById";

// determine the time of day: morning, noon or evening
const date = new Date();
const hours = date.getHours();
let timeOfDay: { greeting: string; emoji: string } = { greeting: "", emoji: "" };

if (hours < 11) {
	timeOfDay = { greeting: "Good morning", emoji: "🌞" };
} else if (hours >= 11 && hours < 17) {
	timeOfDay = { greeting: "Good day", emoji: "🌞" };
} else {
	timeOfDay = { greeting: "Good evening", emoji: "🌛" };
}

const NavBarWelcome = ({ userProps }: { userProps: UserDetails | undefined }) => {
	if (!userProps) return null;

	// TODO click on the user's name to go to their profile
	//
	return (
		<div className="text-sm md:text-base">
			{timeOfDay.greeting}, {userProps.firstName} <span className="hidden md:inline">{timeOfDay.emoji}</span>
		</div>
	);
};

export default NavBarWelcome;
