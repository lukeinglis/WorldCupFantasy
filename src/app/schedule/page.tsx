import { redirect } from "next/navigation";

export default function SchedulePage() {
  redirect("/groups?tab=schedule");
}
