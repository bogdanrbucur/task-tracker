import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import EditDeptButton from "./EditDeptButton";

const DepartmentsTopSection = async () => {
	const { user } = await getAuth();

	const userPermissions = await getPermissions(user?.id);

	return <div className="flex justify-end py-3">{userPermissions?.isAdmin && <EditDeptButton />}</div>;
};

export default DepartmentsTopSection;
