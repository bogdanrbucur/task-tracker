import { Skeleton } from "@/components/ui/skeleton";
import { useFormStatus } from "react-dom";

const CommentSkeleton = () => {
	const { pending } = useFormStatus();

	return pending ? (
		<div className="flex items-start gap-4">
			<Skeleton className="h-10 w-10 rounded-full mb-1" />
			<div className="flex-1 space-y-2">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-[110px] md:w-[150px]" />
					<Skeleton className="h-3 w-[110px] md:w-[110px]" />
				</div>
				<Skeleton className="h-4 w-[230px] md:w-[250px]" />
			</div>
		</div>
	) : null;
};

export default CommentSkeleton;
