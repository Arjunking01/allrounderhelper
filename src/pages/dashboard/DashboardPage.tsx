import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Star, Clock, CheckSquare, StickyNote, Target, Hourglass,
  Timer as TimerIcon, FileCheck2, ArrowRight, Search, Flame,
  Plus, Quote as QuoteIcon, Pin, CalendarDays, Sparkles, Focus,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Logo } from '@/components/ui/Logo';
import { Card, SoftCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Reveal } from '@/components/ui/Reveal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { useRecentToolsStore } from '@/hooks/useRecentTools';
import { useCommandPaletteStore } from '@/lib/store/commandPalette';
import { getAllSearchableItems } from '@/data/allToolsRegistry';
import { quoteOfTheDay } from '@/data/motivationalQuotes';
import { WeeklyBarChart } from '@/features/dashboard/components/WeeklyBarChart';
import { MiniCalendarWidget } from '@/features/dashboard/components/MiniCalendarWidget';
import { computeAchievements } from '@/features/dashboard/logic/achievements';
import type { Task } from '@/features/productivity/logic/todoTypes';
import type { Note } from '@/features/productivity/logic/notesTypes';
import type { Goal } from '@/features/productivity/logic/goalTypes';
import type { Assignment } from '@/features/productivity/logic/assignmentTypes';
import type { Habit } from '@/features/productivity/logic/habitTypes';
import { currentStreak } from '@/features/productivity/logic/habitTypes';
import type { CountdownExam } from '@/features/productivity/logic/examCountdownTypes';
import { daysRemaining } from '@/features/productivity/logic/examCountdownTypes';
import type { HistoryEntry } from '@/hooks/useToolHistory';
import { useProductivityInsights } from '@/hooks/useProductivityInsights';
import { usePreferencesStore } from '@/lib/store/preferences';
import { getGreeting } from '@/lib/greeting';
import { useRecentConversations } from '@/features/ai/logic/useRecentConversations';
import { DailyGoalCard } from '@/features/dashboard/components/DailyGoalCard';
import { useWhatNext } from '@/features/productivity/logic/whatNext';

function todayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const QUICK_ACTIONS = [
  { label: 'Plan my day', href: '/productivity/plan-my-day', icon: Sparkles },
  { label: 'New task', href: '/productivity/todo-list', icon: CheckSquare },
  { label: 'New note', href: '/productivity/notes', icon: StickyNote },
  { label: 'Start focus session', href: '/productivity/focus-mode', icon: TimerIcon },
  { label: 'New goal', href: '/productivity/goal-tracker', icon: Target },
  { label: 'Open calendar', href: '/productivity/calendar', icon: CalendarDays },
  { label: 'Ask AI Assistant', href: '/ai-assistant', icon: Sparkles },
];

