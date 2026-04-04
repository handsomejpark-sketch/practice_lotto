import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginPageClient from "./login-page-client";

export default async function Page() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/play");
  }

  return <LoginPageClient />;
}
