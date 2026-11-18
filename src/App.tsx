import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { RefreshCw } from 'lucide-react';
import { auth } from './lib/firebase';
import {
  ensureUserAndSeedData,
  subscribeComplaints,
  subscribeNotifications,
  subscribePromises,
  subscribeUserProfile,
} from './services/firestoreService';
import {
  Complaint,
  NavTabId,
  NotificationItem,
  PromiseItem,
  UserProfile,
} from './types/resolveloop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { MyComplaintsView } from './components/MyComplaintsView';
import { SubmitComplaintView } from './components/SubmitComplaintView';
import { TrackProgressView } from './components/TrackProgressView';
import { PromiseTrackerView } from './components/PromiseTrackerView';
import { NotificationsView } from './components/NotificationsView';
import { ConfirmResolutionView } from './components/ConfirmResolutionView';
import { MyProfileView } from './components/MyProfileView';
import { LogoutModal } from './components/LogoutModal';

function getPageTitle(tab: NavTabId): { leading?: string; accent?: string; suffix?: string } {
  switch (tab) {
    case 'dashboard':
      return { leading: 'Workspace', accent: 'Dashboard' };
    case 'submit':
      return { leading: 'Submit', accent: 'Complaint' };
    case 'complaints':
      return { leading: 'My', accent: 'Complaints' };
    case 'track':
      return { leading: 'Track', accent: 'Progress' };
    case 'promises':
      return { accent: 'Promise Tracker' };
    case 'confirm':
      return { leading: 'Confirm Your', accent: 'Solution!' };
    case 'notifications':
      return { leading: 'Notifications' };
    case 'profile':
      return { leading: 'My', accent: 'Profile' };
  }
}

function ResolveLoopWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [promises, setPromises] = useState<PromiseItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [activeTab, setActiveTab] = useState<NavTabId>('complaints');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Complaint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        setSeeding(true);
        try {
          await ensureUserAndSeedData(nextUser);
        } finally {
          setSeeding(false);
        }
      } else {
        setProfile(null);
        setComplaints([]);
        setPromises([]);
        setNotifications([]);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, setProfile);
    const unsubComplaints = subscribeComplaints(user.uid, setComplaints);
    const unsubPromises = subscribePromises(user.uid, setPromises);
    const unsubNotifications = subscribeNotifications(user.uid, setNotifications);
    return () => {
      unsubProfile();
      unsubComplaints();
      unsubPromises();
      unsubNotifications();
    };
  }, [user?.uid]);

  if (!authReady || (user && seeding && complaints.length === 0)) {
    return (
      <div className="min-h-screen rl-pastel-canvas flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#f04f2d] mb-4 animate-pulse">
          <RefreshCw className="w-7 h-7" />
        </div>
        <p className="font-display font-bold text-slate-900 text-base">Loading ResolveLoop...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayName = profile?.fullName || user.displayName || 'Priya Sharma';
  const locationLabel = profile?.location || 'Coimbatore, India';
  const titleParts = getPageTitle(activeTab);

  const aiTip =
    activeTab === 'submit'
      ? 'Mention order ID and dates for faster specialist routing.'
      : activeTab === 'promises'
        ? 'Live countdowns verify every SLA promise in real time.'
        : 'All complaint updates and refund traces are synced live.';

  const handleConfirmLogout = async () => {
    setLogoutOpen(false);
    await signOut(auth);
  };

  return (
    <div className="min-h-screen rl-workspace-canvas p-3 sm:p-5">
      <div className="max-w-[1440px] mx-auto flex gap-6 items-start">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab !== 'submit') setEditingDraft(null);
            setActiveTab(tab);
          }}
          onOpenLogout={() => setLogoutOpen(true)}
          unreadNotifications={unreadCount}
          locationLabel={locationLabel}
          aiTip={aiTip}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 py-1">
          <TopHeader
            titleLeading={titleParts.leading}
            titleAccent={titleParts.accent}
            titleSuffix={titleParts.suffix}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            profile={profile}
            fallbackName={displayName}
            photoUrl={user.photoURL}
            unreadCount={unreadCount}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onNavigate={(tab) => setActiveTab(tab)}
          />

          {activeTab === 'dashboard' && (
            <DashboardView
              customerName={displayName}
              complaints={complaints}
              promises={promises}
              onNavigate={setActiveTab}
              onSelectComplaint={(id, target) => {
                setSelectedComplaintId(id);
                setActiveTab(target);
              }}
            />
          )}

          {activeTab === 'complaints' && (
            <MyComplaintsView
              complaints={complaints}
              globalSearch={searchQuery}
              onSelectForTrack={(id) => {
                setSelectedComplaintId(id);
                setActiveTab('track');
              }}
              onSelectForConfirm={(id) => {
                setSelectedComplaintId(id);
                setActiveTab('confirm');
              }}
              onEditDraft={(draft) => {
                setEditingDraft(draft);
                setActiveTab('submit');
              }}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'submit' && (
            <SubmitComplaintView
              uid={user.uid}
              customerName={displayName}
              draftComplaint={editingDraft}
              onClearDraft={() => setEditingDraft(null)}
              onSubmitted={(complaintId, isDraft) => {
                setSelectedComplaintId(complaintId);
                setActiveTab(isDraft ? 'complaints' : 'track');
              }}
            />
          )}

          {activeTab === 'track' && (
            <TrackProgressView
              uid={user.uid}
              customerName={displayName}
              complaints={complaints}
              selectedComplaintId={selectedComplaintId}
              onSelectComplaintId={setSelectedComplaintId}
            />
          )}

          {activeTab === 'promises' && (
            <PromiseTrackerView
              promises={promises}
              onOpenComplaint={(complaintId, tab) => {
                setSelectedComplaintId(complaintId);
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onConfirmFromNotification={(complaintId) => {
                setSelectedComplaintId(complaintId);
                setActiveTab('confirm');
              }}
              onOpenComplaintTrack={(complaintId) => {
                setSelectedComplaintId(complaintId);
                setActiveTab('track');
              }}
            />
          )}

          {activeTab === 'confirm' && (
            <ConfirmResolutionView
              complaints={complaints}
              selectedComplaintId={selectedComplaintId}
              onSelectComplaintId={setSelectedComplaintId}
              onCompleted={() => setActiveTab('complaints')}
            />
          )}

          {activeTab === 'profile' && (
            <MyProfileView
              uid={user.uid}
              profile={profile}
              fallbackEmail={user.email || ''}
              fallbackName={displayName}
              photoUrl={user.photoURL}
            />
          )}
        </main>
      </div>

      <LogoutModal
        open={logoutOpen}
        photoUrl={user.photoURL}
        customerName={displayName}
        onStay={() => setLogoutOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ResolveLoopWorkspace />
    </ErrorBoundary>
  );
}