export default function DashboardPage() {
  const [tasks] = useLocalStorage<Task[]>('ar-todo-tasks', []);
  const [notes] = useLocalStorage<Note[]>('ar-notes', []);
  const [goals] = useLocalStorage<Goal[]>('ar-goals', []);
  const [exams] = useLocalStorage<CountdownExam[]>('ar-exam-countdowns', []);
  const [assignments] = useLocalStorage<Assignment[]>('ar-assignments', []);
  const [habits] = useLocalStorage<Habit[]>('ar-habits', []);
  const [pomodoroStats] = useLocalStorage<Record<string, number>>('ar-pomodoro-stats', {});
  const [focusSessions] = useLocalStorage<{ minutes: number; completedAt: string }[]>('ar-focus-sessions', []);
  const [docHistory] = useLocalStorage<HistoryEntry[]>('ar-doc-history', []);
  const { favorites } = useFavoriteTools();
  const [recentVisits] = useRecentToolsStore();
  const openCommandPalette = useCommandPaletteStore((s) => s.open);
  const insights = useProductivityInsights();
  const displayName = usePreferencesStore((s) => s.displayName);
  const dashboardGreeting = getGreeting(displayName).text;
  const recentConversations = useRecentConversations(5);
  const nextAction = useWhatNext();

  const allItems = useMemo(() => getAllSearchableItems(), []);
  const favoriteItems = useMemo(
    () => favorites.map((p) => allItems.find((i) => i.path === p)).filter((i): i is NonNullable<typeof i> => Boolean(i)),
    [favorites, allItems]
  );
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);
  const todaySessions = pomodoroStats[todayKey()] ?? 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(h)), 0);
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.minutes, 0);
  const pinnedNotes = notes.filter((n) => n.pinned);
  const quote = quoteOfTheDay();
  const mostRecentVisit = recentVisits[0];
  const mostRecentItem = mostRecentVisit ? allItems.find((i) => i.path === mostRecentVisit.path) : undefined;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = todayKey(d);
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1), value: pomodoroStats[key] ?? 0 };
  });

  const deadlineDates = new Set<string>();
  exams.forEach((e) => deadlineDates.add(e.date.slice(0, 10)));
  assignments.forEach((a) => a.dueDate && deadlineDates.add(a.dueDate.slice(0, 10)));
  goals.forEach((g) => g.deadline && deadlineDates.add(g.deadline.slice(0, 10)));

  interface DeadlineItem { id: string; label: string; date: string; kind: string }
  const deadlineItems: DeadlineItem[] = [
    ...exams.map((e): DeadlineItem => ({ id: `exam-${e.id}`, label: e.name, date: e.date, kind: 'Exam' })),
    ...assignments.filter((a) => a.status !== 'submitted' && a.dueDate).map((a): DeadlineItem => ({ id: `assign-${a.id}`, label: a.title, date: a.dueDate, kind: 'Assignment' })),
    ...goals.filter((g) => !g.completed && g.deadline).map((g): DeadlineItem => ({ id: `goal-${g.id}`, label: g.title, date: g.deadline!, kind: 'Goal' })),
  ].filter((d) => daysRemaining(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  const avgGoalProgress = activeGoals.length ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length) : 0;

  const achievements = computeAchievements({
    completedTasks: completedTasks.length,
    bestHabitStreak: bestStreak,
    totalFocusMinutes,
    notesCount: notes.length,
    completedGoals: completedGoals.length,
  });
  const earnedCount = achievements.filter((a) => a.earned).length;

  const hasAnyData = tasks.length > 0 || notes.length > 0 || goals.length > 0 || exams.length > 0 || assignments.length > 0 || favorites.length > 0 || recentVisits.length > 0;

  return (
    <div className="noise-bg min-h-[70vh]">
      <Seo title="Dashboard" description="Your personal ALLROUNDER HELPER overview — recent tools, favorites, tasks, goals, and study progress." path="/dashboard" noindex />

      {/* Welcome header */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size={48} className="shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">{dashboardGreeting}</h1>
            <p className="text-navy-500 dark:text-ink-400 text-sm">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2 rounded-full border border-navy-200 dark:border-white/10 px-4 py-2.5 text-sm text-navy-500 dark:text-ink-400 hover:border-electric-500 hover:text-electric-500 transition-colors w-full sm:w-auto justify-center"
        >
          <Search size={15} /> Search everything <kbd className="text-[10px] font-semibold border border-navy-200 dark:border-white/10 rounded px-1 ml-1">Ctrl K</kbd>
        </button>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 space-y-5">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} to={a.href} className="flex items-center gap-1.5 rounded-full border border-navy-200 dark:border-white/10 px-3.5 py-2 text-sm font-medium hover:border-electric-500 hover:text-electric-500 transition-colors">
              <Plus size={13} /> {a.label}
            </Link>
          ))}
        </div>

        {!hasAnyData ? (
          <Card>
            <EmptyState icon={LayoutDashboard} title="Your dashboard is ready to fill up" description="Use a few tools around the site and your recent activity, favorites, and progress will show up here automatically." />
          </Card>
        ) : (
          <>
            {/* Next Up \u2014 the deterministic "what should I do next" engine (whatNext.ts),
                shared with Daily Routine. Kept to one compact row \u2014 tapping it goes to the
                owning tool, the small focus icon starts a session, never both at once. */}
            {nextAction.kind !== 'plan' && (
              <Reveal>
                <Card className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <Link to={nextAction.path} className="flex-1 min-w-0">
                    <p className="text-xs text-navy-400 dark:text-ink-500 uppercase tracking-wide font-semibold">Next up</p>
                    <p className="font-semibold truncate hover:text-electric-500 transition-colors">{nextAction.title}</p>
                    <p className="text-xs text-navy-500 dark:text-ink-400 truncate">{nextAction.subtitle}</p>
                  </Link>
                  {nextAction.focusPath && (
                    <Link
                      to={nextAction.focusPath}
                      title="Start a focus session"
                      aria-label="Start a focus session for this"
                      className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-navy-200 dark:border-white/10 text-navy-400 dark:text-ink-500 hover:text-electric-500 hover:border-electric-500 transition-colors"
                    >
                      <Focus size={17} />
                    </Link>
                  )}
                </Card>
              </Reveal>
            )}

            {/* Continue where you left off */}
            {mostRecentItem && (
              <Reveal>
                <Link to={mostRecentItem.path} className="block">
                  <Card className="flex items-center gap-4 hover:border-electric-500 hover:-translate-y-0.5 transition-[color,background-color,border-color,transform] border border-transparent">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shrink-0">
                      <mostRecentItem.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-navy-400 dark:text-ink-500 uppercase tracking-wide font-semibold">Continue where you left off</p>
                      <p className="font-semibold truncate">{mostRecentItem.title}</p>
                    </div>
                    <ArrowRight size={18} className="text-navy-400 shrink-0" />
                  </Card>
                </Link>
              </Reveal>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Reveal index={0}>
                <SoftCard>
                  <p className="text-xs text-navy-500 dark:text-ink-500 mb-1 flex items-center gap-1.5"><CheckSquare size={13} /> Active tasks</p>
                  <p className="text-2xl font-display font-semibold"><AnimatedNumber value={activeTasks.length} /></p>
                </SoftCard>
              </Reveal>
              <Reveal index={1}>
                <SoftCard>
                  <p className="text-xs text-navy-500 dark:text-ink-500 mb-1 flex items-center gap-1.5"><TimerIcon size={13} /> Pomodoros today</p>
                  <p className="text-2xl font-display font-semibold"><AnimatedNumber value={todaySessions} /></p>
                </SoftCard>
              </Reveal>
              <Reveal index={2}>
                <SoftCard>
                  <p className="text-xs text-navy-500 dark:text-ink-500 mb-1 flex items-center gap-1.5"><Flame size={13} /> Best habit streak</p>
                  <p className="text-2xl font-display font-semibold"><AnimatedNumber value={bestStreak} suffix="d" /></p>
                </SoftCard>
              </Reveal>
              <Reveal index={3}>
                <SoftCard>
                  <p className="text-xs text-navy-500 dark:text-ink-500 mb-1 flex items-center gap-1.5"><Target size={13} /> Avg. goal progress</p>
                  <p className="text-2xl font-display font-semibold"><AnimatedNumber value={avgGoalProgress} suffix="%" /></p>
                </SoftCard>
              </Reveal>
            </div>

            {/* Today's study goal */}
            <Reveal><DailyGoalCard /></Reveal>

            {/* Study insights: cross-tool streak, score, and 35-day heatmap */}
            <Reveal><Card>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex gap-8 shrink-0">
                  <div>
                    <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Study streak</p>
                    <p className="text-2xl font-display font-semibold text-gradient-brand"><AnimatedNumber value={insights.streak} suffix="d" /></p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Today's score</p>
                    <p className="text-2xl font-display font-semibold"><AnimatedNumber value={insights.todayScore} suffix="/100" /></p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 dark:text-ink-500 mb-1">Weekly avg.</p>
                    <p className="text-2xl font-display font-semibold"><AnimatedNumber value={insights.weekScore} suffix="/100" /></p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-navy-500 dark:text-ink-500 mb-2">Last 35 days</p>
                  <div className="overflow-x-auto pb-1">
                    <div className="grid grid-cols-[repeat(35,minmax(9px,1fr))] gap-1 min-w-[280px]">
                      {insights.activity.map((day) => (
                        <div
                          key={day.date}
                          title={`${day.date} · score ${day.score}`}
                          aria-label={`${day.date}: score ${day.score}`}
                          role="img"
                          className={day.score === 0 ? 'aspect-square rounded-sm bg-navy-100 dark:bg-white/10' : 'aspect-square rounded-sm gradient-brand'}
                          style={day.score > 0 ? { opacity: Math.max(0.25, day.score / 100) } : undefined}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-navy-400 dark:text-ink-500 mt-3">Score is derived from focus time, Pomodoro sessions, and habit completions.</p>
              <Link to="/analytics" className="inline-flex items-center gap-1 text-xs font-medium text-electric-500 hover:underline mt-2">
                View full analytics <ArrowRight size={12} />
              </Link>
            </Card></Reveal>

            <div className="grid lg:grid-cols-3 gap-5">
              {/* Weekly productivity */}
              <Reveal index={0} className="lg:col-span-2"><Card>
                <h2 className="font-semibold mb-4">Weekly focus sessions</h2>
                <WeeklyBarChart data={last7Days} />
              </Card></Reveal>

              {/* Mini calendar */}
              <Reveal index={1}><Card>
                <MiniCalendarWidget highlightedDates={deadlineDates} />
              </Card></Reveal>

              {/* Recent tools */}
              <Reveal index={2} className="lg:col-span-2"><Card>
                <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Clock size={15} /> Recently used tools</h2>
                {recentVisits.length === 0 ? (
                  <EmptyState icon={Clock} title="Nothing opened yet" description="The tools you use will show up here, so you can jump straight back in next time." />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {recentVisits.slice(0, 8).map((v) => (
                      <Link key={v.path} to={v.path} className="flex items-center justify-between rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5 hover:border-electric-500 transition-colors text-sm">
                        <span className="truncate font-medium min-w-0">{v.title}</span>
                        <ArrowRight size={14} className="text-navy-400 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </Card></Reveal>

              {/* Recent AI conversations */}
              <Reveal index={3}><Card>
                <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Sparkles size={15} /> Recent AI chats</h2>
                {recentConversations.length === 0 ? (
                  <EmptyState icon={Sparkles} title="No conversations yet" description="Ask the AI assistant a question and it'll show up here." />
                ) : (
                  <div className="space-y-2">
                    {recentConversations.map((c) => (
                      <Link
                        key={c.id}
                        to="/ai-assistant"
                        state={{ openConversationId: c.id }}
                        className="flex items-center justify-between gap-2 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5 hover:border-electric-500 transition-colors text-sm"
                      >
                        <span className="truncate font-medium min-w-0">{c.title}</span>
                        <span className="text-xs text-navy-400 dark:text-ink-500 shrink-0">{new Date(c.updatedAt).toLocaleDateString()}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card></Reveal>

              {/* Favorites */}
              <Reveal index={4}><Card>
                <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Star size={15} /> Favorite tools</h2>
                {favoriteItems.length === 0 ? (
                  <EmptyState icon={Star} title="Pin your go-to tools" description="Star a tool from its page and it'll show up here for one-tap access." />
                ) : (
                  <div className="space-y-2">
                    {favoriteItems.map((item) => (
                      <Link key={item.path} to={item.path} className="flex items-center gap-2 rounded-xl border border-navy-100 dark:border-white/10 px-3 py-2 hover:border-electric-500 transition-colors text-sm">
                        <item.icon size={14} className="text-amber-500 shrink-0" />
                        <span className="truncate min-w-0">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card></Reveal>

              {/* Achievements */}
              <Reveal index={5}><Card>
                <h2 className="font-semibold mb-4 flex items-center justify-between">
                  <span>Achievements</span>
                  <span className="text-xs font-normal text-navy-400 dark:text-ink-500">{earnedCount}/{achievements.length}</span>
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {achievements.map((a) => (
                    <div key={a.id} title={a.progressLabel} className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center ${a.earned ? 'bg-amber-400/10' : 'bg-navy-50 dark:bg-white/5 opacity-40'}`}>
                      <a.icon size={18} className={a.earned ? 'text-amber-500' : 'text-navy-400'} />
                      <span className="text-[10px] font-medium leading-tight">{a.label}</span>
                    </div>
                  ))}
                </div>
              </Card></Reveal>

              {/* Upcoming deadlines */}
              <Reveal index={6}><Card>
                <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Hourglass size={15} /> Upcoming deadlines</h2>
                {deadlineItems.length === 0 ? (
                  <EmptyState icon={Hourglass} title="Nothing on the horizon" description="Add an exam, assignment, or goal deadline and it'll be tracked here." />
                ) : (
                  <div className="space-y-2">
                    {deadlineItems.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-xl border border-navy-100 dark:border-white/10 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate">{d.label}</p>
                          <p className="text-[10px] text-navy-400 dark:text-ink-500">{d.kind}</p>
                        </div>
                        <span className="text-xs font-semibold text-electric-500 shrink-0">{daysRemaining(d.date)}d</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card></Reveal>

              {/* Recent notes */}
              <Reveal index={6}><Card>
                <h2 className="font-semibold mb-4 flex items-center gap-1.5"><StickyNote size={15} /> Recent notes</h2>
                {notes.length === 0 ? (
                  <EmptyState icon={StickyNote} title="No notes yet" description="Create your first note in Productivity." />
                ) : (
                  <div className="space-y-2">
                    {[...pinnedNotes, ...notes.filter((n) => !n.pinned)].slice(0, 4).map((n) => (
                      <Link key={n.id} to="/productivity/notes" className="flex items-center gap-2 rounded-xl border border-navy-100 dark:border-white/10 px-3 py-2 hover:border-electric-500 transition-colors text-sm">
                        {n.pinned && <Pin size={12} className="text-violet-500 shrink-0" />}
                        <span className="truncate flex-1 min-w-0">{n.title || 'Untitled note'}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card></Reveal>

              {/* Recent files */}
              <Reveal index={6}><Card>
                <h2 className="font-semibold mb-4 flex items-center gap-1.5"><FileCheck2 size={15} /> Recent files</h2>
                {docHistory.length === 0 ? (
                  <EmptyState icon={FileCheck2} title="No files yet" description="Process a file in Document Tools to see it here." />
                ) : (
                  <div className="space-y-2">
                    {docHistory.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between rounded-xl border border-navy-100 dark:border-white/10 px-3 py-2 text-sm">
                        <span className="truncate min-w-0">{h.fileName}</span>
                        <span className="text-xs text-navy-400 shrink-0">{h.sizeLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card></Reveal>

              {/* Motivational quote */}
              <Reveal index={6}><SoftCard className="flex flex-col justify-center">
                <QuoteIcon size={18} className="text-electric-500 mb-2" />
                <p className="text-sm font-medium italic text-navy-700 dark:text-ink-200">&ldquo;{quote.text}&rdquo;</p>
                <p className="text-xs text-navy-400 dark:text-ink-500 mt-2">— {quote.author}</p>
              </SoftCard></Reveal>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
