import { PomodoroWidgetCompact } from './PomodoroWidgetCompact';
import { TimeStatsWidgetCompact } from './TimeStatsWidgetCompact';

export function TopWidgetsSection() {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-3">
        <PomodoroWidgetCompact />
        <TimeStatsWidgetCompact />
      </div>
    </div>
  );
}