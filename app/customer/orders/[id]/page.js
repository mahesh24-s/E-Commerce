"use client";

import RoleGuard from "@/components/guards/RoleGuard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OrderDetail from "@/components/shared/OrderDetail";

export default function CustomerOrderDetailPage() {
  return (
    <RoleGuard allowedRoles={["customer"]}>
      <DashboardLayout title="Order Details">
        <OrderDetail role="customer" />
      </DashboardLayout>
    </RoleGuard>
  );
}
