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
  saveArchivedTestSession,
  getArchivedTestSession,
  signInWithGoogle,
  signOutUser,
  getAuthUser,
  subscribeAuthState,
  isUserLoggedIn,
  setUserLoggedIn,
  checkActiveSession,
} from './services/supabaseService';
import { LoginView } from './components/LoginView';
import { Sidebar, ActiveNavTab } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TestArsenalView } from './components/TestArsenalView';
import { SyllabusSelector } from './components/SyllabusSelector';
import { LibraryView } from './components/LibraryView';
import { ProfileView } from './components/ProfileView';
import { CbtExamView } from './components/CbtExamView';
import { TestResultView } from './components/TestResultView';
import { GenerationProgressModal } from './components/GenerationProgressModal';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('arsenal');
  const [currentView, setCurrentView] = useState<'login' | 'app' | 'exam' | 'results'>(() => {
    try {
      const saved = sessionStorage.getItem('drona_active_exam_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.session && !parsed.session.isCompleted) {
          return 'exam';
        }
      }
    } catch {
      // ignore parse errors
    }

    const hasAuthCallback =
      window.location.hash.includes('access_token=') ||
      window.location.search.includes('code=');

    if (hasAuthCallback || isUserLoggedIn()) {
      return 'app';
    }
    return 'login';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);

  // High-contrast theme toggle
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('jee_ai_theme') !== 'light';
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'JEE Aspirant',
    email: 'aspirant@missionjee.org',
    stream: 'jee',
    classLevel: '12',
    targetCollege: 'IIT Bombay / Computer Science',
    targetRank: 'AIR < 500',
    syncEnabled: true,
  });

  // Pipeline generation progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);

  // Active Test Session with persistent recovery during active exam
  const [activeSession, setActiveSession] = useState<EphemeralTestSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('drona_active_exam_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.session && !parsed.session.isCompleted) {
          return parsed.session;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  });
  const [currentAnalytics, setCurrentAnalytics] = useState<PersistentPerformanceRecord | null>(null);

  // Persistent Performance History
  const [pastRecords, setPastRecords] = useState<PersistentPerformanceRecord[]>([]);

  // Load User Profile, Test History and Google Auth on mount
  useEffect(() => {
    fetchUserProfile().then((p) => setUserProfile(p));
    fetchTestHistory().then((h) => setPastRecords(h));

    // Check active Supabase session or process OAuth tokens in URL
    checkActiveSession().then((sessionData) => {
      if (sessionData?.user) {
        setIsGoogleAuthenticated(true);
        setUserLoggedIn(true);
        setCurrentView('app');
        const user = sessionData.user;
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (name || avatar || user.email) {
          setUserProfile((prev) => {
            const updated = {
              ...prev,
              name: name || prev.name,
              email: user.email || prev.email,
              avatarUrl: avatar || prev.avatarUrl,
            };
            saveUserProfile(updated);
            return updated;
          });
        }
      }
    });

    if (window.location.hash.includes('access_token=') || window.location.search.includes('code=')) {
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 600);
    }

    getAuthUser().then((user) => {
      if (user) {
        setIsGoogleAuthenticated(true);
        setUserLoggedIn(true);
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (name || avatar || user.email) {
          setUserProfile((prev) => {
            const updated = {
              ...prev,
              name: name || prev.name,
              email: user.email || prev.email,
              avatarUrl: avatar || prev.avatarUrl,
            };
            saveUserProfile(updated);
            return updated;
          });
        }
      }
    });

    const unsubscribe = subscribeAuthState((user) => {
      if (user) {
        setIsGoogleAuthenticated(true);
        setUserLoggedIn(true);
        setCurrentView('app');
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        setUserProfile((prev) => {
          const updated = {
            ...prev,
            name: name || prev.name,
            email: user.email || prev.email,
            avatarUrl: avatar || prev.avatarUrl,
          };
          saveUserProfile(updated);
          return updated;
        });
        fetchTestHistory().then((h) => setPastRecords(h));
      } else {
        setIsGoogleAuthenticated(false);
      }
    });

    return () => {
      unsubscribe();
    };
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

  // Synchronize ongoing test session with sessionStorage for crash/refresh resilience
  useEffect(() => {
    if (currentView === 'exam' && activeSession && !activeSession.isCompleted) {
      sessionStorage.setItem('drona_active_exam_state', JSON.stringify({ session: activeSession }));
    } else if (currentView !== 'exam' || !activeSession || activeSession.isCompleted) {
      sessionStorage.removeItem('drona_active_exam_state');
    }
  }, [currentView, activeSession]);

  // Guard against accidental tab closure or browser refresh during active exam
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentView === 'exam' && activeSession && !activeSession.isCompleted) {
        e.preventDefault();
        e.returnValue = 'Your test is currently in progress. If you leave, your active test session will be interrupted.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentView, activeSession]);

  // Handler: Reset Weekly Test Quota for Practice Mode
  const handleResetWeeklyQuota = () => {
    const updated = pastRecords.map((r) => ({
      ...r,
      timestamp: r.timestamp - 8 * 86400000,
    }));
    setPastRecords(updated);
    localStorage.setItem('drona_test_history', JSON.stringify(updated));
    alert('Weekly mock test quota reset! You can now generate and start tests for practice.');
  };

  // Handler: Launch AI Custom Syllabus Generation Pipeline
  const handleGenerateCustomTest = async (config: CustomSyllabusConfig) => {
    const quota = getWeeklyTestQuota(pastRecords);
    if (!quota.canCreate) {
      const confirmReset = confirm(
        `Weekly limit reached (${quota.testsCreatedThisWeek}/3 mock tests created this week).\n\nReset your test quota now to start this practice test?`
      );
      if (confirmReset) {
        handleResetWeeklyQuota();
      } else {
        return;
      }
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

    // Save archived test session with question data and user responses, keyed by analysis.id
    const finalSession: EphemeralTestSession = {
      ...activeSession,
      id: analysis.id,
      isCompleted: true,
      autoSubmittedForProctoring: proctorAutoSubmitted,
    };
    saveArchivedTestSession(finalSession);
    sessionStorage.removeItem('drona_active_exam_state');

    setCurrentAnalytics(analysis);
    setActiveSession(finalSession);
    setCurrentView('results');
  };

  // Handler: Inspect past test paper and solutions
  const handleReviewSolutions = (rec: PersistentPerformanceRecord) => {
    const archived = getArchivedTestSession(rec.id);
    if (archived && archived.questions && archived.questions.length > 0) {
      setActiveSession(archived);
      setCurrentAnalytics(rec);
      setCurrentView('results');
    } else {
      alert(`Detailed questions for "${rec.title}" are not cached in local storage.`);
    }
  };

  // Handler: Finish Test and Return to Arsenal
  const handleFinishAndPurge = () => {
    sessionStorage.removeItem('drona_active_exam_state');
    setActiveSession(null);
    setCurrentAnalytics(null);
    setCurrentView('app');
    setActiveTab('arsenal');
  };

  // Handler: Successful Login from LoginView
  const handleLoginSuccess = (profile: UserProfile, isGoogle: boolean) => {
    setUserProfile(profile);
    setIsGoogleAuthenticated(isGoogle);
    setUserLoggedIn(true);
    setCurrentView('app');
    fetchTestHistory().then((h) => setPastRecords(h));
  };

  // Handler: Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      alert(`Google Sign-In: ${error.message || 'Unable to open Google login'}`);
    }
  };

  // Handler: Sign-Out to Login Screen
  const handleSignOut = async () => {
    await signOutUser();
    setIsGoogleAuthenticated(false);
    setUserLoggedIn(false);
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* First Screen: Dedicated Login & Welcome View */}
      {currentView === 'login' && (
        <LoginView
          initialProfile={userProfile}
          onLoginSuccess={handleLoginSuccess}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      )}

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
          userProfile={userProfile}
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
            onSignOut={handleSignOut}
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
              onGoogleSignIn={handleGoogleSignIn}
              onSignOut={handleSignOut}
              isGoogleAuthenticated={isGoogleAuthenticated}
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {activeTab === 'arsenal' && (
                <TestArsenalView
                  pastRecords={pastRecords}
                  userProfile={userProfile}
                  onNavigateToSeries={() => setActiveTab('series')}
                  onSelectTestRecord={handleReviewSolutions}
                />
              )}

              {activeTab === 'series' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <SyllabusSelector
                    onGenerateTest={handleGenerateCustomTest}
                    onResetQuota={handleResetWeeklyQuota}
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
                  onGoogleSignIn={handleGoogleSignIn}
                  onSignOut={handleSignOut}
                  isGoogleAuthenticated={isGoogleAuthenticated}
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
    </div>
  );
}

export default App;
