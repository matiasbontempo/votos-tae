import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminState } from "@/lib/admin-data";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm />;

  return <AdminDashboard initialState={await getAdminState()} />;
}
