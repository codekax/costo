import { create } from 'zustand';

/**
 * Holds the current screen's title so the top bar (ContentHeader) can render it
 * — the Linear pattern where the page title lives in the chrome, not as a big
 * in-page h1. Each screen declares its title via <PageTitle>; the store bridges
 * that to the persistent shell. Single active page → a single shared value.
 */
type PageTitleState = {
  title: string | null;
  setTitle: (title: string | null) => void;
};

export const usePageTitle = create<PageTitleState>((set) => ({
  title: null,
  setTitle: (title) => set({ title }),
}));
