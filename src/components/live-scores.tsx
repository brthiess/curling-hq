"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { nextGenerationUrl, scoreDelayed, stableBrowse } from "@/lib/live";

type Publication = {
  generation_id: string;
  scheduled: boolean;
  worker?: {
    state?: string;
    heartbeat?: string;
    failures?: unknown[];
    cycle_overrun?: boolean;
  };
};
export function LiveScores({
  generation,
  failed = false,
  children,
}: {
  generation?: string;
  failed?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const lastGood = useRef<{
    content: React.ReactNode;
    generation?: string;
    path: string;
  } | null>(null);
  if (!failed)
    lastGood.current = { content: children, generation, path: pathname };
  const preserved =
    failed && lastGood.current?.path === pathname ? lastGood.current : null;
  const displayed = preserved?.generation ?? generation;
  const [latest, setLatest] = useState<Publication | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dirtyFilters, setDirtyFilters] = useState(false);
  const [pending, startTransition] = useTransition();
  const inflight = useRef(false);
  const editing = useRef(false);
  const check = useRef<(manual?: boolean) => Promise<void>>(async () => {});
  useEffect(() => {
    editing.current = false;
    setDirtyFilters(false);
  }, [pathname, query]);
  useEffect(() => {
    check.current = async (manual = false) => {
      if (
        inflight.current ||
        editing.current ||
        (!manual &&
          (document.hidden ||
            editing.current ||
            document.activeElement?.matches(
              "input:not([type=hidden]),select,textarea",
            )))
      )
        return;
      inflight.current = true;
      setChecking(true);
      try {
        const response = await fetch(
          "/api/publication?" +
            new URLSearchParams({
              page: pathname,
              query,
              ...(manual ? { ready: "true" } : {}),
            }),
          { cache: "no-store", signal: AbortSignal.timeout(15000) },
        );
        if (!response.ok) throw new Error("Publication unavailable");
        const publication: Publication = await response.json();
        setLatest(publication);
        setUnavailable(false);
        const different = publication.generation_id !== displayed;
        if (
          manual ||
          (different && !stableBrowse(pathname, new URLSearchParams(query)))
        ) {
          // Preflight validates the complete replacement before navigation.
          if (!manual) {
            const ready = await fetch(
              "/api/publication?" +
                new URLSearchParams({
                  page: pathname,
                  query,
                  ready: "true",
                  generation: publication.generation_id,
                }),
              { cache: "no-store", signal: AbortSignal.timeout(15000) },
            );
            if (!ready.ok) throw new Error("Replacement unavailable");
          }
          startTransition(() => {
            const href = nextGenerationUrl(
              window.location.href,
              publication.generation_id,
            );
            router.replace(href, { scroll: false });
            if (!different) router.refresh();
          });
        }
      } catch {
        setUnavailable(true);
      } finally {
        inflight.current = false;
        setChecking(false);
      }
    };
    const visible = () => {
      if (!document.hidden) void check.current();
    };
    const dirty = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("form")) {
        editing.current = true;
        setDirtyFilters(true);
      }
    };
    const timer = window.setInterval(() => void check.current(), 60_000);
    document.addEventListener("visibilitychange", visible);
    document.addEventListener("input", dirty);
    document.addEventListener("change", dirty);
    void check.current();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      document.removeEventListener("input", dirty);
      document.removeEventListener("change", dirty);
    };
  }, [pathname, query, displayed, router]);
  const available = latest && latest.generation_id !== displayed;
  const delayed =
    latest?.scheduled &&
    (!latest.worker?.heartbeat ||
      scoreDelayed(latest.worker.heartbeat) ||
      latest.worker?.state === "stopped" ||
      latest.worker?.state === "delayed" ||
      Boolean(latest.worker?.failures?.length) ||
      latest.worker?.cycle_overrun);
  const message = dirtyFilters
    ? "Apply your filters to resume updates"
    : checking || pending
      ? "Checking for score updates…"
      : failed || unavailable
        ? "Updates unavailable · showing the last loaded results"
        : available
          ? "Updated scores available"
          : delayed
            ? "Score updates delayed · check observation times below"
            : latest?.scheduled
              ? "Score checks scheduled every 2 minutes"
              : "Published results · refresh available";
  return (
    <>
      <div
        className={
          "refresh-bar container" +
          (failed || unavailable || delayed ? " refresh-delayed" : "")
        }
        role="status"
        aria-live="polite"
        data-generation={displayed}
      >
        <span>
          <span className="refresh-dot" />
          {message}
        </span>
        <button
          type="button"
          disabled={checking || pending || dirtyFilters}
          onClick={() => void check.current(true)}
        >
          {available ? "Update scores" : "Refresh"}{" "}
          <span aria-hidden="true">↻</span>
        </button>
      </div>
      {preserved?.content ?? children}
    </>
  );
}
export function ScoreStatus({
  open,
  at,
  label,
}: {
  open: boolean;
  at: string | null;
  label: string;
}) {
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    const update = () => setDelayed(open && scoreDelayed(at));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [open, at]);
  return (
    <span className={"status" + (delayed ? " delayed" : open ? " open" : "")}>
      {delayed ? "Score delayed" : label}
    </span>
  );
}
