import { redirect } from "next/navigation";
import { getCurrentUser, getDashboardPayload } from "@/lib/auth";
import PlayPageClient from "./play-page-client";

export default async function PlayPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const payload = await getDashboardPayload(user.id);

  return (
    <PlayPageClient
      initialHistory={payload.history}
      initialTickets={payload.tickets}
      user={user}
    />
  );
}
