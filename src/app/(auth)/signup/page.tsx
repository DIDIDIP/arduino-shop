import { Suspense } from "react";
import AuthForm from "@/components/layout/AuthForm";

export const metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
