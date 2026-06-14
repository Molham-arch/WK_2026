"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Match, MatchStatus, Team, WorldCupData } from "@/lib/world-cup";

type Filter = "all" | MatchStatus;

const filters: { label: string; value: Filter }[] = [
  { label: "All matches", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Results", value: "finished" },
];

function subscribeToTimeZone() {
  return () => {};
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerTimeZone() {
  return null;
}

function formatMatchTime(kickoff: string, timeZone: string | null) {
  if (!timeZone) return "--:--";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(kickoff));
}

function formatMatchDay(kickoff: string, timeZone: string | null) {
  if (!timeZone) return "---";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(kickoff));
}

function Flag({ team, large = false }: { team: Team; large?: boolean }) {
  return (
    <span
      className={`relative shrink-0 overflow-hidden rounded-md border border-black/10 bg-white shadow-sm ${
        large ? "h-12 w-16 md:h-14 md:w-20" : "h-6 w-8"
      }`}
    >
      <Image
        src={team.flag}
        alt={`${team.name} flag`}
        fill
        sizes={large ? "80px" : "32px"}
        className="object-cover"
      />
    </span>
  );
}

function TeamLine({ team, align = "left" }: { team: Team; align?: "left" | "right" }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <Flag team={team} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{team.name}</p>
        <p className="text-xs tracking-[0.14em] text-[var(--muted)]">{team.code}</p>
      </div>
    </div>
  );
}

function FeaturedMatch({
  match,
  timeZone,
}: {
  match: Match;
  timeZone: string | null;
}) {
  const matchTime = formatMatchTime(match.kickoff, timeZone);

  return (
    <section className="score-grid relative overflow-hidden rounded-[2rem] bg-[var(--green)] p-5 text-white shadow-[0_24px_60px_rgba(18,54,42,0.18)] sm:p-8">
      <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border-[34px] border-white/5" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
          {match.status === "live" && (
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-[var(--orange)]" />
          )}
          {match.status === "live" ? "Live now" : match.statusLabel}
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
          {match.group}
        </span>
      </div>

      <div className="relative mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-8">
        <div className="flex min-w-0 flex-col items-center gap-3 text-center">
          <Flag team={match.home} large />
          <div>
            <h2 className="display text-xl font-bold md:text-3xl">{match.home.name}</h2>
            <p className="mt-1 text-xs tracking-[0.2em] text-white/55">{match.home.code}</p>
          </div>
        </div>

        <div className="text-center">
          {match.homeScore !== null ? (
            <div className="display flex items-center gap-2 text-5xl font-bold tracking-tight md:text-7xl">
              <span>{match.homeScore}</span>
              <span className="text-white/25">:</span>
              <span>{match.awayScore}</span>
            </div>
          ) : (
            <div className="display text-3xl font-bold">{matchTime}</div>
          )}
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--lime)]">
            {match.statusLabel}
          </p>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-3 text-center">
          <Flag team={match.away} large />
          <div>
            <h2 className="display text-xl font-bold md:text-3xl">{match.away.name}</h2>
            <p className="mt-1 text-xs tracking-[0.2em] text-white/55">{match.away.code}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-center text-xs text-white/55">
        <PinIcon />
        {match.venue}
      </div>
    </section>
  );
}

