import { MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { usePreferencesStore } from '@/lib/store/preferences';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ToastProvider } from '@/components/ToastProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CommandPalette } from '@/components/CommandPalette';
import { RouteAnalytics } from '@/components/RouteAnalytics';
import { PageSkeleton } from '@/components/ui/Skeleton';

const HomePage = lazy(() => import('@/pages/HomePage'));
const AcademicToolsPage = lazy(() => import('@/pages/AcademicToolsPage'));
const ProductivityIndexPage = lazy(() => import('@/features/productivity/pages/ProductivityIndexPage'));
const TodoListPage = lazy(() => import('@/features/productivity/pages/TodoListPage'));
const NotesPage = lazy(() => import('@/features/productivity/pages/NotesPage'));
const StudyPlannerPage = lazy(() => import('@/features/productivity/pages/StudyPlannerPage'));
const PomodoroTimerPage = lazy(() => import('@/features/productivity/pages/PomodoroTimerPage'));
const GoalTrackerPage = lazy(() => import('@/features/productivity/pages/GoalTrackerPage'));
const HabitTrackerPage = lazy(() => import('@/features/productivity/pages/HabitTrackerPage'));
const ExamCountdownPage = lazy(() => import('@/features/productivity/pages/ExamCountdownPage'));
const WeeklyPlannerPage = lazy(() => import('@/features/productivity/pages/WeeklyPlannerPage'));
const DailyPlannerPage = lazy(() => import('@/features/productivity/pages/DailyPlannerPage'));
const SemesterPlannerPage = lazy(() => import('@/features/productivity/pages/SemesterPlannerPage'));
const AssignmentTrackerPage = lazy(() => import('@/features/productivity/pages/AssignmentTrackerPage'));
const FocusModePage = lazy(() => import('@/features/productivity/pages/FocusModePage'));
const PriorityMatrixPage = lazy(() => import('@/features/productivity/pages/PriorityMatrixPage'));
const CalendarPage = lazy(() => import('@/features/productivity/pages/CalendarPage'));
const PlanMyDayPage = lazy(() => import('@/features/productivity/pages/PlanMyDayPage'));
const DailyRoutinePage = lazy(() => import('@/features/productivity/pages/DailyRoutinePage'));
const DocumentToolsIndexPage = lazy(() => import('@/features/document/pages/DocumentToolsIndexPage'));
const MergePdfPage = lazy(() => import('@/features/document/pages/MergePdfPage'));
const SplitPdfPage = lazy(() => import('@/features/document/pages/SplitPdfPage'));
const CompressPdfPage = lazy(() => import('@/features/document/pages/CompressPdfPage'));
const RotatePdfPage = lazy(() => import('@/features/document/pages/RotatePdfPage'));
const RearrangePdfPage = lazy(() => import('@/features/document/pages/RearrangePdfPage'));
const ExtractPdfPagesPage = lazy(() => import('@/features/document/pages/ExtractPdfPagesPage'));
const DeletePdfPagesPage = lazy(() => import('@/features/document/pages/DeletePdfPagesPage'));
const ImageToPdfPage = lazy(() => import('@/features/document/pages/ImageToPdfPage'));
const PdfToImagePage = lazy(() => import('@/features/document/pages/PdfToImagePage'));
const WordToPdfPage = lazy(() => import('@/features/document/pages/WordToPdfPage'));
const PdfTextExtractPage = lazy(() => import('@/features/document/pages/PdfTextExtractPage'));
const OcrTextExtractionPage = lazy(() => import('@/features/document/pages/OcrTextExtractionPage'));
const ImageCompressorPage = lazy(() => import('@/features/document/pages/ImageCompressorPage'));
const ImageResizerPage = lazy(() => import('@/features/document/pages/ImageResizerPage'));
const ImageCropperPage = lazy(() => import('@/features/document/pages/ImageCropperPage'));
const ImageFormatConverterPage = lazy(() => import('@/features/document/pages/ImageFormatConverterPage'));
const JpgPngConverterPage = lazy(() => import('@/features/document/pages/JpgPngConverterPage'));
const WebpConverterPage = lazy(() => import('@/features/document/pages/WebpConverterPage'));
const ImageMetadataViewerPage = lazy(() => import('@/features/document/pages/ImageMetadataViewerPage'));
const QrGeneratorPage = lazy(() => import('@/features/document/pages/QrGeneratorPage'));
const QrScannerPage = lazy(() => import('@/features/document/pages/QrScannerPage'));
const BarcodeGeneratorPage = lazy(() => import('@/features/document/pages/BarcodeGeneratorPage'));
const CreatorToolsIndexPage = lazy(() => import('@/features/creator/pages/CreatorToolsIndexPage'));
const ColorPickerPage = lazy(() => import('@/features/creator/pages/ColorPickerPage'));
const GradientGeneratorPage = lazy(() => import('@/features/creator/pages/GradientGeneratorPage'));
const PaletteGeneratorPage = lazy(() => import('@/features/creator/pages/PaletteGeneratorPage'));
const AspectRatioCalculatorPage = lazy(() => import('@/features/creator/pages/AspectRatioCalculatorPage'));
const ResolutionCalculatorPage = lazy(() => import('@/features/creator/pages/ResolutionCalculatorPage'));
const DpiCalculatorPage = lazy(() => import('@/features/creator/pages/DpiCalculatorPage'));
const ThumbnailSafeZoneCheckerPage = lazy(() => import('@/features/creator/pages/ThumbnailSafeZoneCheckerPage'));
const SocialMediaSizeGuidePage = lazy(() => import('@/features/creator/pages/SocialMediaSizeGuidePage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'));
const AiAssistantPage = lazy(() => import('@/features/ai/pages/AiAssistantPage'));
const AiSettingsPage = lazy(() => import('@/features/ai/pages/AiSettingsPage'));
const OfflinePage = lazy(() => import('@/pages/OfflinePage'));
const FinanceToolsPage = lazy(() => import('@/pages/FinanceToolsPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'));
const DisclaimerPage = lazy(() => import('@/pages/legal/DisclaimerPage'));
const CookiePolicyPage = lazy(() => import('@/pages/legal/CookiePolicyPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const CgpaCalculatorPage = lazy(() => import('@/features/academic/pages/CgpaCalculatorPage'));
const SgpaCalculatorPage = lazy(() => import('@/features/academic/pages/SgpaCalculatorPage'));
const AttendanceCalculatorPage = lazy(() => import('@/features/academic/pages/AttendanceCalculatorPage'));
const PercentageCalculatorPage = lazy(() => import('@/features/academic/pages/PercentageCalculatorPage'));
const GpaToPercentagePage = lazy(() => import('@/features/academic/pages/GpaToPercentagePage'));
const SemesterPercentagePage = lazy(() => import('@/features/academic/pages/SemesterPercentagePage'));
const MarksRequiredPage = lazy(() => import('@/features/academic/pages/MarksRequiredPage'));
const BudgetPlannerPage = lazy(() => import('@/features/academic/pages/BudgetPlannerPage'));
const ScientificCalculatorPage = lazy(() => import('@/features/academic/pages/ScientificCalculatorPage'));
const AssignmentScorePage = lazy(() => import('@/features/academic/pages/AssignmentScorePage'));
const ExamScorePage = lazy(() => import('@/features/academic/pages/ExamScorePage'));
const StudyHoursPage = lazy(() => import('@/features/academic/pages/StudyHoursPage'));
const DeadlineCalculatorPage = lazy(() => import('@/features/academic/pages/DeadlineCalculatorPage'));
const UnitConverterPage = lazy(() => import('@/features/academic/pages/UnitConverterPage'));

function PageFallback() {
  return <PageSkeleton />;
}

function App() {
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion);
  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
    <ToastProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <CommandPalette />
          <RouteAnalytics />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<RootLayout />}>
                <Route path="/" element={<HomePage />} />
            <Route path="/academic-tools" element={<AcademicToolsPage />} />
            <Route path="/academic-tools/cgpa-calculator" element={<CgpaCalculatorPage />} />
            <Route path="/academic-tools/sgpa-calculator" element={<SgpaCalculatorPage />} />
            <Route path="/academic-tools/attendance-calculator" element={<AttendanceCalculatorPage />} />
            <Route path="/academic-tools/percentage-calculator" element={<PercentageCalculatorPage />} />
            <Route path="/academic-tools/gpa-to-percentage" element={<GpaToPercentagePage />} />
            <Route path="/academic-tools/semester-percentage-calculator" element={<SemesterPercentagePage />} />
            <Route path="/academic-tools/marks-required-calculator" element={<MarksRequiredPage />} />
            <Route path="/academic-tools/budget-planner" element={<BudgetPlannerPage />} />
            <Route path="/academic-tools/scientific-calculator" element={<ScientificCalculatorPage />} />
            <Route path="/academic-tools/assignment-score-calculator" element={<AssignmentScorePage />} />
            <Route path="/academic-tools/exam-score-calculator" element={<ExamScorePage />} />
            <Route path="/academic-tools/study-hours-calculator" element={<StudyHoursPage />} />
            <Route path="/academic-tools/deadline-calculator" element={<DeadlineCalculatorPage />} />
            <Route path="/academic-tools/unit-converter" element={<UnitConverterPage />} />

            <Route path="/productivity" element={<ProductivityIndexPage />} />
            <Route path="/productivity/todo-list" element={<TodoListPage />} />
            <Route path="/productivity/notes" element={<NotesPage />} />
            <Route path="/productivity/study-planner" element={<StudyPlannerPage />} />
            <Route path="/productivity/pomodoro-timer" element={<PomodoroTimerPage />} />
            <Route path="/productivity/goal-tracker" element={<GoalTrackerPage />} />
            <Route path="/productivity/habit-tracker" element={<HabitTrackerPage />} />
            <Route path="/productivity/exam-countdown" element={<ExamCountdownPage />} />
            <Route path="/productivity/weekly-planner" element={<WeeklyPlannerPage />} />
            <Route path="/productivity/daily-planner" element={<DailyPlannerPage />} />
            <Route path="/productivity/semester-planner" element={<SemesterPlannerPage />} />
            <Route path="/productivity/assignment-tracker" element={<AssignmentTrackerPage />} />
            <Route path="/productivity/focus-mode" element={<FocusModePage />} />
            <Route path="/productivity/priority-matrix" element={<PriorityMatrixPage />} />
            <Route path="/productivity/calendar" element={<CalendarPage />} />
            <Route path="/productivity/plan-my-day" element={<PlanMyDayPage />} />
            <Route path="/productivity/daily-routine" element={<DailyRoutinePage />} />
            <Route path="/document-tools" element={<DocumentToolsIndexPage />} />
            <Route path="/document-tools/merge-pdf" element={<MergePdfPage />} />
            <Route path="/document-tools/split-pdf" element={<SplitPdfPage />} />
            <Route path="/document-tools/compress-pdf" element={<CompressPdfPage />} />
            <Route path="/document-tools/rotate-pdf" element={<RotatePdfPage />} />
            <Route path="/document-tools/rearrange-pdf" element={<RearrangePdfPage />} />
            <Route path="/document-tools/extract-pdf-pages" element={<ExtractPdfPagesPage />} />
            <Route path="/document-tools/delete-pdf-pages" element={<DeletePdfPagesPage />} />
            <Route path="/document-tools/image-to-pdf" element={<ImageToPdfPage />} />
            <Route path="/document-tools/pdf-to-image" element={<PdfToImagePage />} />
            <Route path="/document-tools/word-to-pdf" element={<WordToPdfPage />} />
            <Route path="/document-tools/pdf-to-text" element={<PdfTextExtractPage />} />
            <Route path="/document-tools/ocr-text-extraction" element={<OcrTextExtractionPage />} />
            <Route path="/document-tools/image-compressor" element={<ImageCompressorPage />} />
            <Route path="/document-tools/image-resizer" element={<ImageResizerPage />} />
            <Route path="/document-tools/image-cropper" element={<ImageCropperPage />} />
            <Route path="/document-tools/image-format-converter" element={<ImageFormatConverterPage />} />
            <Route path="/document-tools/jpg-png-converter" element={<JpgPngConverterPage />} />
            <Route path="/document-tools/webp-converter" element={<WebpConverterPage />} />
            <Route path="/document-tools/image-metadata-viewer" element={<ImageMetadataViewerPage />} />
            <Route path="/document-tools/qr-code-generator" element={<QrGeneratorPage />} />
            <Route path="/document-tools/qr-code-scanner" element={<QrScannerPage />} />
            <Route path="/document-tools/barcode-generator" element={<BarcodeGeneratorPage />} />
            <Route path="/creator-tools" element={<CreatorToolsIndexPage />} />
            <Route path="/creator-tools/color-picker" element={<ColorPickerPage />} />
            <Route path="/creator-tools/gradient-generator" element={<GradientGeneratorPage />} />
            <Route path="/creator-tools/palette-generator" element={<PaletteGeneratorPage />} />
            <Route path="/creator-tools/aspect-ratio-calculator" element={<AspectRatioCalculatorPage />} />
            <Route path="/creator-tools/resolution-calculator" element={<ResolutionCalculatorPage />} />
            <Route path="/creator-tools/dpi-calculator" element={<DpiCalculatorPage />} />
            <Route path="/creator-tools/thumbnail-safe-zone-checker" element={<ThumbnailSafeZoneCheckerPage />} />
            <Route path="/creator-tools/social-media-size-guide" element={<SocialMediaSizeGuidePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/ai-assistant/settings" element={<AiSettingsPage />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/finance-tools" element={<FinanceToolsPage />} />
            <Route path="/blog" element={<BlogPage />} />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </ToastProvider>
    </MotionConfig>
  );
}

export default App;
