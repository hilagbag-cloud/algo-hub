import React, { useState } from 'react';
import { Terminal, Trophy, Plus, Compass, Sparkles, User, LogIn, ChevronDown, Award } from 'lucide-react';
import { UserProfile } from '../types/algobox';
import { formatUsername } from '../lib/firestoreService';

interface NavbarProps {
  currentTab: 'gallery' | 'runner' | 'leaderboard';
  onSelectTab: (tab: 'gallery' | 'runner' | 'leaderboard') => void;
  onOpenUpload: () => void;
  onOpenProfile: () => void;
  onOpenProfilePage: (username: string) => void;
  onOpenAuthModal: () => void;
  userProfile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
  onOpenProfile,
  onOpenProfilePage,
  onOpenAuthModal,
  userProfile,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const formattedUsername = formatUsername(userProfile.username || userProfile.displayName);
  const isPermanentUser = Boolean(userProfile.username && userProfile.email);

  return (
    <header className="sticky top-0 z-40 w-full bg-white text-zinc-900 border-b border-orange-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => onSelectTab('gallery')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-mono font-black text-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            [A]
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg text-zinc-900 font-mono">
                AlgoBox<span className="text-orange-500 font-bold">Hub</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                .alg
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Rounded Full */}
        <nav className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-full border border-zinc-200">
          <button
            id="nav-tab-gallery"
            onClick={() => onSelectTab('gallery')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentTab === 'gallery'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Galerie</span>
          </button>

          <button
            id="nav-tab-runner"
            onClick={() => onSelectTab('runner')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentTab === 'runner'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Tester en direct</span>
          </button>

          <button
            id="nav-tab-leaderboard"
            onClick={() => onSelectTab('leaderboard')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentTab === 'leaderboard'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Classement</span>
          </button>
        </nav>

        {/* Actions & User */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-open-upload"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-sm shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Publier .alg</span>
          </button>

          {/* User Account / Profile Dropdown */}
          <div className="relative">
            <button
              id="btn-user-profile"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full border border-zinc-200 hover:border-orange-300 bg-white text-zinc-800 transition-all text-xs shadow-2xs hover:shadow-xs cursor-pointer"
              title="Menu utilisateur"
            >
              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-mono text-[11px] font-bold uppercase">
                {userProfile.displayName.charAt(0) || 'U'}
              </div>
              <span className="font-extrabold text-orange-600 max-w-[110px] truncate hidden sm:inline">
                {formattedUsername}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <div className="text-[11px] text-zinc-400 font-semibold">Connecté en tant que</div>
                    <div className="text-xs font-black text-orange-600 truncate">{formattedUsername}</div>
                    <div className="text-[11px] text-zinc-500 truncate">{userProfile.displayName}</div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfilePage(formattedUsername);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>Page Profil {formattedUsername}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Modifier Bio & Pseudo</span>
                    </button>
                  </div>

                  <div className="border-t border-zinc-100 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isPermanentUser ? 'Changer de Pseudo' : 'Choisir mon @pseudo'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
