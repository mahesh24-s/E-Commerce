"use client";

import RoleGuard from "@/components/guards/RoleGuard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OrderDetail from "@/components/shared/OrderDetail";

export default function AdminOrderDetailPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardLayout title="Order Details">
        <OrderDetail role="admin" />
      </DashboardLayout>
    </RoleGuard>
  );
}
