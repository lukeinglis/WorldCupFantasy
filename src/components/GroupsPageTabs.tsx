"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

const TABS = [
  { id: "standings", label: "Standings", icon: "📊" },
  { id: "picks", label: "Picks", icon: "📋" },
  { id: "schedule", label: "Schedule", icon: "📅" },
  { id: "knockout", label: "Knockout", icon: "🏆" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function TabContent({
  standingsContent,
  picksContent,
  scheduleContent,
  knockoutContent,
}: {
  standingsContent: ReactNode;
  picksContent: ReactNode;
  scheduleContent: ReactNode;
  knockoutContent: ReactNode;
}) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "standings";

  const content: Record<TabId, ReactNode> = {
    standings: standingsContent,
    picks: picksContent,
    schedule: scheduleContent,
    knockout: knockoutContent,
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "standings" ? "/groups" : `/groups?tab=${tab.id}`}
            scroll={false}
            className={`font-heading rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all ${
              activeTab === tab.id
                ? "bg-pitch text-white shadow-lg shadow-pitch/20"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="mr-1.5" aria-hidden>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>

      <div>{content[activeTab]}</div>
    </div>
  );
}

export default function GroupsPageTabs(props: {
  standingsContent: ReactNode;
  picksContent: ReactNode;
  scheduleContent: ReactNode;
  knockoutContent: ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    }>
      <TabContent {...props} />
    </Suspense>
  );
}
