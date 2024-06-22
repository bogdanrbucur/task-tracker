import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import EditDeptButton from "./EditDeptButton";

const DepartmentsTopSection = async () => {
	const { user } = await getAuth();

	const userPermissions = await getPermissions(user?.id);

	return <div className="flex justify-end py-3">{userPermissions?.isAdmin && <EditDeptButton />}</div>;
};

export default DepartmentsTopSection;
