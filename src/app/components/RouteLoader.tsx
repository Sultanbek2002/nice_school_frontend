"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function RouteLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const rafRef      = useRef<number>(0);
  const trickleRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef   = useRef(0);
  const progressRef = useRef(0);
  const runningRef  = useRef(false);

  const render = useCallback(() => {
    progressRef.current += (targetRef.current - progressRef.current) * 0.12;
    if (Math.abs(targetRef.current - progressRef.current) < 0.1) {
      progressRef.current = targetRef.current;
    }
    setProgress(Math.round(progressRef.current));
    rafRef.current = requestAnimationFrame(render);
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    progressRef.current = 0;
    targetRef.current = 12;
    setVisible(true);
    setProgress(0);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
    trickleRef.current = setInterval(() => {
      targetRef.current = Math.min(90, targetRef.current + Math.random() * 12);
    }, 250);
  }, [render]);

  const done = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (trickleRef.current) clearInterval(trickleRef.current);
    targetRef.current = 100;
    setTimeout(() => {
      setVisible(false);
      cancelAnimationFrame(rafRef.current);
      progressRef.current = 0;
      targetRef.current = 0;
      setProgress(0);
    }, 600);
  }, []);

  // Route change complete → done
  useEffect(() => {
    done();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial page load
  useEffect(() => {
    start();
    if (document.readyState === "complete") {
      done();
    } else {
      window.addEventListener("load", done, { once: true });
    }
    return () => window.removeEventListener("load", done);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Intercept internal link clicks → start
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || (a as HTMLAnchorElement).target === "_blank" || a.hasAttribute("download")) return;
      try {
        const url = new URL(a.getAttribute("href")!, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search) return;
        start();
      } catch {}
    };
    document.addEventListener("click", handler, true);
    window.addEventListener("pageshow", (ev) => { if (ev.persisted) done(); });
    return () => document.removeEventListener("click", handler, true);
  }, [start, done]);

  if (!visible && progress === 0) return null;

  return (
    <>
      <style>{`
        @keyframes nl-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Top progress bar */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 3,
        background: "rgba(0, 74, 173, 0.12)",
        zIndex: 10000,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}>
        <div style={{
          position: "relative",
          height: "100%",
          width: `${progress}%`,
          background: "#004AAD",
          boxShadow: "0 0 10px rgba(0, 74, 173, 0.6)",
          transition: "width 0.12s linear",
        }}>
          {/* Glow dot at tip */}
          <div style={{
            position: "absolute",
            right: -1, top: "50%",
            transform: "translateY(-50%)",
            width: 5, height: 5,
            borderRadius: "50%",
            background: "#004AAD",
            boxShadow: "0 0 8px 2px rgba(0, 74, 173, 0.7)",
          }} />
        </div>
      </div>

      {/* Bottom chip */}
      <div style={{
        position: "fixed",
        bottom: 22,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#071A3C",
        color: "#EAF1FB",
        padding: "9px 16px",
        borderRadius: 100,
        boxShadow: "0 8px 20px -8px rgba(7, 26, 60, 0.5)",
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        fontSize: 11,
        letterSpacing: 2,
        whiteSpace: "nowrap",
      }}>
        {/* Spinner */}
        <div style={{
          width: 12, height: 12,
          border: "2px solid rgba(143, 180, 228, 0.4)",
          borderTopColor: "#8FB4E4",
          borderRadius: "50%",
          animation: "nl-spin 0.8s linear infinite",
        }} />
        <span>LOADING</span>
        <span style={{ color: "#8FB4E4", letterSpacing: 1 }}>{progress}%</span>
      </div>
    </>
  );
}
