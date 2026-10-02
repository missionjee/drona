import React, { useState, useEffect } from 'react';
import {
  CustomSyllabusConfig,
  EphemeralTestSession,
  PersistentPerformanceRecord,
  PipelineProgress,
  UserProfile,
} from './types';
import { executeGenerationPipeline } from './services/generationPipeline';
import { calculatePerformanceRecord } from './utils/scoring';
import { getWeeklyTestQuota } from './utils/testLimit';
import {
  fetchUserProfile,
  saveUserProfile,
  fetchTestHistory,
  autoUploadTestResult,
} from './services/supabaseService';
import { Sidebar, ActiveNavTab } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TestArsenalView } from './components/TestArsenalView';
import { SyllabusSelector } from './components/SyllabusSelector';
import { LibraryView } from './components/LibraryView';
import { ProfileView } from './components/ProfileView';
import { CbtExamView } from './components/CbtExamView';
import { TestResultView } from './components/TestResultView';
import { GenerationProgressModal } from './components/GenerationProgressModal';
import { ApiKeyModal } from './components/ApiKeyModal';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('arsenal');
  const [currentView, setCurrentView] = useState<'app' | 'exam' | 'results'>('app');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // High-contrast theme toggle
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('jee_ai_theme') !== 'light';
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Divesh Sah',
    email: 'diveshsah2@gmail.com',
    stream: 'jee',
    classLevel: '12',
    targetCollege: 'IIT Bombay / Computer Science',
    targetRank: 'AIR < 500',
    syncEnabled: true,
  });

  // Modals
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Pipeline generation progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);

  // Active Ephemeral Test Session (IN-MEMORY ONLY)
  const [activeSession, setActiveSession] = useState<EphemeralTestSession | null>(null);
  const [currentAnalytics, setCurrentAnalytics] = useState<PersistentPerformanceRecord | null>(null);

  // Persistent Performance History
  const [pastRecords, setPastRecords] = useState<PersistentPerformanceRecord[]>([]);

  // Load User Profile and Test History on mount
  useEffect(() => {
    fetchUserProfile().then((p) => setUserProfile(p));
    fetchTestHistory().then((h) => setPastRecords(h));
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('jee_ai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('jee_ai_theme', 'light');
    }
  }, [darkMode]);

  // Handler: Launch AI Custom Syllabus Generation Pipeline
  const handleGenerateCustomTest = async (config: CustomSyllabusConfig) => {
    const quota = getWeeklyTestQuota(pastRecords);
    if (!quota.canCreate) {
      alert(`Weekly limit reached (${quota.testsCreatedThisWeek}/3 mock tests created this week).\n\nYour weekly quota will reset on ${quota.resetsOn}.`);
      return;
    }

    setIsGenerating(true);
    try {
      const generatedQuestions = await executeGenerationPipeline(config, (progress) => {
        setPipelineProgress(progress);
      });

      const chCount =
        (config.selectedChapters.physics?.length || 0) +
        (config.selectedChapters.chemistry?.length || 0) +
        (config.selectedChapters.mathematics?.length || 0) +
        (config.selectedChapters.biology?.length || 0);

      const examLabel =
        config.examType === 'jee_advanced'
          ? 'JEE Advanced'
          : config.examType === 'neet'
          ? 'NEET-UG'
          : 'JEE Main';

      const session: EphemeralTestSession = {
        id: `ephemeral-${Date.now()}`,
        title: `${examLabel} Custom Mock (${chCount} Chapters)`,
        examType: config.examType,
        syllabusSummary: config.selectedChapters,
        durationMinutes: config.durationMinutes,
        startTime: Date.now(),
        questions: generatedQuestions,
        responses: {},
        isCompleted: false,
        proctorStrikes: 0,
      };

      setTimeout(() => {
        setIsGenerating(false);
        setPipelineProgress(null);
        setActiveSession(session);
        setCurrentView('exam');
      }, 500);
    } catch (err: any) {
      setIsGenerating(false);
      setPipelineProgress(null);
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Handler: Submit Exam (Auto or Manual)
  const handleSubmitExam = async (proctorAutoSubmitted: boolean = false) => {
    if (!activeSession) return;

    // Calculate score analytics
    const analysis = calculatePerformanceRecord(
      activeSession.questions,
      activeSession.responses,
      activeSession.examType,
      activeSession.durationMinutes,
      activeSession.title
    );

    if (proctorAutoSubmitted) {
      analysis.proctorStrikes = 3;
    }

    // AUTO-UPLOAD TEST RESULTS DIRECTLY TO TEST ARSENAL & SUPABASE
    await autoUploadTestResult(analysis);
    const updatedHistory = await fetchTestHistory();
    setPastRecords(updatedHistory);

    setCurrentAnalytics(analysis);
    setActiveSession({
      ...activeSession,
      isCompleted: true,
      autoSubmittedForProctoring: proctorAutoSubmitted,
    });
    setCurrentView('results');
  };

  // Handler: Finish Test and Discard Ephemeral Raw Paper
  const handleFinishAndPurge = () => {
    setActiveSession(null);
    setCurrentAnalytics(null);
    setCurrentView('app');
    setActiveTab('arsenal');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Active CBT Exam Viewport (Locks Screen) */}
      {currentView === 'exam' && activeSession && (
        <CbtExamView
          session={activeSession}
          onUpdateResponses={(resp) =>
            setActiveSession({ ...activeSession, responses: resp })
          }
          onSubmitTest={handleSubmitExam}
          onExitTest={() => {
            if (confirm('Are you sure you want to abort the exam? Your current progress will be lost.')) {
              handleFinishAndPurge();
            }
          }}
        />
      )}

      {/* Test Results & Download PDF Viewport */}
      {currentView === 'results' && activeSession && currentAnalytics && (
        <TestResultView
          session={activeSession}
          analytics={currentAnalytics}
          onRetake={() => {
            setCurrentView('app');
            setActiveTab('series');
          }}
          onFinishAndPurge={handleFinishAndPurge}
          onOpenApiKeyModal={() => setShowApiKeyModal(true)}
          userProfile={userProfile}
        />
      )}

      {/* Main Unified App Layout */}
      {currentView === 'app' && (
        <div className="flex h-screen overflow-hidden">
          {/* Unified Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            userProfile={userProfile}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            supabaseConnected={true}
          />

          {/* Main Frame Viewport */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Topbar
              activeTab={activeTab}
              onOpenMobile={() => setIsMobileMenuOpen(true)}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              userProfile={userProfile}
              onOpenProfile={() => setActiveTab('profile')}
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {activeTab === 'arsenal' && (
                <TestArsenalView
                  pastRecords={pastRecords}
                  userProfile={userProfile}
                  onNavigateToSeries={() => setActiveTab('series')}
                  onSelectTestRecord={(rec) => {
                    // Quick modal or focus
                  }}
                />
              )}

              {activeTab === 'series' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        CBT Test Series Synthesizer
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Select chapters to generate genuine tests matching {userProfile.stream === 'neet' ? 'NEET-UG' : 'JEE Main & Advanced'} PYQ standards. Fullscreen proctoring enabled.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition"
                    >
                      Gemini API Key
                    </button>
                  </div>

                  <SyllabusSelector
                    onGenerateTest={handleGenerateCustomTest}
                    isGenerating={isGenerating}
                    userStream={userProfile.stream}
                    pastRecords={pastRecords}
                  />
                </div>
              )}

              {activeTab === 'library' && <LibraryView />}

              {activeTab === 'profile' && (
                <ProfileView
                  userProfile={userProfile}
                  onUpdateProfile={(up) => setUserProfile(up)}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Generation Progress Modal */}
      <GenerationProgressModal
        isOpen={isGenerating}
        progress={pipelineProgress}
      />

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </div>
  );
}

export default App;
