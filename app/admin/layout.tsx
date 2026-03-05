import "@/src/crm/admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-admin">{children}</div>;
}
