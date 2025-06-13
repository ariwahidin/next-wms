import { LoginForm } from "@/components/ui/login-form";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("next-auth-token="))
    ?.split("=")[1];
  console.log("Next Auth Token:", cookie);
  if (cookie) {
    router.push("/wms/dashboard");
  }
  useEffect(() => {
    document.title = "WMS Login";
  });
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-6">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
