export type Choice = "rock" | "paper" | "scissors";
export type Result = "win" | "lose" | "draw";
export type TicketStatus = "issued" | "viewed";

export type UserSession = {
  id: string;
  nickname: string;
};

export type Ticket = {
  id: string;
  numbers: number[];
  status: TicketStatus;
  createdAt: string;
  viewedAt: string | null;
};

export type GameRecord = {
  id: string;
  playerChoice: Choice;
  computerChoice: Choice;
  result: Result;
  playedAt: string;
  ticketId: string | null;
};

export type PlayOutcome = {
  playerChoice: Choice;
  computerChoice: Choice;
  result: Result;
  awardedTicket: Ticket | null;
};

export type DashboardPayload = {
  user: UserSession | null;
  tickets: Ticket[];
  history: GameRecord[];
};
