"use client";

import { agenda } from "@/data/agenda";
import TimelineStop from "./TimelineStop";

export default function AgendaTab() {
  return (
    <div className="roadmap">
      <div className="road-spine"></div>

      {/* ══ DAY 1 ══ */}
      <div className="day-marker">
        <div className="day-marker-inner">{agenda.day1.title}</div>
      </div>

      {agenda.day1.stops.map((stop) => (
        <TimelineStop key={stop.id} stop={stop} />
      ))}

      {/* ══ DAY 2 ══ */}
      <div className="day-marker">
        <div className="day-marker-inner">{agenda.day2.title}</div>
      </div>

      {agenda.day2.stops.map((stop) => (
        <TimelineStop key={stop.id} stop={stop} />
      ))}

      {/* End Flag */}
      <div className="end-flag">
        <div className="flag-pole"></div>
        <div className="flag-icon">End of Trip · Safe Travels!</div>
      </div>
    </div>
  );
}
