import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { NavigationTab, StoriesRouteParams, NavigationContextValue } from './types';

const NavigationContext = createContext<NavigationContextValue | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode; initialTab?: NavigationTab }> = ({
  children,
  initialTab = 'Home',
}) => {
  const [activeTab, setActiveTabState] = useState<NavigationTab>(initialTab);
  const [history, setHistory] = useState<NavigationTab[]>([initialTab]);
  const [activeStory, setActiveStory] = useState<StoriesRouteParams | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState<boolean>(false);

  const setActiveTab = useCallback((tab: NavigationTab) => {
    setActiveTabState(tab);
    setHistory((prev) => (prev[prev.length - 1] === tab ? prev : [...prev, tab]));
  }, []);

  const openStories = useCallback((params: StoriesRouteParams) => {
    setActiveStory(params);
  }, []);

  const closeStories = useCallback(() => {
    setActiveStory(null);
  }, []);

  const openStoryCreation = useCallback(() => {
    setIsCreatingStory(true);
  }, []);

  const closeStoryCreation = useCallback(() => {
    setIsCreatingStory(false);
  }, []);

  const canGoBack = history.length > 1;

  const goBack = useCallback(() => {
    if (isCreatingStory) {
      closeStoryCreation();
      return;
    }
    if (activeStory) {
      closeStories();
      return;
    }
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const prevTab = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setActiveTabState(prevTab);
    }
  }, [history, activeStory, closeStories, isCreatingStory, closeStoryCreation]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      activeStory,
      openStories,
      closeStories,
      isCreatingStory,
      openStoryCreation,
      closeStoryCreation,
      canGoBack,
      goBack,
    }),
    [
      activeTab,
      setActiveTab,
      activeStory,
      openStories,
      closeStories,
      isCreatingStory,
      openStoryCreation,
      closeStoryCreation,
      canGoBack,
      goBack,
    ]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextValue => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
};
