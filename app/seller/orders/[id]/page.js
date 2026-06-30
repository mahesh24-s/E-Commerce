"use client";

import RoleGuard from "@/components/guards/RoleGuard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OrderDetail from "@/components/shared/OrderDetail";

export default function SellerOrderDetailPage() {
  return (
    <RoleGuard allowedRoles={["seller"]}>
      <DashboardLayout title="Order Details">
        <OrderDetail role="seller" />
      </DashboardLayout>
    </RoleGuard>
  );
}
