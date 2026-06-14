export type MatchStatus = "live" | "upcoming" | "finished";

export type Team = {
  name: string;
  code: string;
  flag: string;
};

export type Match = {
  id: number;
  home: Team;
  away: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  statusLabel: string;
  kickoff: string;
  group: string;
  venue: string;
};

export type Standing = {
  position: number;
  team: Team;
  played: number;
  goalDifference: number;
  points: number;
};

export type WorldCupData = {
  matches: Match[];
  standings: Standing[];
  groupName: string;
  isDemo: boolean;
  source: "API-Football" | "WorldCup26 Community API" | "Demo";
  notice?: string;
  updatedAt: string;
};

const countryCodes: Record<string, string> = {
  Argentina: "ar",
  Australia: "au",
  Belgium: "be",
  Brazil: "br",
  Canada: "ca",
  "Cape Verde": "cv",
  Egypt: "eg",
  France: "fr",
  Germany: "de",
  Japan: "jp",
  Mexico: "mx",
  Morocco: "ma",
  Netherlands: "nl",
  Paraguay: "py",
  Senegal: "sn",
  Spain: "es",
  "South Africa": "za",
  "United States": "us",
};

function flagUrl(name: string) {
  const code = countryCodes[name] ?? "un";
  return `https://flagcdn.com/w80/${code}.png`;
}

function team(name: string, code: string): Team {
  return { name, code, flag: flagUrl(name) };
}

const demoMatches: Match[] = [
  {
    id: 1,
    home: team("Spain", "ESP"),
    away: team("Cape Verde", "CPV"),
    homeScore: 1,
    awayScore: 0,
    status: "live",
    statusLabel: "67'",
    kickoff: "2026-06-15T16:00:00Z",
    group: "Group H",
    venue: "Atlanta Stadium",
  },
  {
    id: 2,
    home: team("Belgium", "BEL"),
    away: team("Egypt", "EGY"),
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    statusLabel: "20:00",
    kickoff: "2026-06-15T20:00:00Z",
    group: "Group G",
    venue: "Seattle Stadium",
  },
  {
    id: 3,
    home: team("France", "FRA"),
    away: team("Senegal", "SEN"),
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    statusLabel: "Tomorrow",
    kickoff: "2026-06-16T19:00:00Z",
    group: "Group I",
    venue: "New York New Jersey Stadium",
  },
  {
    id: 4,
    home: team("Germany", "GER"),
    away: team("Morocco", "MAR"),
    homeScore: 2,
    awayScore: 2,
    status: "finished",
    statusLabel: "FT",
    kickoff: "2026-06-14T19:00:00Z",
    group: "Group E",
    venue: "Houston Stadium",
  },
  {
    id: 5,
    home: team("Brazil", "BRA"),
    away: team("Japan", "JPN"),
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    statusLabel: "FT",
    kickoff: "2026-06-14T22:00:00Z",
    group: "Group F",
    venue: "Los Angeles Stadium",
  },
];

const demoStandings: Standing[] = [
  {
    position: 1,
    team: team("Spain", "ESP"),
    played: 1,
    goalDifference: 2,
    points: 3,
  },
  {
    position: 2,
    team: team("Belgium", "BEL"),
    played: 1,
    goalDifference: 1,
    points: 3,
  },
  {
    position: 3,
    team: team("Cape Verde", "CPV"),
    played: 1,
    goalDifference: -1,
    points: 0,
  },
  {
    position: 4,
    team: team("Egypt", "EGY"),
    played: 1,
    goalDifference: -2,
    points: 0,
  },
];

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue: { name: string | null };
  };
  league: { round: string };
  teams: {
    home: { name: string; code: string | null; logo: string };
    away: { name: string; code: string | null; logo: string };
  };
  goals: { home: number | null; away: number | null };
};

type ApiStanding = {
  rank: number;
  team: { name: string; code?: string; logo: string };
  all: { played: number };
  goalsDiff: number;
  points: number;
};

type CommunityTeam = {
  id: string;
  name_en: string;
  fifa_code: string;
  flag: string;
};

type CommunityGame = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_score: string;
  away_score: string;
  group: string;
  local_date: string;
  finished: string;
  time_elapsed: string;
  type: string;
  stadium_id: string;
};

type CommunityStadium = {
  id: string;
  name_en: string;
};

type CommunityGroup = {
  name: string;
  teams: {
    team_id: string;
    mp: string;
    gd: string;
    pts: string;
  }[];
};

