import { useState } from 'react';
import { Target, Pencil, PartyPopper } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useDailyStudyGoal } from '@/hooks/useDailyStudyGoal';

export function DailyGoalCard() {
  const { goalMinutes, todayMinutes, percent, achieved, remainingMinutes, setGoalMinutes } = useDailyStudyGoal();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goalMinutes));

  function startEditing() {
    setDraft(String(goalMinutes));
    setEditing(true);
  }

  function commit() {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) setGoalMinutes(n);
    setEditing(false);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-1.5">
          <Target size={15} /> Today&rsquo;s study goal
        </h2>
        {editing ? (
          <div className="flex items-center gap-1.5 text-sm">
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={600}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              aria-label="Daily study goal in minutes"
              className="w-16 rounded-lg border border-navy-200 dark:border-white/10 bg-transparent px-2 py-1 text-right tabular-nums focus:outline-none focus:border-electric-500"
            />
            <span className="text-navy-400 dark:text-ink-500">min</span>
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-xs text-navy-400 dark:text-ink-500 hover:text-electric-500 transition-colors"
          >
            <Pencil size={11} /> {goalMinutes} min goal
          </button>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <p className="text-2xl font-display font-semibold tabular-nums">
          {todayMinutes}
          <span className="text-navy-400 dark:text-ink-500 text-base font-normal"> / {goalMinutes} min</span>
        </p>
        {achieved ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
            <PartyPopper size={13} /> Goal hit!
          </span>
        ) : (
          <span className="text-xs text-navy-400 dark:text-ink-500">{remainingMinutes} min to go</span>
        )}
      </div>

      <div
        className="h-2 w-full rounded-full bg-navy-100 dark:bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={todayMinutes}
        aria-valuemin={0}
        aria-valuemax={goalMinutes}
        aria-label="Today's study progress"
      >
        <div
          className={achieved ? 'h-full rounded-full bg-emerald-500 transition-all duration-500' : 'h-full rounded-full gradient-brand transition-all duration-500'}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[11px] text-navy-400 dark:text-ink-500 mt-3">
        Counts real time from Focus Mode and completed Pomodoro sessions today. Set your own target — tap the goal to change it.
      </p>
    </Card>
  );
}
