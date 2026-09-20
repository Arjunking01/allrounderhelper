import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, Rows3, Columns3, List, Bell, BellOff } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { PageInfoSection } from '@/components/PageInfoSection';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { useCalendarEvents, calendarEventMeta, type CalendarEvent } from '../logic/calendarEvents';
import { monthGrid, weekDates, dateKey, addDays, addMonths, isSameMonth, isToday } from '../logic/calendarDateUtils';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('calendar')!;

const article: ToolArticleContent = {
  intro:
    'Calendar brings together exams, assignments, tasks, goals, and daily plan items from across the site into one month, week, day, or agenda view, so you don\u2019t have to check each tool separately to see what\u2019s coming up.',
  whyItMatters:
    'Deadlines tracked in separate tools are easy to miss if you only ever look at one of them. A combined calendar view surfaces everything in one place, in date order, so nothing from another tool falls out of sight.',
  howItWorks: [
    'Switch between month, week, day, and agenda views.',
    'Exams, assignments, tasks with due dates, goals with deadlines, and daily plan items appear automatically \u2014 nothing needs to be entered twice.',
    'Click into a date to see everything scheduled for that day.',
  ],
  examples: [
    { title: 'Weekly overview', body: 'Switch to week view every Sunday to see everything due across all tools for the coming week in one place.' },
    { title: 'Spotting a collision across tools', body: 'An exam added in Exam Countdown and an assignment due date added separately in Assignment Tracker can land on the same day without either tool showing you that on its own \u2014 the calendar is the one place that surfaces the overlap, since it pulls both into the same view automatically.' },
  ],
  mistakes: [
    'Only checking the calendar occasionally \u2014 it\u2019s most useful as a regular first stop before opening any individual tool.',
    'Assuming every planning tool on the site feeds into the calendar \u2014 it pulls from Exam Countdown, Assignment Tracker, To-Do, Goal Tracker, and Daily Planner, but the Weekly Planner and Semester Planner are separate views and don\u2019t appear here.',
  ],
  tips: [
    'Use agenda view when you just want a simple upcoming list rather than a visual grid.',
    'Click into a specific date when the month view looks crowded, rather than trying to read every entry from the small grid squares.',
  ],
  faqs: [
    { question: 'Do I need to add events here separately?', answer: 'No \u2014 the calendar automatically pulls from your exams, assignments, tasks, goals, and daily plan entered elsewhere on the site.' },
    { question: 'Does this include my Weekly Planner or Semester Planner entries?', answer: 'No \u2014 Calendar aggregates exams, assignments, to-do tasks, goals, and daily plan items specifically. Weekly Planner and Semester Planner are separate views with their own layouts.' },
  ],
  related: [
    { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
    { label: 'Assignment Tracker', href: '/productivity/assignment-tracker' },
    { label: 'Daily Planner', href: '/productivity/daily-planner' },
  ],
};

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'month', label: 'Month', icon: LayoutGrid },
  { key: 'week', label: 'Week', icon: Columns3 },
  { key: 'day', label: 'Day', icon: Rows3 },
  { key: 'agenda', label: 'Agenda', icon: List },
];

function EventPill({ event }: { event: CalendarEvent }) {
  const meta = calendarEventMeta(event.type);
  return (
    <Link to={event.path} className={clsx('block truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium', meta.color)}>
      {event.time && <span className="font-mono mr-1">{event.time}</span>}
      {event.title}
    </Link>
  );
}

