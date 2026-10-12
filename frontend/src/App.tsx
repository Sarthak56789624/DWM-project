import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, TabId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { DistributionsPage } from './pages/DistributionsPage';
import { ChannelsCategoriesPage } from './pages/ChannelsCategoriesPage';
import { RelationshipsPage } from './pages/RelationshipsPage';
import { TimeTrendsPage } from './pages/TimeTrendsPage';
import { TopVideosPage } from './pages/TopVideosPage';
import { RegressionLabPage } from './pages/RegressionLabPage';
import { ClassifierPage } from './pages/ClassifierPage';
import { ClusterExplorerPage } from './pages/ClusterExplorerPage';
import { AssociationMiningPage } from './pages/AssociationMiningPage';
import { CreatorSimulatorPage } from './pages/CreatorSimulatorPage';
import { LiveAnalyzerPage } from './pages/LiveAnalyzerPage';
import { ExecutiveReportPage } from './pages/ExecutiveReportPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<TabId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* Sticky Top Navigation */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        {/* Page Container with AnimatePresence transitions */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {currentTab === 'overview' && (
                <OverviewPage onNavigateTab={setCurrentTab} />
              )}
              {currentTab === 'distributions' && <DistributionsPage />}
              {currentTab === 'channels' && <ChannelsCategoriesPage />}
              {currentTab === 'relationships' && <RelationshipsPage />}
              {currentTab === 'trends' && <TimeTrendsPage />}
              {currentTab === 'videos' && <TopVideosPage />}
              {currentTab === 'regression' && <RegressionLabPage />}
              {currentTab === 'classifier' && <ClassifierPage />}
              {currentTab === 'clustering' && <ClusterExplorerPage />}
              {currentTab === 'mining' && <AssociationMiningPage />}
              {currentTab === 'creator' && <CreatorSimulatorPage />}
              {currentTab === 'live' && <LiveAnalyzerPage />}
              {currentTab === 'report' && <ExecutiveReportPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
