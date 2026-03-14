import { useEffect, useMemo, useState } from "react";
import type { Group, Match, StandingsResponse, TeamSlot } from "./data/bracket";
import { fallbackStandings, stages as initialStages } from "./data/bracket";

const getWinsNeeded = (bestOf: number) => Math.ceil(bestOf / 2);

const cloneStages = (value: typeof initialStages) => structuredClone(value);

const getMatchWinnerIndex = (match: Match) => {
  if (match.score[0] === match.score[1]) {
    return null;
  }
  const winsNeeded = getWinsNeeded(match.bestOf);
  if (match.score[0] >= winsNeeded) return 0;
  if (match.score[1] >= winsNeeded) return 1;
  return null;
};

const findMatch = (
  stages: typeof initialStages,
  stageId: string,
  groupId: string,
  matchId: string,
) => {
  const stage = stages.find((item) => item.id === stageId);
  if (!stage) return null;
  const group = stage.groups.find((item) => item.id === groupId);
  if (!group) return null;
  for (const round of group.rounds) {
    const match = round.matches.find((item) => item.id === matchId);
    if (match) return match;
  }
  return null;
};

const buildStandingsIndex = (standings: StandingsResponse) => {
  const map = new Map<string, string>();
  for (const team of standings.west) {
    map.set(team.id, team.name);
  }
  for (const team of standings.east) {
    map.set(team.id, team.name);
  }
  return map;
};

const getSeedTeam = (
  standings: StandingsResponse,
  conference: "west" | "east",
  seed: number,
) => standings[conference].find((team) => team.seed === seed) ?? null;

const resolveTeamId = (
  stages: typeof initialStages,
  slot: TeamSlot,
  standings: StandingsResponse,
): string | null => {
  if (slot.teamId) return slot.teamId;
  if (slot.seedSource) {
    const seedTeam = getSeedTeam(standings, slot.seedSource.conference, slot.seedSource.seed);
    return seedTeam?.id ?? null;
  }
  if (!slot.source) return null;
  const match = findMatch(stages, slot.source.stageId, slot.source.groupId, slot.source.matchId);
  if (!match) return null;
  const winnerIndex = getMatchWinnerIndex(match);
  if (winnerIndex === null) return null;
  const winnerSlot = match.teams[winnerIndex];
  return resolveTeamId(stages, winnerSlot, standings);
};

const getTeamLabel = (
  stages: typeof initialStages,
  slot: TeamSlot,
  standings: StandingsResponse,
  standingsIndex: Map<string, string>,
) => {
  const teamId = resolveTeamId(stages, slot, standings);
  if (!teamId) return "Ожидается";
  return standingsIndex.get(teamId) ?? "Ожидается";
};

const getTeamId = (
  stages: typeof initialStages,
  slot: TeamSlot,
  standings: StandingsResponse,
) => resolveTeamId(stages, slot, standings);

const getSeedLabel = (slot: TeamSlot) => {
  if (!slot.seedSource) return "";
  return String(slot.seedSource.seed);
};

const MatchCard = ({
  match,
  stages,
  stageId,
  groupId,
  onPick,
  standings,
  standingsIndex,
}: {
  match: Match;
  stages: typeof initialStages;
  stageId: string;
  groupId: string;
  onPick: (stageId: string, groupId: string, matchId: string, winnerIndex: 0 | 1) => void;
  standings: StandingsResponse;
  standingsIndex: Map<string, string>;
}) => {
  const winnerIndex = getMatchWinnerIndex(match);
  const winsNeeded = getWinsNeeded(match.bestOf);
  return (
    <div className="match-card">
      <div className="match-meta">
        <span className="best-of">До {winsNeeded} побед</span>
        <span className="score">
          {match.score[0]} - {match.score[1]}
        </span>
      </div>
      <button
        className={`team-row ${winnerIndex === 0 ? "team-row--winner" : ""}`}
        onClick={() => onPick(stageId, groupId, match.id, 0)}
        disabled={!getTeamId(stages, match.teams[0], standings)}
      >
        <span className="team-name">
          {getTeamLabel(stages, match.teams[0], standings, standingsIndex)}
        </span>
        <span className="team-seed">{getSeedLabel(match.teams[0])}</span>
      </button>
      <button
        className={`team-row ${winnerIndex === 1 ? "team-row--winner" : ""}`}
        onClick={() => onPick(stageId, groupId, match.id, 1)}
        disabled={!getTeamId(stages, match.teams[1], standings)}
      >
        <span className="team-name">
          {getTeamLabel(stages, match.teams[1], standings, standingsIndex)}
        </span>
        <span className="team-seed">{getSeedLabel(match.teams[1])}</span>
      </button>
    </div>
  );
};

