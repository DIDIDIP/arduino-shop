import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import CheckoutForm from "@/components/cart/CheckoutForm";

export const metadata = { title: "주문/결제" };

export default async function CheckoutPage() {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?next=/checkout");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">주문/결제</h1>
      <CheckoutForm userId={user.id} email={user.email ?? ""} defaultName={profile?.name ?? ""} defaultPhone={profile?.phone ?? ""} />
    </div>
  );
}
