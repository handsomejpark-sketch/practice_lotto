"use client";

import { useMemo, useState } from "react";
import { choiceLabels, resultLabels } from "@/lib/game";
import type { Choice, GameRecord, PlayOutcome, Ticket, UserSession } from "@/lib/types";
import styles from "./play.module.css";

const choiceOrder: Choice[] = ["scissors", "rock", "paper"];
const choiceEmoji: Record<Choice, string> = {
  scissors: "✌",
  rock: "✊",
  paper: "✋",
};

type PlayPageClientProps = {
  user: UserSession;
  initialTickets: Ticket[];
  initialHistory: GameRecord[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function resultTone(result: PlayOutcome["result"]) {
  if (result === "win") {
    return styles.resultWin;
  }

  if (result === "lose") {
    return styles.resultLose;
  }

  return styles.resultDraw;
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = (text ? JSON.parse(text) : {}) as T & { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return payload;
}

export default function PlayPageClient({
  user,
  initialTickets,
  initialHistory,
}: PlayPageClientProps) {
  const [message, setMessage] = useState("첫 판을 시작하고 오늘의 티켓을 노려보세요.");
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [history, setHistory] = useState<GameRecord[]>(initialHistory);
  const [lastOutcome, setLastOutcome] = useState<PlayOutcome | null>(null);
  const [activeView, setActiveView] = useState<"play" | "tickets">("play");
  const [playPending, setPlayPending] = useState(false);
  const [ticketPendingId, setTicketPendingId] = useState<string | null>(null);

  const unviewedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "issued").length,
    [tickets],
  );
  const latestTicket = tickets[0] ?? null;

  async function handlePlay(playerChoice: Choice) {
    setPlayPending(true);

    try {
      const payload = await requestJson<{
        outcome: PlayOutcome;
        historyEntry: GameRecord;
      }>("/api/game/play", {
        method: "POST",
        body: JSON.stringify({ userChoice: playerChoice }),
      });

      setLastOutcome(payload.outcome);
      setHistory((current) => [payload.historyEntry, ...current].slice(0, 8));

      if (payload.outcome.awardedTicket) {
        setTickets((current) => [payload.outcome.awardedTicket as Ticket, ...current]);
        setActiveView("tickets");
        setMessage("승리했습니다. 새 로또 티켓이 티켓함에 지급되었습니다.");
      } else {
        setActiveView("play");
        setMessage(
          payload.outcome.result === "draw"
            ? "무승부입니다. 바로 다시 도전해 보세요."
            : "이번 판은 아쉽게 졌습니다. 다음 판에서 티켓을 노려보세요.",
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "게임 처리 중 오류가 발생했습니다.");
    } finally {
      setPlayPending(false);
    }
  }

  async function markTicketViewed(ticketId: string) {
    setTicketPendingId(ticketId);

    try {
      const payload = await requestJson<{ ticket: Ticket }>(`/api/tickets/${ticketId}/view`, {
        method: "POST",
      });

      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? payload.ticket : ticket)),
      );
      setMessage("티켓 상태를 확인 완료로 변경했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "티켓 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setTicketPendingId(null);
    }
  }

  async function logout() {
    try {
      await requestJson<{ message: string }>("/api/auth/logout", {
        method: "POST",
      });
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그아웃 처리 중 오류가 발생했습니다.");
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageGlowTop} />
      <div className={styles.pageGlowBottom} />

      <section className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <p className={styles.kicker}>GAME STAGE</p>
              <h1 className={styles.heroTitle}>지금 승부하고, 오늘의 로또 티켓을 챙기세요.</h1>
              <p className={styles.heroSummary}>
                한 번의 선택으로 결과를 확인하고, 지급된 티켓은 바로 같은 화면에서 관리할 수 있습니다.
              </p>
            </div>

            <div className={styles.heroStats}>
              <article>
                <span>보유 티켓</span>
                <strong>{tickets.length}</strong>
              </article>
              <article>
                <span>미확인 티켓</span>
                <strong>{unviewedCount}</strong>
              </article>
              <article>
                <span>최근 플레이</span>
                <strong>{history.length}</strong>
              </article>
            </div>
          </div>
        </section>

        <aside className={styles.userPanel}>
          <div className={styles.panelBadge}>PLAYER LOUNGE</div>
          <div className={styles.panelHeading}>
            <p className={styles.sectionEyebrow}>WELCOME</p>
            <h2>{user.nickname}님, 오늘의 승부를 시작하세요.</h2>
          </div>

          <p className={styles.panelDescription}>
            결과 확인부터 티켓 관리까지, 필요한 정보가 모두 이곳에 정리됩니다.
          </p>

          <div className={styles.summaryBlock}>
            <div className={styles.metaRow}>
              <span className={styles.metaPill}>새 티켓 {unviewedCount}장</span>
              <span className={styles.metaPill}>
                최근 발급 {latestTicket ? formatDate(latestTicket.createdAt) : "아직 없음"}
              </span>
            </div>
            <p>승리 시 지급된 새 티켓은 자동으로 티켓함에 누적됩니다.</p>
          </div>

          <div className={styles.statusCard}>
            <p className={styles.sectionEyebrow}>STATUS</p>
            <p>{message}</p>
          </div>

          <button className={styles.secondaryButton} onClick={() => void logout()} type="button">
            로그아웃
          </button>
        </aside>
      </section>

      <section className={styles.lounge}>
        <div className={styles.loungeHeader}>
          <div>
            <p className={styles.kicker}>GAME LOUNGE</p>
            <h2>승부 결과와 티켓 상태를 한곳에서 확인하세요.</h2>
          </div>
          <div className={styles.tabGroup}>
            <button
              className={activeView === "play" ? styles.tabActive : styles.tab}
              onClick={() => setActiveView("play")}
              type="button"
            >
              플레이 스테이지
            </button>
            <button
              className={activeView === "tickets" ? styles.tabActive : styles.tab}
              onClick={() => setActiveView("tickets")}
              type="button"
            >
              티켓 볼트
            </button>
          </div>
        </div>

        {activeView === "play" ? (
          <div className={styles.playLayout}>
            <section className={styles.arenaCard}>
              <div className={styles.arenaHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>PLAY STAGE</p>
                  <h3>오늘의 한 판 승부</h3>
                </div>
                <p className={styles.inlineHint}>이기면 즉시 로또 티켓 1장이 지급됩니다.</p>
              </div>

              <div className={styles.choiceButtons}>
                {choiceOrder.map((choice) => (
                  <button
                    className={styles.choiceButton}
                    disabled={playPending}
                    key={choice}
                    onClick={() => void handlePlay(choice)}
                    type="button"
                  >
                    <span className={styles.choiceEmoji}>{choiceEmoji[choice]}</span>
                    <strong>{choiceLabels[choice]}</strong>
                    <small>
                      {choice === "scissors" ? "기습" : choice === "rock" ? "정면 승부" : "반전 카드"}
                    </small>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.resultCard}>
              <div className={styles.arenaHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>RESULT STAGE</p>
                  <h3>결과 브리핑</h3>
                </div>
                {playPending ? <span className={styles.loadingChip}>대결 계산 중</span> : null}
              </div>

              {lastOutcome ? (
                <div className={styles.resultBody}>
                  <div className={styles.resultChoices}>
                    <article>
                      <span>내 선택</span>
                      <strong>
                        {choiceEmoji[lastOutcome.playerChoice]} {choiceLabels[lastOutcome.playerChoice]}
                      </strong>
                    </article>
                    <article>
                      <span>컴퓨터</span>
                      <strong>
                        {choiceEmoji[lastOutcome.computerChoice]} {choiceLabels[lastOutcome.computerChoice]}
                      </strong>
                    </article>
                  </div>

                  <div className={`${styles.resultBadge} ${resultTone(lastOutcome.result)}`}>
                    {resultLabels[lastOutcome.result]}
                  </div>

                  {lastOutcome.awardedTicket ? (
                    <div className={styles.rewardPanel}>
                      <div className={styles.rewardCopy}>
                        <span className={styles.sectionEyebrow}>AWARDED TICKET</span>
                        <p>새 티켓이 발급되었습니다. 아래 번호를 확인하고 티켓 볼트에서도 관리하세요.</p>
                      </div>
                      <div className={styles.ticketPreview}>
                        {lastOutcome.awardedTicket.numbers.map((number) => (
                          <span key={`${lastOutcome.awardedTicket?.id}-${number}`}>{number}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.resultEmptyState}>
                      <p>이번 판에서는 티켓이 지급되지 않았습니다. 바로 다시 도전할 수 있습니다.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.resultPlaceholder}>
                  <p>첫 판을 시작하면 이곳에 승패와 티켓 지급 결과가 정리됩니다.</p>
                </div>
              )}
            </section>

            <aside className={styles.activityCard}>
              <div className={styles.arenaHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>RECENT ACTIVITY</p>
                  <h3>최근 플레이</h3>
                </div>
              </div>

              {history.length === 0 ? (
                <div className={styles.resultPlaceholder}>
                  <p>아직 플레이 기록이 없습니다. 첫 게임을 시작해 흐름을 만들어 보세요.</p>
                </div>
              ) : (
                <div className={styles.historyList}>
                  {history.map((entry) => (
                    <article className={styles.historyItem} key={entry.id}>
                      <div>
                        <strong>{resultLabels[entry.result]}</strong>
                        <p>
                          {choiceLabels[entry.playerChoice]} vs {choiceLabels[entry.computerChoice]}
                        </p>
                      </div>
                      <time>{formatDate(entry.playedAt)}</time>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className={styles.ticketVault}>
            <section className={styles.ticketVaultHeader}>
              <div>
                <p className={styles.sectionEyebrow}>TICKET VAULT</p>
                <h3>지급된 티켓을 한곳에서 관리하세요</h3>
                <p>새로 받은 티켓은 즉시 보관되며, 확인 처리를 하면 상태가 정리됩니다.</p>
              </div>

              <div className={styles.vaultStats}>
                <article>
                  <span>전체 보관</span>
                  <strong>{tickets.length}</strong>
                </article>
                <article>
                  <span>새 티켓</span>
                  <strong>{unviewedCount}</strong>
                </article>
                <article>
                  <span>확인 완료</span>
                  <strong>{tickets.length - unviewedCount}</strong>
                </article>
              </div>
            </section>

            {tickets.length === 0 ? (
              <div className={styles.emptyVault}>
                <p>아직 발급된 티켓이 없습니다. 플레이 스테이지에서 승리하면 이곳이 채워집니다.</p>
              </div>
            ) : (
              <div className={styles.ticketGrid}>
                {tickets.map((ticket) => (
                  <article className={styles.ticketCard} key={ticket.id}>
                    <div className={styles.ticketHeader}>
                      <span className={ticket.status === "issued" ? styles.ticketNew : styles.ticketSeen}>
                        {ticket.status === "issued" ? "NEW" : "VIEWED"}
                      </span>
                      <time>{formatDate(ticket.createdAt)}</time>
                    </div>

                    <div className={styles.numberRow}>
                      {ticket.numbers.map((number) => (
                        <span key={`${ticket.id}-${number}`}>{number}</span>
                      ))}
                    </div>

                    <div className={styles.ticketFooter}>
                      <p>
                        {ticket.viewedAt
                          ? `확인 완료: ${formatDate(ticket.viewedAt)}`
                          : "아직 확인하지 않은 티켓입니다."}
                      </p>
                      {ticket.status === "issued" ? (
                        <button
                          disabled={ticketPendingId === ticket.id}
                          onClick={() => void markTicketViewed(ticket.id)}
                          type="button"
                        >
                          {ticketPendingId === ticket.id ? "처리 중..." : "확인 처리"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
