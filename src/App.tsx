import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AlgorithmList } from './components/AlgorithmList';
import { AlgoRunner } from './components/AlgoRunner';
import { Leaderboard } from './components/Leaderboard';
import { UploadModal } from './components/UploadModal';
import { CommentsModal } from './components/CommentsModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserProfilePage } from './components/UserProfilePage';
import { AuthModal } from './components/AuthModal';
import { AlgorithmDoc, UserProfile } from './types/algobox';
import {
  ensureAuthenticated,
  getLocalUserProfile,
  seedInitialAlgorithmsIfEmpty,
  subscribeAlgorithms,
  syncUserProfile,
} from './lib/firestoreService';
import { SAMPLE_ALGORITHMS } from './lib/sampleAlgorithms';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'gallery' | 'runner' | 'leaderboard'>('gallery');
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);
  const [algorithms, setAlgorithms] = useState<AlgorithmDoc[]>([]);
  const [selectedAlgoForRunner, setSelectedAlgoForRunner] = useState<AlgorithmDoc | null>(null);
  const [runnerCode, setRunnerCode] = useState<string>(SAMPLE_ALGORITHMS[0].rawAlgContent);
  const [runnerTitle, setRunnerTitle] = useState<string>(SAMPLE_ALGORITHMS[0].title);
  const [runnerAuthor, setRunnerAuthor] = useState<string>(SAMPLE_ALGORITHMS[0].authorName);
  const [selectedAlgoForComments, setSelectedAlgoForComments] = useState<AlgorithmDoc | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(getLocalUserProfile);

  // Initialize Firebase Auth and Firestore on mount
  useEffect(() => {
    let unsubscribeAlgo: (() => void) | null = null;

    async function init() {
      try {
        const user = await ensureAuthenticated();
        if (user) {
          setUserProfile((prev) => {
            const updated = { ...prev, uid: user.uid };
            syncUserProfile(updated);
            return updated;
          });
        }
      } catch (err) {
        console.warn('Authentication check notice:', err);
      }

      try {
        await seedInitialAlgorithmsIfEmpty();
      } catch (err) {
        console.warn('Seeding initial algorithms notice:', err);
      }

      try {
        unsubscribeAlgo = subscribeAlgorithms((algos) => {
          setAlgorithms(algos);
        });
      } catch (err) {
        console.warn('Subscription algorithms error:', err);
      }
    }

    init();

    return () => {
      if (unsubscribeAlgo) unsubscribeAlgo();
    };
  }, []);

  const handleSelectTab = (tab: 'gallery' | 'runner' | 'leaderboard') => {
    setViewingUsername(null);
    setCurrentTab(tab);
  };

  const handleSelectForRun = (algo: AlgorithmDoc) => {
    setViewingUsername(null);
    setSelectedAlgoForRunner(algo);
    setRunnerCode(algo.rawAlgContent);
    setRunnerTitle(algo.title);
    setRunnerAuthor(algo.authorName);
    setCurrentTab('runner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreatedAndTest = (code: string, title: string) => {
    setViewingUsername(null);
    setSelectedAlgoForRunner(null);
    setRunnerCode(code);
    setRunnerTitle(title);
    setRunnerAuthor(userProfile.displayName);
    setCurrentTab('runner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuthorProfile = (author: string) => {
    setViewingUsername(author);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenProfilePage={handleOpenAuthorProfile}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        userProfile={userProfile}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {viewingUsername ? (
          <UserProfilePage
            targetUsername={viewingUsername}
            currentUser={userProfile}
            algorithms={algorithms}
            onBack={() => setViewingUsername(null)}
            onOpenTestAlgo={handleSelectForRun}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onCurrentUserUpdated={(updated) => setUserProfile(updated)}
          />
        ) : (
          <>
            {currentTab === 'gallery' && (
              <AlgorithmList
                algorithms={algorithms}
                userProfile={userProfile}
                onSelectForRun={handleSelectForRun}
                onOpenComments={(algo) => setSelectedAlgoForComments(algo)}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onAuthorClick={handleOpenAuthorProfile}
              />
            )}

            {currentTab === 'runner' && (
              <AlgoRunner
                key={selectedAlgoForRunner?.id || runnerTitle}
                initialCode={runnerCode}
                algorithmId={selectedAlgoForRunner?.id}
                algorithmTitle={runnerTitle}
                algorithmAuthor={runnerAuthor}
                userProfile={userProfile}
                onAuthorClick={handleOpenAuthorProfile}
                onSelectAlgorithm={(code, title, author, id) => {
                  setRunnerCode(code);
                  setRunnerTitle(title);
                  setRunnerAuthor(author);
                  const found = id ? algorithms.find((a) => a.id === id) : null;
                  setSelectedAlgoForRunner(found || null);
                }}
              />
            )}

            {currentTab === 'leaderboard' && (
              <Leaderboard
                algorithms={algorithms}
                userProfile={userProfile}
                onSelectForRun={handleSelectForRun}
                onAuthorClick={handleOpenAuthorProfile}
              />
            )}
          </>
        )}
      </main>

      {/* Footer with Orange Accent */}
      <footer className="bg-zinc-900 text-zinc-400 border-t border-zinc-800 py-6 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">
              AlgoBox<span className="text-orange-500">Hub</span>
            </span>
            <span>—</span>
            <span>Interpréteur AlgoBox & Communauté de Testeurs</span>
          </div>
          <div className="text-zinc-500">
            Thème Orange Chaleureux • Boutons Arrondis • Firebase Firestore & Auth
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        userProfile={userProfile}
        onCreatedAndTest={handleCreatedAndTest}
      />

      <CommentsModal
        algorithm={selectedAlgoForComments}
        isOpen={Boolean(selectedAlgoForComments)}
        onClose={() => setSelectedAlgoForComments(null)}
        userProfile={userProfile}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={userProfile}
        onLoginSuccess={(updatedUser) => {
          setUserProfile(updatedUser);
        }}
      />
    </div>
  );
}
