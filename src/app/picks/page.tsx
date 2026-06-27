import { redirect } from "next/navigation";

export default function PicksPage() {
  redirect("/groups?tab=picks");
}
