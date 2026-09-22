import { useState } from "react";
import { Tabs, type TabKey } from "./components/Tabs";
import { StopwatchTab } from "./features/stopwatch/StopwatchTab";
import { TimerTab } from "./features/timer/TimerTab";
import { PracticeSessionTab } from "./features/practice/PracticeSessionTab";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("timer");

  return (
    <div className="app">
      <main className="card">
        <header className="card__header">
          <h1>Timed Practice</h1>
          <p className="subtitle">Stopwatch · Timer · Practice Session</p>
        </header>

        <Tabs active={activeTab} onChange={setActiveTab} />

        {/*
          Each panel stays mounted regardless of which tab is active, so a
          running Timer (or Practice Session) keeps counting down and
          beeping in the background even if you switch to another tab.
          Only the active panel is visible.
        */}
        <div className={activeTab === "stopwatch" ? "" : "tab-panel--hidden"}>
          <StopwatchTab />
        </div>
        <div className={activeTab === "timer" ? "" : "tab-panel--hidden"}>
          <TimerTab />
        </div>
        <div className={activeTab === "practice" ? "" : "tab-panel--hidden"}>
          <PracticeSessionTab />
        </div>
      </main>
    </div>
  );
}

export default App;
