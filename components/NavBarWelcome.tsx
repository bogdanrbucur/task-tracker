import { UserExtended } from "@/app/users/_actions/getUserById";
import Link from "next/link";

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
	if (hours > 5 && hours < 11) {
		// if it's friday
		if (day === 5) occasion = "friday morning";
		else occasion = "morning";
	} else if (hours >= 11 && hours < 17) {
		// if it's friday
		if (day === 5) occasion = "friday afternoon";
		else occasion = "afternoon";
	} else if ((hours >= 17 && hours <= 23) || hours === 23) {
		// if it's friday
		if (day === 5) occasion = "friday evening";
		else occasion = "evening";
	} else {
		// if it's friday
		if (day === 5) occasion = "friday night";
		else occasion = "night";
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
	case "night":
		timeOfDay = { greeting: "Starry night", emoji: "✨" };
		break;
	case "friday night":
		timeOfDay = { greeting: "Starry night", emoji: "✨" };
		break;
	default:
		break;
}

const NavBarWelcome = ({ userProps }: { userProps: UserExtended | undefined }) => {
	if (!userProps) return null;

	return (
		<div className="text-sm md:text-base">
			{timeOfDay.greeting}{" "}
			<Link className="hover:text-gray-500" href={`/users/${userProps.id}`}>
				{userProps.firstName}
			</Link>{" "}
			<span className="">{timeOfDay.emoji}</span>
		</div>
	);
};

export default NavBarWelcome;
