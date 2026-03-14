export type Team = {
  id: string;
  name: string;
};

export type Conference = "west" | "east";

export type TeamSource = {
  stageId: string;
  groupId: string;
  matchId: string;
};

export type SeedSource = {
  conference: Conference;
  seed: number;
};

export type TeamSlot = {
  teamId?: string;
  source?: TeamSource;
  seedSource?: SeedSource;
};

export type Match = {
  id: string;
  round: string;
  bestOf: number;
  teams: [TeamSlot, TeamSlot];
  score: [number, number];
};

export type Round = {
  id: string;
  title: string;
  matches: Match[];
};

export type Group = {
  id: string;
  title: string;
  rounds: Round[];
};

export type Stage = {
  id: string;
  title: string;
  subtitle: string;
  groups: Group[];
};

export type StandingsTeam = {
  id: string;
  name: string;
  seed: number;
};

export type StandingsResponse = {
  updatedAt: string;
  west: StandingsTeam[];
  east: StandingsTeam[];
};

export const fallbackStandings: StandingsResponse = {
  updatedAt: "local",
  west: [
    { id: "ska", name: "СКА", seed: 1 },
    { id: "lok", name: "Локомотив", seed: 2 },
    { id: "dinm", name: "Динамо М", seed: 3 },
    { id: "sevt", name: "Северсталь", seed: 4 },
    { id: "cska", name: "ЦСКА", seed: 5 },
    { id: "tor", name: "Торпедо", seed: 6 },
    { id: "min", name: "Минск", seed: 7 },
    { id: "soch", name: "Сочи", seed: 8 }
  ],
  east: [
    { id: "met", name: "Металлург", seed: 1 },
    { id: "akb", name: "Ак Барс", seed: 2 },
    { id: "avt", name: "Автомобилист", seed: 3 },
    { id: "salm", name: "Салават Юлаев", seed: 4 },
    { id: "trat", name: "Трактор", seed: 5 },
    { id: "sibir", name: "Сибирь", seed: 6 },
    { id: "bar", name: "Барыс", seed: 7 },
    { id: "amur", name: "Амур", seed: 8 }
  ]
};

export const stages: Stage[] = [
  {
    id: "stage-1",
    title: "Стадия 1",
    subtitle: "Первый раунд по конференциям",
    groups: [
      {
        id: "west-1",
        title: "Запад",
        rounds: [
          {
            id: "r1",
            title: "Раунд 1",
            matches: [
              {
                id: "w1",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "west", seed: 1 } },
                  { seedSource: { conference: "west", seed: 8 } }
                ],
                score: [0, 0]
              },
              {
                id: "w2",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "west", seed: 2 } },
                  { seedSource: { conference: "west", seed: 7 } }
                ],
                score: [0, 0]
              },
              {
                id: "w3",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "west", seed: 3 } },
                  { seedSource: { conference: "west", seed: 6 } }
                ],
                score: [0, 0]
              },
              {
                id: "w4",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "west", seed: 4 } },
                  { seedSource: { conference: "west", seed: 5 } }
                ],
                score: [0, 0]
              }
            ]
          }
        ]
      },
      {
        id: "east-1",
        title: "Восток",
        rounds: [
          {
            id: "r1",
            title: "Раунд 1",
            matches: [
              {
                id: "e1",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "east", seed: 1 } },
                  { seedSource: { conference: "east", seed: 8 } }
                ],
                score: [0, 0]
              },
              {
                id: "e2",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "east", seed: 2 } },
                  { seedSource: { conference: "east", seed: 7 } }
                ],
                score: [0, 0]
              },
              {
                id: "e3",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "east", seed: 3 } },
                  { seedSource: { conference: "east", seed: 6 } }
                ],
                score: [0, 0]
              },
              {
                id: "e4",
                round: "r1",
                bestOf: 7,
                teams: [
                  { seedSource: { conference: "east", seed: 4 } },
                  { seedSource: { conference: "east", seed: 5 } }
                ],
                score: [0, 0]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "stage-2",
    title: "Стадия 2",
    subtitle: "Перекрестный плей-офф",
    groups: [
      {
        id: "cross-a",
        title: "Группа А",
        rounds: [
          {
            id: "r1",
            title: "Четвертьфиналы",
            matches: [
              {
                id: "c1",
                round: "r1",
                bestOf: 7,
                teams: [
                  { source: { stageId: "stage-1", groupId: "west-1", matchId: "w1" } },
                  { source: { stageId: "stage-1", groupId: "east-1", matchId: "e4" } }
                ],
                score: [0, 0]
              },
              {
                id: "c2",
                round: "r1",
                bestOf: 7,
                teams: [
                  { source: { stageId: "stage-1", groupId: "west-1", matchId: "w2" } },
                  { source: { stageId: "stage-1", groupId: "east-1", matchId: "e3" } }
                ],
                score: [0, 0]
              }
            ]
          },
          {
            id: "r2",
            title: "Полуфинал группы",
            matches: [
              {
                id: "c3",
                round: "r2",
                bestOf: 7,
                teams: [
                  { source: { stageId: "stage-2", groupId: "cross-a", matchId: "c1" } },
                  { source: { stageId: "stage-2", groupId: "cross-a", matchId: "c2" } }
                ],
                score: [0, 0]
              }
            ]
          }
        ]
      },
      {
        id: "cross-b",
        title: "Группа Б",
        rounds: [
          {
            id: "r1",
            title: "Четвертьфиналы",
            matches: [
              {
                id: "c4",
                round: "r1",
                bestOf: 7,
                teams: [
                  { source: { stageId: "stage-1", groupId: "west-1", matchId: "w3" } },
                  { source: { stageId: "stage-1", groupId: "east-1", matchId: "e2" } }
                ],
                score: [0, 0]
              },
              {
                id: "c5",
                round: "r1",
                bestOf: 7,
                teams: [
                  { source: { stageId: "stage-1", groupId: "west-1", matchId: "w4" } },
                  { source: { stageId: "stage-1", groupId: "east-1", matchId: "e1" } }
                ],
                score: [0, 0]
              }
            ]
          },
          {
            id: "r2",
            title: "Полуфинал группы",
            matches: [
              {
                id: "c6",
                round: "r2",
                bestOf: 7,
                teams: [
                  { source: { stageId: "stage-2", groupId: "cross-b", matchId: "c4" } },
                  { source: { stageId: "stage-2", groupId: "cross-b", matchId: "c5" } }
                ],
                score: [0, 0]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "stage-3",
    title: "Стадия 3",
    subtitle: "Финал Кубка Гагарина",
    groups: [
      {
        id: "final",
        title: "Финал",
        rounds: [
          {
            id: "r1",
            title: "Финал",
            matches: [
              {
                id: "final-1",
                round: "r1",
                bestOf: 7,
                teams: [
                  { source: { stageId: "stage-2", groupId: "cross-a", matchId: "c3" } },
                  { source: { stageId: "stage-2", groupId: "cross-b", matchId: "c6" } }
                ],
                score: [0, 0]
              }
            ]
          }
        ]
      }
    ]
  }
];

