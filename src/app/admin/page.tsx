import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
export const metadata: Metadata = { title: "Admin" };
export default function AdminPage() { return <div className="page-container subpage"><div className="subpage-heading"><p className="eyebrow">CONTENT CONTROL</p><h1>Admin <em>studio.</em></h1><p>Manage reviewed offers and record source-backed price observations.</p></div><AdminDashboard /></div>; }
