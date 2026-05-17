"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type PageHeaderState = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
};

type PageHeaderContextValue = {
  state: PageHeaderState;
  setState: (state: PageHeaderState) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PageHeaderState>({});

  return (
    <PageHeaderContext.Provider value={{ state, setState }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeaderState() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error("usePageHeaderState must be used within PageHeaderProvider");
  }
  return context;
}

export function useRegisterPageHeader(state: PageHeaderState) {
  const { setState } = usePageHeaderState();

  useEffect(() => {
    setState(state);
    return () => setState({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- title/subtitle drive header text; actions/tabs set on mount
  }, [setState, state.title, state.subtitle]);
}
