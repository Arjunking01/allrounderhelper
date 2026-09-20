import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Plus, Trash2, Focus, ChevronUp, ChevronDown, CheckCircle2, PauseCircle, Pencil } from 'lucide-react';
import { ProductivityToolLayout } from '@/components/ProductivityToolLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { clsx } from '@/lib/utils/clsx';
import { getProductivityToolBySlug } from '@/data/productivityRegistry';
import { useDailyRoutine } from '../logic/useDailyRoutine';
import {
  ROUTINE_DAYS,
  ROUTINE_CATEGORIES,
  ROUTINE_CATEGORY_COLORS,
  dayAbbrevFor,
  routineItemsForDay,
  splitRoutineByTime,
  routineEndMinutes,
  normalizeRoutineTime,
  type RoutineItem,
} from '../logic/routineTypes';
import type { ToolArticleContent } from '@/components/ToolArticle';

const tool = getProductivityToolBySlug('daily-routine')!;

const article: ToolArticleContent = {
  intro:
    'Daily Routine is your repeatable day structure \u2014 the morning review, study blocks, and wind-down that happen most days \u2014 separate from one-off tasks. Set it up once, pick which weekdays each block recurs on, and Today\u2019s Routine shows what\u2019s current, next, and later without any daily re-planning.',
  whyItMatters:
    'A to-do list tells you what needs doing; a routine tells you how your day is shaped. Plan My Day already surfaces today\u2019s workload \u2014 Daily Routine gives that workload a rhythm to sit inside, so you always know what should be happening right now, not just what\u2019s outstanding.',
  howItWorks: [
    'Add a routine block: a title, a start time, a duration, and which days it recurs on.',
    'Today\u2019s Routine splits automatically into Current, Next, and Later based on the time right now.',
    'Check off today\u2019s occurrence as you complete it \u2014 this only marks today done, the recurring block itself stays scheduled for its next occurrence.',
    'Disable a block instead of deleting it to pause it without losing the setup.',
  ],
  examples: [
    { title: 'A weekday study rhythm', body: 'Morning review at 7:30, a Mathematics block at 16:00, a break at 17:00, then Physics at 17:15 \u2014 recurring Mon\u2013Fri.' },
  ],
  mistakes: [
    'Treating Daily Routine as another task list \u2014 use To-Do or Daily Planner for one-off work; keep this for the structure that repeats.',
    'Scheduling back-to-back blocks with no buffer \u2014 leave a few minutes between blocks the same way Daily Planner recommends.',
  ],
  tips: [
    'Pair a study block with Focus Mode \u2014 tap the focus icon on any block to start a session with that block\u2019s name pre-filled.',
    'Use categories (morning, study, break, afternoon, evening, night) to keep a long routine visually scannable.',
  ],
  faqs: [
    { question: 'Does completing a routine block affect my tasks or study sessions?', answer: 'No \u2014 routine completion is separate from Daily Planner, Study Planner, or Focus Mode\u2019s own completion tracking. It only tracks whether today\u2019s occurrence of that routine block is done.' },
    { question: 'What happens to a completed block tomorrow?', answer: 'It resets \u2014 completion is tracked per day, so a recurring block shows as not-yet-done again on its next scheduled day.' },
    { question: 'Can a routine block recur on some days but not others?', answer: 'Yes \u2014 pick any combination of weekdays when creating or editing a block.' },
  ],
  related: [
    { label: 'Plan My Day', href: '/productivity/plan-my-day' },
    { label: 'Daily Planner', href: '/productivity/daily-planner' },
    { label: 'Focus Mode', href: '/productivity/focus-mode' },
  ],
};

const EMPTY_FORM = { title: '', time: '08:00', durationMinutes: 30, days: [] as string[], category: undefined as string | undefined };

// Quick-select presets so 5/10-minute blocks (the most common complaint \u2014 a bare number
// input made short durations annoying to set) never require typing. "Custom" covers anything
// outside this list without limiting what a routine block's duration can be.
const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60] as const;
const MIN_DURATION = 1;
const MAX_DURATION = 480; // 8h \u2014 generous ceiling against an accidental huge value, not a real limit on routines