function MatchRow({
  match,
  timeZone,
}: {
  match: Match;
  timeZone: string | null;
}) {
  const time = formatMatchTime(match.kickoff, timeZone);
  const day = formatMatchDay(match.kickoff, timeZone);

  return (
    <article className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[var(--line)] py-5 last:border-0">
      <TeamLine team={match.home} />
      <div className="min-w-20 text-center">
        {match.homeScore !== null ? (
          <p className="display text-xl font-bold">
            {match.homeScore} <span className="text-black/25">:</span> {match.awayScore}
          </p>
        ) : (
          <p className="display text-sm font-bold">{time}</p>
        )}
        <p
          className={`mt-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            match.status === "live" ? "text-[var(--orange)]" : "text-[var(--muted)]"
          }`}
        >
          {match.status === "upcoming" ? day : match.statusLabel}
        </p>
      </div>
      <TeamLine team={match.away} align="right" />
    </article>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function Dashboard({ data }: { data: WorldCupData }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone,
  );
  const featured = data.matches.find((match) => match.status === "live") ?? data.matches[0];
  const featuredId = featured?.id;

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [router]);

  const visibleMatches = useMemo(
    () =>
      data.matches.filter(
        (match) => match.id !== featuredId && (filter === "all" || match.status === filter),
      ),
    [data.matches, featuredId, filter],
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-black/10 bg-[var(--paper)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#" className="display flex items-center gap-3 text-xl font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--green)] text-[var(--lime)]">
              26
            </span>
            MATCHDAY
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a href="#matches" className="text-[var(--green)]">Matches</a>
            <a href="#standings" className="transition hover:text-[var(--green)]">Standings</a>
            <a href="#teams" className="transition hover:text-[var(--green)]">Teams</a>
          </nav>

          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full border border-black/15 md:hidden"
            aria-label="Toggle menu"
          >
            <span className="text-xl">{menuOpen ? "x" : "="}</span>
          </button>
          <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Auto refresh 30s
          </div>
        </div>
        {menuOpen && (
          <nav className="flex gap-6 border-t border-black/10 px-5 py-4 text-sm font-semibold md:hidden">
            <a href="#matches">Matches</a>
            <a href="#standings">Standings</a>
            <a href="#teams">Teams</a>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--green)]">
              FIFA World Cup 2026
            </p>
            <h1 className="display max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-6xl">
              Every match. <span className="text-[var(--green)]">One place.</span>
            </h1>
          </div>
          <div className="text-sm text-[var(--muted)] sm:text-right">
            <p>Canada / Mexico / United States</p>
            <p className="mt-1 font-semibold text-[var(--ink)]">June 11 - July 19</p>
            <p className="mt-2 text-xs">
              Times shown in{" "}
              <strong className="text-[var(--green)]">
                {timeZone?.replaceAll("_", " ") ?? "your local time"}
              </strong>
            </p>
          </div>
        </div>

        {data.isDemo && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <span><strong>Demo mode:</strong> {data.notice}</span>
            <span>Sample scores are for layout preview only.</span>
          </div>
        )}
        {!data.isDemo && data.source === "WorldCup26 Community API" && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-950">
            <span><strong>Free live feed:</strong> {data.notice}</span>
            <span>Source: WorldCup26 Community API</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <div className="min-w-0">
            {featured && <FeaturedMatch match={featured} timeZone={timeZone} />}

            <section id="matches" className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Tournament feed
                  </p>
                  <h2 className="display mt-1 text-2xl font-bold">Matches</h2>
                </div>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {filters.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setFilter(item.value)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                        filter === item.value
                          ? "bg-[var(--ink)] text-white"
                          : "bg-black/5 hover:bg-black/10"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                {visibleMatches.length ? (
                  visibleMatches.map((match) => (
                    <MatchRow key={match.id} match={match} timeZone={timeZone} />
                  ))
                ) : (
                  <p className="py-10 text-center text-sm text-[var(--muted)]">
                    No matches in this view.
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section id="standings" className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Standings
                  </p>
                  <h2 className="display mt-1 text-2xl font-bold">{data.groupName}</h2>
                </div>
                <button className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold">
                  View all
                </button>
              </div>

              <div className="mt-5 grid grid-cols-[24px_1fr_30px_36px_32px] gap-2 border-b border-[var(--line)] pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <span>#</span><span>Team</span><span>P</span><span>GD</span><span>Pts</span>
              </div>
              {data.standings.length ? (
                data.standings.map((row) => (
                  <div
                    key={row.team.code}
                    className="grid grid-cols-[24px_1fr_30px_36px_32px] items-center gap-2 border-b border-[var(--line)] py-4 text-sm last:border-0"
                  >
                    <span className={`font-bold ${row.position < 3 ? "text-[var(--green)]" : "text-[var(--muted)]"}`}>
                      {row.position}
                    </span>
                    <div className="flex min-w-0 items-center gap-2">
                      <Flag team={row.team} />
                      <span className="truncate font-semibold">{row.team.name}</span>
                    </div>
                    <span>{row.played}</span>
                    <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                    <strong>{row.points}</strong>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-[var(--muted)]">
                  Standings are not available yet.
                </p>
              )}
              <div className="mt-4 flex gap-4 text-[10px] text-[var(--muted)]">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--green)]" /> Advances</span>
                <span>P: Played</span>
                <span>GD: Goal diff.</span>
              </div>
            </section>

            <section id="teams" className="overflow-hidden rounded-[1.5rem] bg-[var(--lime)] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--green)]">
                Tournament pulse
              </p>
              <p className="display mt-3 text-3xl font-bold leading-tight">
                48 nations.<br />104 matches.<br />One champion.
              </p>
              <div className="mt-7 flex items-center justify-between border-t border-black/15 pt-4 text-xs font-semibold">
                <span>Updated {formatMatchTime(data.updatedAt, timeZone)}</span>
                <span className="text-xl">→</span>
              </div>
            </section>
          </aside>
        </div>

        <footer className="mt-10 border-t border-black/10 py-8 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-purple-200 bg-purple-50/80 px-6 py-3 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.65)]" />
            <p className="display bg-gradient-to-r from-purple-800 via-fuchsia-700 to-purple-600 bg-clip-text text-lg font-black italic tracking-wide text-transparent sm:text-xl">
              Developed By Molham Alam
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
