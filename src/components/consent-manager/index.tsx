"use client";

import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useState,
} from "react";
import { loadConsentManager, onConsentManagerLoad } from "./preferences";

const ConsentManagerProvider = lazy(() => import("./provider"));

class LoadFailure extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function ConsentManager() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const unsubscribe = onConsentManagerLoad(() => setLoad(true));

    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const whenIdle = () => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(loadConsentManager, {
          timeout: 2_000,
        });
      else timer = setTimeout(loadConsentManager, 200);
    };

    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    return () => {
      unsubscribe();
      window.removeEventListener("load", whenIdle);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  if (!load) return null;

  return (
    <LoadFailure>
      <Suspense fallback={null}>
        <ConsentManagerProvider />
      </Suspense>
    </LoadFailure>
  );
}