export default function CalendarPage() {
  const events = useCalendarEvents();
  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [remindersEnabled, setRemindersEnabled] = useLocalStorage('ar-calendar-reminders', false);
  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;

  async function toggleReminders() {
    if (remindersEnabled) {
      setRemindersEnabled(false);
      return;
    }
    if (!notificationsSupported) return;
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission === 'granted') setRemindersEnabled(true);
  }

  // Schedules a browser notification for each of today's upcoming timed events.
  useEffect(() => {
    if (!remindersEnabled || !notificationsSupported || Notification.permission !== 'granted') return;
    const today = dateKey(new Date());
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const e of events) {
      if (e.date !== today || !e.time) continue;
      const eventTime = new Date(`${e.date}T${e.time}:00`).getTime();
      const delay = eventTime - Date.now();
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue;
      timers.push(setTimeout(() => {
        new Notification(e.title, { body: `${calendarEventMeta(e.type).label} scheduled for ${e.time}`, tag: e.id });
      }, delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [remindersEnabled, notificationsSupported, events]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [events]);

  function goToday() {
    setCursor(new Date());
    setSelectedDate(dateKey(new Date()));
  }

  function navigate(dir: -1 | 1) {
    if (view === 'month') setCursor((c) => addMonths(c, dir));
    else if (view === 'week') setCursor((c) => addDays(c, dir * 7));
    else if (view === 'day') setCursor((c) => addDays(c, dir));
  }

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekLabel = useMemo(() => {
    const days = weekDates(cursor);
    return `${days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [cursor]);
  const dayLabel = cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <ProductivityToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/productivity/calendar" icon={CalendarIcon} breadcrumb={{ label: 'Calendar' }}
article={article}
    >
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            {view !== 'agenda' && (
              <>
                <button onClick={() => navigate(-1)} aria-label="Previous" className="flex h-8 w-8 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 hover:border-electric-500">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => navigate(1)} aria-label="Next" className="flex h-8 w-8 items-center justify-center rounded-full border border-navy-200 dark:border-white/10 hover:border-electric-500">
                  <ChevronRight size={14} />
                </button>
              </>
            )}
            <button onClick={goToday} className="text-sm font-medium text-electric-500 hover:underline px-1">Today</button>
            <span className="text-sm font-semibold ml-1">
              {view === 'month' ? monthLabel : view === 'week' ? weekLabel : view === 'day' ? dayLabel : 'Upcoming'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={remindersEnabled ? <Bell size={14} /> : <BellOff size={14} />}
              onClick={toggleReminders}
              disabled={!notificationsSupported}
              title={notificationsSupported ? 'Get a browser notification when a timed event is due today' : 'Notifications are not supported in this browser'}
            >
              Reminders {remindersEnabled ? 'on' : 'off'}
            </Button>
            <div className="flex gap-1 rounded-xl bg-navy-50 dark:bg-white/5 p-1 w-fit">
              {VIEW_OPTIONS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    view === v.key ? 'bg-white dark:bg-navy-800 text-electric-500 shadow-sm' : 'text-navy-500 dark:text-ink-400'
                  )}
                >
                  <v.icon size={13} /> {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {view === 'month' && (
              <div>
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[11px] font-semibold text-navy-400 dark:text-ink-500">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthGrid(cursor).map((d) => {
                    const key = dateKey(d);
                    const dayEvents = eventsByDate.get(key) ?? [];
                    const inMonth = isSameMonth(d, cursor);
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(key)}
                        aria-pressed={selectedDate === key}
                        aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`}
                        className={clsx(
                          'min-h-[72px] rounded-lg border p-1.5 text-left align-top flex flex-col gap-0.5 transition-colors',
                          selectedDate === key ? 'border-electric-500 bg-electric-500/5' : 'border-navy-100 dark:border-white/10',
                          !inMonth && 'opacity-40'
                        )}
                      >
                        <span aria-hidden="true" className={clsx('text-xs font-medium', isToday(d) && 'flex h-5 w-5 items-center justify-center rounded-full gradient-brand text-white')}>{d.getDate()}</span>
                        <div aria-hidden="true" className="flex flex-wrap gap-0.5">
                          {dayEvents.slice(0, 3).map((e) => (
                            <span key={e.id} className={clsx('h-1.5 w-1.5 rounded-full', calendarEventMeta(e.type).dot)} />
                          ))}
                          {dayEvents.length > 3 && <span className="text-[9px] text-navy-400">+{dayEvents.length - 3}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 border-t border-navy-100 dark:border-white/10 pt-4">
                  <p className="text-sm font-semibold mb-2">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-navy-400 dark:text-ink-500">Nothing scheduled.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedEvents.map((e) => (
                        <li key={e.id}>
                          <Link to={e.path} className={clsx('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:opacity-80 transition-opacity', calendarEventMeta(e.type).color)}>
                            <span className={clsx('h-1.5 w-1.5 rounded-full shrink-0', calendarEventMeta(e.type).dot)} />
                            {e.time && <span className="font-mono text-xs shrink-0">{e.time}</span>}
                            <span className="truncate min-w-0">{e.title}</span>
                            <span className="ml-auto text-[10px] uppercase tracking-wide opacity-70 shrink-0">{calendarEventMeta(e.type).label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {view === 'week' && (
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {weekDates(cursor).map((d) => {
                  const key = dateKey(d);
                  const dayEvents = eventsByDate.get(key) ?? [];
                  return (
                    <div key={key} className={clsx('rounded-xl border p-2 min-h-[120px]', isToday(d) ? 'border-electric-500' : 'border-navy-100 dark:border-white/10')}>
                      <p className="text-xs font-semibold text-navy-500 dark:text-ink-400 mb-2">{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</p>
                      <div className="space-y-1">
                        {dayEvents.length === 0 ? (
                          <p className="text-[11px] text-navy-300 dark:text-ink-600">—</p>
                        ) : (
                          dayEvents.map((e) => <EventPill key={e.id} event={e} />)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === 'day' && (
              <div>
                {(eventsByDate.get(dateKey(cursor)) ?? []).length === 0 ? (
                  <EmptyState icon={CalendarIcon} title="Nothing scheduled" description="This day is clear — add a task, exam, or plan item to see it here." />
                ) : (
                  <ul className="space-y-2">
                    {(eventsByDate.get(dateKey(cursor)) ?? []).map((e) => (
                      <li key={e.id}>
                        <Link to={e.path} className={clsx('flex items-center gap-3 rounded-xl border px-4 py-3 hover:opacity-80 transition-opacity', calendarEventMeta(e.type).color)}>
                          <span className={clsx('h-2 w-2 rounded-full shrink-0', calendarEventMeta(e.type).dot)} />
                          {e.time && <span className="font-mono text-sm">{e.time}</span>}
                          <span className="min-w-0 flex-1 truncate font-medium">{e.title}</span>
                          <span className="text-[10px] uppercase tracking-wide opacity-70 shrink-0">{calendarEventMeta(e.type).label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {view === 'agenda' && (
              <AgendaView eventsByDate={eventsByDate} />
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      <PageInfoSection
        about="This calendar automatically pulls in every date-based item you've created elsewhere on the site — exam dates, assignment due dates, goal deadlines, and plan entries — and shows them together in month, week, or agenda view. There's nothing to sync manually; add a due date to an assignment or an exam, and it appears here."
        tips={[
          'Turn on Reminders (top toolbar) to get a browser notification when a timed event is due today — your browser will ask for permission the first time.',
          'Use Agenda view on a phone; it lists everything chronologically without needing to scroll through empty weeks.',
          'Each event is color-coded by type (exam, assignment, goal, plan) so you can scan a busy week at a glance.',
          'Click any event to jump straight to the tool it came from — the calendar itself doesn\u2019t store separate data.',
        ]}
        faqs={[
          { question: 'Can I add an event directly from the calendar?', answer: 'The calendar is a read-only view of dates from other tools. Add or edit dates from Exam Countdown, Assignment Tracker, Goal Tracker, or the planners, and they\u2019ll show up here automatically.' },
          { question: 'Do reminders work if I close the tab?', answer: 'No — browser notifications only fire while this site is open in a tab, since everything runs locally without a server sending push notifications.' },
        ]}
        related={[
          { label: 'Exam Countdown', href: '/productivity/exam-countdown' },
          { label: 'Assignment Tracker', href: '/productivity/assignment-tracker' },
          { label: 'Weekly Planner', href: '/productivity/weekly-planner' },
        ]}
      />
    </ProductivityToolLayout>
  );
}

function AgendaView({ eventsByDate }: { eventsByDate: Map<string, CalendarEvent[]> }) {
  const today = dateKey(new Date());
  const upcomingDates = Array.from(eventsByDate.keys()).filter((d) => d >= today).sort();

  if (upcomingDates.length === 0) {
    return <EmptyState icon={CalendarIcon} title="Nothing upcoming" description="Exams, assignments, tasks, goals, and plan items will appear here as you add them." />;
  }

  return (
    <div className="space-y-5">
      {upcomingDates.slice(0, 30).map((date) => (
        <div key={date}>
          <p className="text-sm font-semibold text-navy-700 dark:text-ink-300 mb-2">
            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <ul className="space-y-1.5">
            {eventsByDate.get(date)!.map((e) => (
              <li key={e.id}>
                <Link to={e.path} className={clsx('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:opacity-80 transition-opacity', calendarEventMeta(e.type).color)}>
                  <span className={clsx('h-1.5 w-1.5 rounded-full shrink-0', calendarEventMeta(e.type).dot)} />
                  {e.time && <span className="font-mono text-xs shrink-0">{e.time}</span>}
                  <span className="truncate min-w-0">{e.title}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide opacity-70 shrink-0">{calendarEventMeta(e.type).label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
