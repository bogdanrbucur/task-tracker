import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

const PostCommentButton = () => {
	const { pending } = useFormStatus();
	return !pending ? (
		<Button type="submit" size="sm" className="w-[130px]">
			Post Comment
		</Button>
	) : (
		<ButtonLoading />
	);
};

function ButtonLoading() {
	return (
		<Button disabled size="sm">
			<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			Posting...
		</Button>
	);
}

export default PostCommentButton;
