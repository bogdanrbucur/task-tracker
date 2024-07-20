import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

const PostCommentButton = () => {
	const { pending } = useFormStatus();
	return pending ? (
		<ButtonLoading />
	) : (
		<Button type="submit" size="sm" className="w-[130px]">
			Post Comment
		</Button>
	);
};

function ButtonLoading() {
	return (
		<Button disabled size="sm" className="w-[130px]">
			<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			Posting...
		</Button>
	);
}

export default PostCommentButton;