function DurationPicker({ value, onChange }: { value: number; onChange: (minutes: number) => void }) {
  const isPreset = (DURATION_PRESETS as readonly number[]).includes(value);
  const [customOpen, setCustomOpen] = useState(!isPreset);
  const [customText, setCustomText] = useState(String(value));

  function commitCustom(raw: string) {
    const n = Math.round(Number(raw));
    if (!raw.trim() || Number.isNaN(n)) return; // leave existing value untouched on invalid/empty input
    onChange(Math.min(MAX_DURATION, Math.max(MIN_DURATION, n)));
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Duration in minutes">
        {DURATION_PRESETS.map((mins) => (
          <button
            key={mins} type="button"
            onClick={() => { onChange(mins); setCustomOpen(false); }}
            aria-pressed={!customOpen && value === mins}
            className={clsx(
              'rounded-lg px-3 py-2 text-sm font-semibold border transition-colors min-w-[3.25rem]',
              !customOpen && value === mins
                ? 'bg-electric-500 border-electric-500 text-white'
                : 'border-navy-200 dark:border-white/10 text-navy-600 dark:text-ink-300 hover:border-electric-500'
            )}
          >
            {mins}m
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setCustomOpen(true); setCustomText(String(value)); }}
          aria-pressed={customOpen}
          className={clsx(
            'rounded-lg px-3 py-2 text-sm font-semibold border transition-colors',
            customOpen
              ? 'bg-electric-500 border-electric-500 text-white'
              : 'border-navy-200 dark:border-white/10 text-navy-600 dark:text-ink-300 hover:border-electric-500'
          )}
        >
          Custom
        </button>
      </div>
      {customOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number" inputMode="numeric" min={MIN_DURATION} max={MAX_DURATION}
            value={customText} aria-label="Custom duration in minutes"
            onChange={(e) => setCustomText(e.target.value)}
            onBlur={(e) => commitCustom(e.target.value)}
            className="w-24 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
          />
          <span className="text-xs text-navy-400 dark:text-ink-500">minutes</span>
        </div>
      )}
    </div>
  );
}

function timeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function endTimeLabel(item: RoutineItem): string {
  const total = routineEndMinutes(item);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return timeLabel(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
}

function RoutineForm({ onSubmit, initial, onCancel }: { onSubmit: (v: typeof EMPTY_FORM) => void; initial?: typeof EMPTY_FORM; onCancel?: () => void }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  // A native time input can be cleared to '' (e.g. backspacing every segment on desktop). An item saved
  // with an empty/invalid time is dropped by sanitizeRoutineItems on the next read (time is load-bearing),
  // so the block would silently vanish — require a valid HH:MM before allowing Save/Add.
  const normalizedTime = normalizeRoutineTime(form.time);
  const timeValid = normalizedTime !== undefined;
  const canSave = form.title.trim() !== '' && form.days.length > 0 && timeValid;

  function toggleDay(day: string) {
    setForm((f) => ({ ...f, days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day] }));
  }

  return (
    <div className="space-y-3 rounded-xl border border-navy-100 dark:border-white/10 p-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text" placeholder="e.g. Morning review" value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="flex-1 min-w-0 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
        />
        <input
          type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          className="w-full sm:w-28 rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-3 py-2.5 text-sm outline-none focus:border-electric-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-navy-500 dark:text-ink-400 mb-1.5">Duration</label>
        <DurationPicker value={form.durationMinutes} onChange={(mins) => setForm((f) => ({ ...f, durationMinutes: mins }))} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ROUTINE_DAYS.map((day) => (
          <button
            key={day} type="button" onClick={() => toggleDay(day)}
            className={clsx(
              'rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors min-w-[2.75rem]',
              form.days.includes(day)
                ? 'bg-electric-500 border-electric-500 text-white'
                : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400 hover:border-electric-500'
            )}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ROUTINE_CATEGORIES.map((cat) => (
          <button
            key={cat} type="button" onClick={() => setForm((f) => ({ ...f, category: f.category === cat ? undefined : cat }))}
            className={clsx(
              'rounded-lg px-2.5 py-1 text-xs font-medium border capitalize transition-colors',
              form.category === cat ? 'text-white border-transparent' : 'border-navy-200 dark:border-white/10 text-navy-500 dark:text-ink-400 hover:border-electric-500'
            )}
            style={form.category === cat ? { backgroundColor: ROUTINE_CATEGORY_COLORS[cat] } : undefined}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            if (!canSave || normalizedTime === undefined) return;
            onSubmit({ ...form, time: normalizedTime });
            setForm(EMPTY_FORM);
          }}
          disabled={!canSave}
        >
          {initial ? 'Save changes' : 'Add block'}
        </Button>
      </div>
      {form.days.length === 0 && <p className="text-xs text-navy-400 dark:text-ink-500">Pick at least one day for this block to recur on.</p>}
      {!timeValid && <p className="text-xs text-navy-400 dark:text-ink-500">Pick a start time for this block.</p>}
    </div>
  );
}

function RoutineRow({
  item, done, onToggleDone, onToggleEnabled, onDelete, onMove, onEdit, tone,
}: {
  item: RoutineItem;
  done: boolean;
  onToggleDone: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onEdit?: () => void;
  tone: 'current' | 'next' | 'later' | 'all';
}) {
  const dot = item.category ? ROUTINE_CATEGORY_COLORS[item.category] : undefined;
  return (
    <motion.li
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={clsx(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5',
        tone === 'current' ? 'border-electric-500/40 bg-electric-500/5' : 'border-navy-100 dark:border-white/10'
      )}
    >
      {tone !== 'all' && (
        <button onClick={onToggleDone} aria-label={done ? 'Mark not done' : 'Mark done'} className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2', done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-navy-300 dark:border-white/20')}>
          {done && <CheckCircle2 size={12} />}
        </button>
      )}
      {dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', done && tone !== 'all' && 'line-through text-navy-400 dark:text-ink-500')}>{item.title}</p>
        <p className="text-xs text-navy-400 dark:text-ink-500">{timeLabel(item.time)}{'\u2013'}{endTimeLabel(item)}{!item.enabled && ' \u00b7 paused'}</p>
      </div>
      <Link
        to={`/productivity/focus-mode?task=${encodeURIComponent(item.title)}`}
        title={`Start a focus session for "${item.title}"`}
        aria-label={`Start a focus session for ${item.title}`}
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 dark:text-ink-500 hover:text-electric-500 hover:bg-electric-500/10 transition-colors"
      >
        <Focus size={15} />
      </Link>
      {tone === 'all' && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit} aria-label={`Edit ${item.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:text-electric-500"><Pencil size={15} /></button>
          <button onClick={() => onMove('up')} aria-label="Move up" className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:text-electric-500"><ChevronUp size={15} /></button>
          <button onClick={() => onMove('down')} aria-label="Move down" className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:text-electric-500"><ChevronDown size={15} /></button>
          <button onClick={onToggleEnabled} aria-label={item.enabled ? 'Pause block' : 'Resume block'} className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:text-electric-500">
            <PauseCircle size={15} className={item.enabled ? '' : 'text-electric-500'} />
          </button>
          <button onClick={onDelete} aria-label="Delete block" className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:text-red-500"><Trash2 size={15} /></button>
        </div>
      )}
    </motion.li>
  );
}

export default function DailyRoutinePage() {
  const { items, isDoneToday, toggleCompletedToday, addItem, updateItem, removeItem, toggleEnabled, reorder, persistError } = useDailyRoutine();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const now = new Date();
  const day = dayAbbrevFor(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const todayItems = useMemo(() => routineItemsForDay(items, day), [items, day]);
  const { current, next, later, past } = useMemo(() => splitRoutineByTime(todayItems, nowMinutes), [todayItems, nowMinutes]);
  const allSorted = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
  const editingItem = editingId ? items.find((it) => it.id === editingId) : undefined;

  return (
    <ProductivityToolLayout
      toolName={tool.name} tagline={tool.tagline} description={tool.description}
      path="/productivity/daily-routine" icon={Repeat} breadcrumb={{ label: 'Daily Routine' }}
      article={article}
    >
      {persistError && (
        <p role="alert" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
          Couldn&apos;t save your routine to this browser — storage may be full or disabled. Your changes will be lost when you close this tab.
        </p>
      )}
      {items.length === 0 ? (
        <Card>
          <EmptyState icon={Repeat} title="Build your first routine" description={'Add a recurring block \u2014 a morning review, a study block, a wind-down \u2014 and pick which days it happens.'} />
          <div className="max-w-xl mx-auto mt-2">
            <RoutineForm onSubmit={(v) => addItem(v)} />
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card>
            <h2 className="text-sm font-semibold text-navy-700 dark:text-ink-200 mb-3">{"Today\u2019s Routine \u00b7"} {day}</h2>
            {todayItems.length === 0 ? (
              <EmptyState icon={Repeat} title="Nothing scheduled today" description={"No routine block recurs on this weekday yet \u2014 add one below or check your block's selected days."} />
            ) : (
              <div className="space-y-4">
                {current.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-wide text-electric-500 mb-2">Current</p>
                    <ul className="space-y-2">
                      <AnimatePresence initial={false}>
                        {current.map((it) => (
                          <RoutineRow key={it.id} item={it} tone="current" done={isDoneToday(it.id)} onToggleDone={() => toggleCompletedToday(it.id)} onToggleEnabled={() => toggleEnabled(it.id)} onDelete={() => removeItem(it.id)} onMove={(d) => reorder(it.id, d)} />
                        ))}
                      </AnimatePresence>
                    </ul>
                  </section>
                )}
                {next && (
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-ink-400 mb-2">Next</p>
                    <ul className="space-y-2">
                      <RoutineRow key={next.id} item={next} tone="next" done={isDoneToday(next.id)} onToggleDone={() => toggleCompletedToday(next.id)} onToggleEnabled={() => toggleEnabled(next.id)} onDelete={() => removeItem(next.id)} onMove={(d) => reorder(next.id, d)} />
                    </ul>
                  </section>
                )}
                {later.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 dark:text-ink-500 mb-2">Later today</p>
                    <ul className="space-y-2">
                      <AnimatePresence initial={false}>
                        {later.map((it) => (
                          <RoutineRow key={it.id} item={it} tone="later" done={isDoneToday(it.id)} onToggleDone={() => toggleCompletedToday(it.id)} onToggleEnabled={() => toggleEnabled(it.id)} onDelete={() => removeItem(it.id)} onMove={(d) => reorder(it.id, d)} />
                        ))}
                      </AnimatePresence>
                    </ul>
                  </section>
                )}
                {past.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-navy-400 dark:text-ink-500 mb-2">Earlier today ({past.length})</summary>
                    <ul className="space-y-2 mt-2">
                      {past.map((it) => (
                        <RoutineRow key={it.id} item={it} tone="later" done={isDoneToday(it.id)} onToggleDone={() => toggleCompletedToday(it.id)} onToggleEnabled={() => toggleEnabled(it.id)} onDelete={() => removeItem(it.id)} onMove={(d) => reorder(it.id, d)} />
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-navy-700 dark:text-ink-200">All routine blocks ({allSorted.length})</h2>
              <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={() => { setEditingId(null); setShowForm((s) => !s); }}>
                {showForm ? 'Close' : 'Add block'}
              </Button>
            </div>
            {showForm && (
              <div className="mb-4">
                <RoutineForm onSubmit={(v) => { addItem(v); setShowForm(false); }} onCancel={() => setShowForm(false)} />
              </div>
            )}
            {editingItem && (
              <div className="mb-4">
                <RoutineForm
                  key={editingItem.id}
                  initial={{ title: editingItem.title, time: editingItem.time, durationMinutes: editingItem.durationMinutes, days: editingItem.days, category: editingItem.category }}
                  onSubmit={(v) => { updateItem(editingItem.id, v); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            )}
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {allSorted.map((it) => (
                  <RoutineRow key={it.id} item={it} tone="all" done={false} onToggleDone={() => {}} onToggleEnabled={() => toggleEnabled(it.id)} onDelete={() => removeItem(it.id)} onMove={(d) => reorder(it.id, d)} onEdit={() => { setShowForm(false); setEditingId(it.id); }} />
                ))}
              </AnimatePresence>
            </ul>
          </Card>
        </div>
      )}
    </ProductivityToolLayout>
  );
}
