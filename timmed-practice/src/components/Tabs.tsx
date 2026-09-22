export type TabKey = "stopwatch" | "timer" | "practice";

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "stopwatch", label: "Stopwatch" },
  { key: "timer", label: "Timer" },
  { key: "practice", label: "Practice Session" },
];

/**
 * Switching tabs does not stop whatever is running on another tab (e.g. a
 * Timer left beeping while you check the Stopwatch) — each tab's panel
 * stays mounted (see App.tsx), only its visibility toggles.
 */
export function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Mode">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={`tabs__item ${active === tab.key ? "tabs__item--active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
