import type { Choice, Result } from "./types";

export const choiceLabels: Record<Choice, string> = {
  rock: "바위",
  paper: "보",
  scissors: "가위",
};

export const resultLabels: Record<Result, string> = {
  win: "승리",
  lose: "패배",
  draw: "무승부",
};

function randomIndex(length: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
}

export function randomChoice() {
  const options: Choice[] = ["rock", "paper", "scissors"];
  return options[randomIndex(options.length)];
}

export function decideResult(playerChoice: Choice, computerChoice: Choice): Result {
  if (playerChoice === computerChoice) {
    return "draw";
  }

  const winsAgainst: Record<Choice, Choice> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };

  return winsAgainst[playerChoice] === computerChoice ? "win" : "lose";
}

export function generateLottoNumbers() {
  const picks = new Set<number>();

  while (picks.size < 6) {
    picks.add(randomIndex(45) + 1);
  }

  return [...picks].sort((a, b) => a - b);
}