function mapStatus(short: string): MatchStatus {
  if (["1H", "HT", "2H", "ET", "P", "BT", "LIVE"].includes(short)) {
    return "live";
  }
  if (["FT", "AET", "PEN"].includes(short)) {
    return "finished";
  }
  return "upcoming";
}

function apiTeam(value: { name: string; code: string | null; logo: string }): Team {
  return {
    name: value.name,
    code: value.code ?? value.name.slice(0, 3).toUpperCase(),
    flag: countryCodes[value.name] ? flagUrl(value.name) : value.logo,
  };
}

async function fetchApi(path: string, key: string) {
  const response = await fetch(`https://v3.football.api-sports.io/${path}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`API-Football returned ${response.status}`);
  }

  const data = await response.json();
  const apiErrors = data.errors as Record<string, string> | undefined;

  if (apiErrors && Object.keys(apiErrors).length > 0) {
    throw new Error(Object.values(apiErrors).join(" "));
  }

  return data;
}

async function fetchCommunity(path: string) {
  const response = await fetch(`https://worldcup26.ir/get/${path}`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`WorldCup26 Community API returned ${response.status}`);
  }

  return response.json();
}

const stadiumUtcOffsets: Record<string, string> = {
  "1": "-06:00",
  "2": "-06:00",
  "3": "-06:00",
  "4": "-05:00",
  "5": "-05:00",
  "6": "-05:00",
  "7": "-04:00",
  "8": "-04:00",
  "9": "-04:00",
  "10": "-04:00",
  "11": "-04:00",
  "12": "-04:00",
  "13": "-07:00",
  "14": "-07:00",
  "15": "-07:00",
  "16": "-07:00",
};

function communityDate(value: string, stadiumId: string) {
  const [date, time] = value.split(" ");
  const [month, day, year] = date.split("/");
  const offset = stadiumUtcOffsets[stadiumId] ?? "Z";

  return `${year}-${month}-${day}T${time}:00${offset}`;
}

async function getCommunityData(): Promise<WorldCupData> {
  const [gameData, teamData, groupData, stadiumData] = await Promise.all([
    fetchCommunity("games"),
    fetchCommunity("teams"),
    fetchCommunity("groups"),
    fetchCommunity("stadiums"),
  ]);

  const communityTeams = teamData.teams as CommunityTeam[];
  const teamById = new Map(communityTeams.map((item) => [item.id, item]));
  const stadiumById = new Map(
    (stadiumData.stadiums as CommunityStadium[]).map((item) => [
      item.id,
      item.name_en,
    ]),
  );

  const toTeam = (id: string, fallbackName: string): Team => {
    const item = teamById.get(id);
    const name = item?.name_en ?? fallbackName;

    return {
      name,
      code: item?.fifa_code ?? name.slice(0, 3).toUpperCase(),
      flag: item?.flag ?? flagUrl(name),
    };
  };

  const matches = (gameData.games as CommunityGame[])
    .filter(
      (item) =>
        item.home_team_name_en &&
        item.away_team_name_en &&
        item.home_team_id !== "0" &&
        item.away_team_id !== "0",
    )
    .map((item) => {
      const status: MatchStatus =
        item.finished.toUpperCase() === "TRUE"
          ? "finished"
          : item.time_elapsed.toLowerCase() === "notstarted"
            ? "upcoming"
            : "live";
      const elapsed = item.time_elapsed.replace(/[^0-9]/g, "");

      return {
        id: Number(item.id),
        home: toTeam(item.home_team_id, item.home_team_name_en!),
        away: toTeam(item.away_team_id, item.away_team_name_en!),
        homeScore: status === "upcoming" ? null : Number(item.home_score),
        awayScore: status === "upcoming" ? null : Number(item.away_score),
        status,
        statusLabel:
          status === "finished"
            ? "FT"
            : status === "live"
              ? elapsed
                ? `${elapsed}'`
                : "LIVE"
              : "Scheduled",
        kickoff: communityDate(item.local_date, item.stadium_id),
        group: item.type === "group" ? `Group ${item.group}` : item.group,
        venue: stadiumById.get(item.stadium_id) ?? "World Cup 2026",
      } satisfies Match;
    })
    .sort((a, b) => {
      const priority = { live: 0, upcoming: 1, finished: 2 };
      return (
        priority[a.status] - priority[b.status] ||
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );
    });

  if (matches.length === 0) {
    throw new Error("WorldCup26 Community API returned no matches.");
  }

  const activeMatch = matches.find((match) => match.status === "live") ?? matches[0];
  const activeGroupName = activeMatch.group.startsWith("Group ")
    ? activeMatch.group.slice(6)
    : "A";
  const activeGroup = (groupData.groups as CommunityGroup[]).find(
    (group) => group.name === activeGroupName,
  );

  const standings = (activeGroup?.teams ?? [])
    .map((row) => {
      const item = teamById.get(row.team_id);
      if (!item) return null;

      return {
        position: 0,
        team: {
          name: item.name_en,
          code: item.fifa_code,
          flag: item.flag,
        },
        played: Number(row.mp),
        goalDifference: Number(row.gd),
        points: Number(row.pts),
      };
    })
    .filter((row): row is Omit<Standing, "position"> & { position: number } => row !== null)
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        a.team.name.localeCompare(b.team.name),
    )
    .map((row, index) => ({ ...row, position: index + 1 }));

  return {
    matches,
    standings,
    groupName: `Group ${activeGroupName}`,
    isDemo: false,
    source: "WorldCup26 Community API",
    notice:
      "Free community data can occasionally update more slowly than official feeds.",
    updatedAt: new Date().toISOString(),
  };
}