const GroupView = ({
  group,
  stages,
  stageId,
  onPick,
  standings,
  standingsIndex,
}: {
  group: Group;
  stages: typeof initialStages;
  stageId: string;
  onPick: (stageId: string, groupId: string, matchId: string, winnerIndex: 0 | 1) => void;
  standings: StandingsResponse;
  standingsIndex: Map<string, string>;
}) => {
  return (
    <section className="group">
      <h3>{group.title}</h3>
      <div className="rounds">
        {group.rounds.map((round) => (
          <div key={round.id} className="round">
            <div className="round-title">{round.title}</div>
            <div className="matches">
              {round.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  stages={stages}
                  stageId={stageId}
                  groupId={group.id}
                  onPick={onPick}
                  standings={standings}
                  standingsIndex={standingsIndex}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const fetchStandings = async (): Promise<StandingsResponse> => {
  const response = await fetch("/.netlify/functions/standings");
  if (!response.ok) {
    throw new Error("Failed to load standings");
  }
  return response.json();
};

export default function App() {
  const [stages, setStages] = useState(() => cloneStages(initialStages));
  const [activeStageId, setActiveStageId] = useState(stages[0].id);
  const [standings, setStandings] = useState<StandingsResponse>(fallbackStandings);
  const [standingsStatus, setStandingsStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    setStandingsStatus("loading");
    fetchStandings()
      .then((data) => {
        if (cancelled) return;
        setStandings(data);
        setStandingsStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStandings(fallbackStandings);
        setStandingsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const standingsIndex = useMemo(() => buildStandingsIndex(standings), [standings]);

  const activeStage = useMemo(
    () => stages.find((stage) => stage.id === activeStageId) ?? stages[0],
    [stages, activeStageId],
  );

  const handlePick = (
    stageId: string,
    groupId: string,
    matchId: string,
    winnerIndex: 0 | 1,
  ) => {
    setStages((current) => {
      const next = cloneStages(current);
      const match = findMatch(next, stageId, groupId, matchId);
      if (!match) return current;
      const winsNeeded = getWinsNeeded(match.bestOf);
      match.score = winnerIndex === 0 ? [winsNeeded, 0] : [0, winsNeeded];
      return next;
    });
  };

  const handleReset = () => {
    setStages(cloneStages(initialStages));
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">KHL SIM</div>
        <div className="topbar-center">
          <button className="chip">R6</button>
          <button className="chip chip--active">Плей-офф 2025/26</button>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button">Как использовать</button>
          <button className="primary-button">О проекте</button>
        </div>
      </header>

      {standingsStatus === "error" && (
        <div className="status-banner">
          Не удалось загрузить таблицу КХЛ, используем локальные данные.
        </div>
      )}

      {standingsStatus === "loading" && (
        <div className="status-banner status-banner--info">Загружаем актуальную таблицу...</div>
      )}

      <main>
        <section className="hero">
          <div className="hero-card">
            <div className="hero-subtitle">Симулятор плей-офф КХЛ</div>
            <h1>Плей-офф КХЛ 2025/26: симуляция результатов</h1>
            <p>
              Выбирайте победителей матчей, чтобы увидеть путь команд к Кубку Гагарина. Со
              2-й стадии команды делятся на группы с перекрестным плей-офф.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={handleReset}>
                Сбросить результаты
              </button>
              <button className="ghost-button">Поделиться</button>
            </div>
          </div>
        </section>

        <section className="stage-tabs">
          {stages.map((stage) => (
            <button
              key={stage.id}
              className={`stage-tab ${stage.id === activeStageId ? "stage-tab--active" : ""}`}
              onClick={() => setActiveStageId(stage.id)}
            >
              {stage.title}
            </button>
          ))}
        </section>

        <section className="stage">
          <div className="stage-header">
            <h2>{activeStage.title}</h2>
            <span className="stage-subtitle">{activeStage.subtitle}</span>
          </div>
          <div className="groups">
            {activeStage.groups.map((group) => (
              <GroupView
                key={group.id}
                group={group}
                stages={stages}
                stageId={activeStage.id}
                onPick={handlePick}
                standings={standings}
                standingsIndex={standingsIndex}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>Данные берутся из таблицы КХЛ и кэшируются для стабильной работы.</div>
      </footer>
    </div>
  );
}

