"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/types";

const OPTIONS: OrderStatus[] = ["paid", "shipping", "delivered", "cancelled"];

export default function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  return (
    <select
      value={value}
      disabled={saving}
      onChange={async (e) => {
        const next = e.target.value as OrderStatus;
        setSaving(true);
        const { error } = await createClient().from("orders").update({ status: next }).eq("id", orderId);
        setSaving(false);
        if (!error) {
          setValue(next);
          router.refresh();
        }
      }}
      className="input w-auto py-1.5"
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
      ))}
    </select>
  );
}