export async function getWorldCupData(): Promise<WorldCupData> {
  const key = process.env.API_FOOTBALL_KEY;
  const useApiFootball =
    process.env.WORLD_CUP_DATA_PROVIDER === "api-football" && Boolean(key);

  if (!useApiFootball) {
    try {
      return await getCommunityData();
    } catch (error) {
      console.error("Community World Cup data unavailable:", error);
      return {
        matches: demoMatches,
        standings: demoStandings,
        groupName: "Group H",
        isDemo: true,
        source: "Demo",
        notice: "The free community data source is currently unavailable.",
        updatedAt: new Date().toISOString(),
      };
    }
  }

  try {
    const [fixtureData, standingData] = await Promise.all([
      fetchApi("fixtures?league=1&season=2026", key!),
      fetchApi("standings?league=1&season=2026", key!),
    ]);

    const fixtures = (fixtureData.response as ApiFixture[])
      .map((item) => {
        const status = mapStatus(item.fixture.status.short);
        return {
          id: item.fixture.id,
          home: apiTeam(item.teams.home),
          away: apiTeam(item.teams.away),
          homeScore: item.goals.home,
          awayScore: item.goals.away,
          status,
          statusLabel:
            status === "live"
              ? `${item.fixture.status.elapsed ?? 0}'`
              : item.fixture.status.short,
          kickoff: item.fixture.date,
          group: item.league.round.replace("Group Stage - ", "Matchday "),
          venue: item.fixture.venue.name ?? "Venue to be confirmed",
        } satisfies Match;
      })
      .sort((a, b) => {
        const priority = { live: 0, upcoming: 1, finished: 2 };
        return priority[a.status] - priority[b.status] ||
          new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      });

    if (fixtures.length === 0) {
      throw new Error("API-Football returned no World Cup fixtures.");
    }

    const firstGroup =
      standingData.response?.[0]?.league?.standings?.[0] ?? [];
    const standings = (firstGroup as ApiStanding[]).map((item) => ({
      position: item.rank,
      team: {
        name: item.team.name,
        code: item.team.code ?? item.team.name.slice(0, 3).toUpperCase(),
        flag: countryCodes[item.team.name] ? flagUrl(item.team.name) : item.team.logo,
      },
      played: item.all.played,
      goalDifference: item.goalsDiff,
      points: item.points,
    }));

    return {
      matches: fixtures,
      standings,
      groupName: "Group A",
      isDemo: false,
      source: "API-Football",
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("API-Football unavailable, trying community data:", error);
    const message =
      error instanceof Error
        ? error.message
        : "API-Football could not provide live data.";

    try {
      const communityData = await getCommunityData();
      return {
        ...communityData,
        notice: `${message} Using the free community feed instead.`,
      };
    } catch (communityError) {
      console.error("Community World Cup data unavailable:", communityError);
      return {
        matches: demoMatches,
        standings: demoStandings,
        groupName: "Group H",
        isDemo: true,
        source: "Demo",
        notice: `${message} The community fallback is also unavailable.`,
        updatedAt: new Date().toISOString(),
      };
    }
  }
}
