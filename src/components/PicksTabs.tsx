"use client";

import { useState, type ReactNode } from "react";

interface PicksTabsProps {
  groupContent: ReactNode;
  bonusContent: ReactNode;
  bracketContent: ReactNode;
  participantsContent: ReactNode;
}

const TABS = [
  { id: "groups", label: "Group Predictions", icon: "📊" },
  { id: "bonus", label: "Bonus Picks", icon: "🎯" },
  { id: "bracket", label: "Knockout Bracket", icon: "🏆" },
  { id: "participants", label: "By Participant", icon: "👤" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PicksTabs({
  groupContent,
  bonusContent,
  bracketContent,
  participantsContent,
}: PicksTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("groups");

  const content: Record<TabId, ReactNode> = {
    groups: groupContent,
    bonus: bonusContent,
    bracket: bracketContent,
    participants: participantsContent,
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`font-heading rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all ${
              activeTab === tab.id
                ? "bg-pitch text-white shadow-lg shadow-pitch/20"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="mr-1.5" aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div>{content[activeTab]}</div>
    </div>
  );
}
