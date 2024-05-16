import { UserDetails } from "@/app/users/getUserById";
import { time } from "console";

// determine the time of day: morning, noon or evening
const date = new Date();
const hours = date.getHours();
let timeOfDay: { greeting: string; emoji: string } = { greeting: "", emoji: "" };
let occasion = "";

// get the day of the week
const day = date.getDay();

// if it's christmas
if (date.getMonth() === 11 && date.getDate() === 25) occasion = "christmas";
// if it's new year
else if (date.getMonth() === 0 && date.getDate() === 1) occasion = "new year";
else {
	if (hours < 11) {
		// if it's friday
		if (day === 5) occasion = "friday morning";
		else occasion = "morning";
	} else if (hours >= 11 && hours < 17) {
		// if it's friday
		if (day === 5) occasion = "friday afternoon";
		else occasion = "afternoon";
	} else {
		// if it's friday
		if (day === 5) occasion = "friday evening";
		else occasion = "evening";
	}
}
switch (occasion) {
	case "christmas":
		timeOfDay = { greeting: "Merry Christmas", emoji: "🎄" };
		break;
	case "new year":
		timeOfDay = { greeting: "Happy New Year", emoji: "🎆" };
		break;
	case "friday morning":
		timeOfDay = { greeting: "Happy Friday", emoji: "🎉" };
		break;
	case "friday afternoon":
		timeOfDay = { greeting: "Happy Friday", emoji: "🎉" };
		break;
	case "friday evening":
		timeOfDay = { greeting: "Happy Friday", emoji: "🎉" };
		break;
	case "morning":
		timeOfDay = { greeting: "Good morning", emoji: "🌞" };
		break;
	case "afternoon":
		timeOfDay = { greeting: "Good day", emoji: "🌞" };
		break;
	case "evening":
		timeOfDay = { greeting: "Good evening", emoji: "🌛" };
		break;

	default:
		break;
}

const NavBarWelcome = ({ userProps }: { userProps: UserDetails | undefined }) => {
	if (!userProps) return null;

	// TODO click on the user's name to go to their profile
	//
	return (
		<div className="text-sm md:text-base">
			{timeOfDay.greeting} {userProps.firstName} <span className="">{timeOfDay.emoji}</span>
		</div>
	);
};

export default NavBarWelcome;
