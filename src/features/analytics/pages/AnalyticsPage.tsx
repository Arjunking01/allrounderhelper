import { useMemo, useState } from 'react';
import { BarChart3, Printer, FileDown, TrendingUp, CheckSquare, Target, Flame, Wrench } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Card, SoftCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LineChart, PieChart, ProgressRing } from '@/components/ui/Charts';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCalculatorHistory } from '@/hooks/useCalculatorHistory';
import { useProductivityInsights } from '@/hooks/useProductivityInsights';
import { useMostUsedTools } from '@/hooks/useRecentTools';
import { usePrint } from '@/hooks/usePrint';
import { useResultPdfExport } from '@/hooks/useResultPdfExport';
import { parseCgpaHistory, parseAttendanceHistory } from '../logic/parseCalculatorHistory';
import type { Task } from '@/features/productivity/logic/todoTypes';
import type { Goal } from '@/features/productivity/logic/goalTypes';

type ReportRange = 'weekly' | 'monthly' | 'semester';

export default function AnalyticsPage() {
  const [tasks] = useLocalStorage<Task[]>('ar-todo-tasks', []);
  const [goals] = useLocalStorage<Goal[]>('ar-goals', []);
  const { entries: cgpaEntries } = useCalculatorHistory('cgpa-calculator');
  const { entries: attendanceEntries } = useCalculatorHistory('attendance-calculator');
  const insights = useProductivityInsights();
  const mostUsed = useMostUsedTools(6);
  const { printResult } = usePrint();
  const { exportPdf } = useResultPdfExport();
  const [range, setRange] = useState<ReportRange>('weekly');

  const cgpaTrend = useMemo(() => parseCgpaHistory(cgpaEntries), [cgpaEntries]);
  const attendanceTrend = useMemo(() => parseAttendanceHistory(attendanceEntries), [attendanceEntries]);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const completedGoals = goals.filter((g) => g.completed).length;
  const goalCompletionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const rangeDays = range === 'weekly' ? 7 : range === 'monthly' ? 30 : 35;
  const rangeActivity = insights.activity.slice(-rangeDays);
  const rangeFocusMinutes = rangeActivity.reduce((sum, d) => sum + d.focusMinutes, 0);
  const rangePomodoros = rangeActivity.reduce((sum, d) => sum + d.pomodoroSessions, 0);
  const rangeHabits = rangeActivity.reduce((sum, d) => sum + d.habitsCompleted, 0);
  const rangeAvgScore = Math.round(rangeActivity.reduce((sum, d) => sum + d.score, 0) / Math.max(1, rangeActivity.length));

  const reportTitle = range === 'weekly' ? 'Weekly Summary' : range === 'monthly' ? 'Monthly Summary' : '35-Day Summary';
  const reportBody = [
    `Period: last ${rangeDays} days`,
    '',
    `Focus time: ${Math.floor(rangeFocusMinutes / 60)}h ${rangeFocusMinutes % 60}m`,
    `Pomodoro sessions completed: ${rangePomodoros}`,
    `Habit completions: ${rangeHabits}`,
    `Average productivity score: ${rangeAvgScore}/100`,
    `Current streak: ${insights.streak} day${insights.streak !== 1 ? 's' : ''}`,
    '',
    `Tasks: ${completedTasks} of ${tasks.length} completed (${taskCompletionRate}%)`,
    `Goals: ${completedGoals} of ${goals.length} completed (${goalCompletionRate}%)`,
    '',
    cgpaTrend.length > 0 ? `Most recent CGPA calculation: ${cgpaTrend[cgpaTrend.length - 1].value.toFixed(2)}` : 'No CGPA calculations recorded yet.',
    attendanceTrend.length > 0 ? `Most recent attendance calculation: ${attendanceTrend[attendanceTrend.length - 1].value.toFixed(1)}%` : 'No attendance calculations recorded yet.',
  ].join('\n');

  const taskPieData = [
    { label: 'Completed', value: completedTasks, color: '#17cf8f' },
    { label: 'Active', value: tasks.length - completedTasks, color: '#3b6dfb' },
  ];

  return (
    <div className="noise-bg min-h-[70vh]">
      <Seo title="Analytics" description="Track your academic performance, study hours, focus time, task completion, and productivity trends in one place." path="/analytics" noindex />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-white">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold">Analytics</h1>
              <p className="text-navy-500 dark:text-ink-400 text-sm">Your academic performance and productivity, in one place.</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-xl bg-navy-50 dark:bg-white/5 p-1 w-fit">
            {(['weekly', 'monthly', 'semester'] as ReportRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${range === r ? 'bg-white dark:bg-navy-800 text-electric-500 shadow-sm' : 'text-navy-500 dark:text-ink-400'}`}
              >
                {r === 'semester' ? '35 days' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24 space-y-6">
        {/* Report generator */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold">{reportTitle}</h2>
              <p className="text-sm text-navy-500 dark:text-ink-500">Generated from your actual activity — nothing here is estimated.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" icon={<Printer size={14} />} onClick={() => printResult(reportTitle, reportBody)}>Print</Button>
              <Button size="sm" icon={<FileDown size={14} />} onClick={() => exportPdf(reportTitle, reportBody)}>Export PDF</Button>
            </div>
          </div>
          <SoftCard>
            <pre className="text-sm text-navy-700 dark:text-ink-300 whitespace-pre-wrap font-sans leading-relaxed">{reportBody}</pre>
          </SoftCard>
        </Card>

        {/* Key stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <ProgressRing value={rangeAvgScore} size={64} strokeWidth={6}>
              <span className="text-sm font-semibold">{rangeAvgScore}</span>
            </ProgressRing>
            <div>
              <p className="text-xs text-navy-500 dark:text-ink-500">Productivity score</p>
              <p className="text-xs text-navy-400 dark:text-ink-600">{range === 'semester' ? '35-day' : range} average</p>
            </div>
          </Card>
          <SoftCard className="flex flex-col justify-center">
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1 flex items-center gap-1.5"><Flame size={13} /> Streak</p>
            <p className="text-2xl font-display font-semibold text-gradient-brand">{insights.streak}d</p>
          </SoftCard>
          <SoftCard className="flex flex-col justify-center">
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1 flex items-center gap-1.5"><CheckSquare size={13} /> Task completion</p>
            <p className="text-2xl font-display font-semibold">{taskCompletionRate}%</p>
          </SoftCard>
          <SoftCard className="flex flex-col justify-center">
            <p className="text-xs text-navy-500 dark:text-ink-500 mb-1 flex items-center gap-1.5"><Target size={13} /> Goal completion</p>
            <p className="text-2xl font-display font-semibold">{goalCompletionRate}%</p>
          </SoftCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Productivity score trend */}
          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-1.5"><TrendingUp size={15} /> Productivity trend ({rangeDays} days)</h2>
            <LineChart data={rangeActivity.map((d) => ({ label: d.date, value: d.score }))} height={140} label="Productivity score trend" />
          </Card>

          {/* Task breakdown */}
          <Card>
            <h2 className="font-semibold mb-4">Task breakdown</h2>
            {tasks.length === 0 ? (
              <EmptyState icon={CheckSquare} title="No tasks yet" description="Add tasks in the To-Do List to see this breakdown." />
            ) : (
              <div className="flex items-center gap-6">
                <PieChart data={taskPieData} size={120} label="Task status breakdown" />
                <div className="space-y-2">
                  {taskPieData.map((d) => (
                    <div key={d.label} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.label}: <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* CGPA trend */}
          <Card>
            <h2 className="font-semibold mb-4">CGPA calculation history</h2>
            {cgpaTrend.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No CGPA history yet" description="Use the CGPA Calculator — your results are saved automatically and charted here." />
            ) : (
              <LineChart data={cgpaTrend.map((p) => ({ label: p.label, value: p.value }))} height={140} unit="" label="CGPA trend" />
            )}
          </Card>

          {/* Attendance trend */}
          <Card>
            <h2 className="font-semibold mb-4">Attendance calculation history</h2>
            {attendanceTrend.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No attendance history yet" description="Use the Attendance Calculator — your results are saved automatically and charted here." />
            ) : (
              <LineChart data={attendanceTrend.map((p) => ({ label: p.label, value: p.value }))} height={140} unit="%" label="Attendance trend" />
            )}
          </Card>
        </div>

        {/* Most used tools */}
        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-1.5"><Wrench size={15} /> Most used tools</h2>
          {mostUsed.length === 0 ? (
            <EmptyState icon={Wrench} title="No usage data yet" description="As you use tools around the site, your most-used ones will show up here." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {mostUsed.map((t) => (
                <div key={t.path} className="flex items-center justify-between gap-2 rounded-xl border border-navy-100 dark:border-white/10 px-4 py-2.5 min-w-0">
                  <span className="text-sm font-medium truncate min-w-0">{t.title}</span>
                  <Badge tone="brand">{t.count}×</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
