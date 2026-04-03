"use client";

import { useEffect, useMemo, useState } from "react";
import { choiceLabels, resultLabels } from "@/lib/game";
import type { Choice, DashboardPayload, GameRecord, PlayOutcome, Ticket, UserSession } from "@/lib/types";
import styles from "./page.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("닉네임과 4자리 PIN으로 빠르게 입장하세요.");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [lastOutcome, setLastOutcome] = useState<PlayOutcome | null>(null);
  const [activeView, setActiveView] = useState<"play" | "tickets">("play");
  const [booting, setBooting] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const [playPending, setPlayPending] = useState(false);
  const [ticketPendingId, setTicketPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const payload = await requestJson<DashboardPayload>("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        setCurrentUser(payload.user);
        setTickets(payload.tickets);
        setHistory(payload.history);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "초기 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  const unviewedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "issued").length,
    [tickets],
  );
  const awardedTicket = lastOutcome?.awardedTicket ?? null;

  async function handleAuth(mode: "login" | "signup") {
    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length < 2) {
      setMessage("닉네임은 2자 이상으로 입력하세요.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setMessage("PIN은 숫자 4자리만 허용됩니다.");
      return;
    }

    setAuthPending(true);

    try {
      const payload = await requestJson<{
        message: string;
        user: UserSession;
        tickets: Ticket[];
        history: GameRecord[];
      }>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          nickname: trimmedNickname,
          pin,
        }),
      });

      setCurrentUser(payload.user);
      setTickets(payload.tickets);
      setHistory(payload.history);
      setLastOutcome(null);
      setNickname("");
      setPin("");
      setMessage(payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setAuthPending(false);
    }
  }

  async function handlePlay(playerChoice: Choice) {
    if (!currentUser) {
      setMessage("먼저 로그인해야 게임을 시작할 수 있습니다.");
      return;
    }

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
        setMessage("승리했습니다. 새 로또 티켓이 지급되었습니다.");
      } else {
        setActiveView("play");
        setMessage(
          payload.outcome.result === "draw"
            ? "무승부입니다. 다시 도전하세요."
            : "이번 판은 졌습니다. 다음 판에서 티켓을 노려보세요.",
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
      setCurrentUser(null);
      setTickets([]);
      setHistory([]);
      setLastOutcome(null);
      setActiveView("play");
      setMessage("로그아웃했습니다. 다시 입장하려면 닉네임과 PIN을 입력하세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그아웃 처리 중 오류가 발생했습니다.");
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>MOBILE EVENT GAME</p>
          <h1>가위바위보 한 판으로 오늘의 로또 티켓을 챙기세요.</h1>
          <p className={styles.summary}>
            로그인 후 바로 플레이하고, 이기면 6개 번호가 담긴 티켓이 즉시 지급됩니다.
          </p>
          <div className={styles.heroStats}>
            <article>
              <strong>{currentUser ? tickets.length : 0}</strong>
              <span>보유 티켓</span>
            </article>
            <article>
              <strong>{currentUser ? unviewedCount : 0}</strong>
              <span>미확인 티켓</span>
            </article>
            <article>
              <strong>{currentUser ? history.length : 0}</strong>
              <span>최근 플레이</span>
            </article>
          </div>
        </div>

        <aside className={styles.authCard}>
          <div className={styles.badge}>SERVER MODE</div>
          <h2>{currentUser ? `${currentUser.nickname}님 입장 완료` : "닉네임 + PIN 로그인"}</h2>
          <p className={styles.authDescription}>
            현재 화면은 Supabase DB와 서버 세션을 사용해 실제 로그인과 티켓 기록을 처리합니다.
          </p>

          {currentUser ? (
            <div className={styles.userPanel}>
              <div className={styles.userHighlights}>
                <span>새 티켓 {unviewedCount}장</span>
                <span>최근 당첨 {awardedTicket ? "있음" : "없음"}</span>
              </div>
              <button className={styles.secondaryButton} onClick={() => void logout()} type="button">
                로그아웃
              </button>
            </div>
          ) : (
            <div className={styles.authForm}>
              <label>
                닉네임
                <input
                  autoComplete="nickname"
                  maxLength={14}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="예: handsomejpark"
                  value={nickname}
                />
              </label>
              <label>
                4자리 PIN
                <input
                  autoComplete="current-password"
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  value={pin}
                />
              </label>
              <div className={styles.authActions}>
                <button
                  className={styles.primaryButton}
                  disabled={authPending || booting}
                  onClick={() => void handleAuth("login")}
                  type="button"
                >
                  {authPending ? "처리 중..." : "로그인"}
                </button>
                <button
                  className={styles.secondaryButton}
                  disabled={authPending || booting}
                  onClick={() => void handleAuth("signup")}
                  type="button"
                >
                  회원가입
                </button>
              </div>
            </div>
          )}

          <p className={styles.status}>{booting ? "세션을 확인하는 중입니다." : message}</p>
        </aside>
      </section>

      <section className={styles.gameShell}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>PLAY AREA</p>
            <h2>한 판 승부</h2>
          </div>
          <div className={styles.tabGroup}>
            <button
              className={activeView === "play" ? styles.tabActive : styles.tab}
              onClick={() => setActiveView("play")}
              type="button"
            >
              게임
            </button>
            <button
              className={activeView === "tickets" ? styles.tabActive : styles.tab}
              onClick={() => setActiveView("tickets")}
              type="button"
            >
              내 티켓
            </button>
          </div>
        </div>

        {activeView === "play" ? (
          <div className={styles.playGrid}>
            <div className={styles.choicePanel}>
              <h3>선택</h3>
              <p>이기면 티켓 1장 지급, 비기거나 지면 다음 판으로 넘어갑니다.</p>
              <div className={styles.choiceButtons}>
                {(["scissors", "rock", "paper"] as Choice[]).map((choice) => (
                  <button
                    className={styles.choiceButton}
                    disabled={playPending || booting || !currentUser}
                    key={choice}
                    onClick={() => void handlePlay(choice)}
                    type="button"
                  >
                    <span className={styles.choiceEmoji}>
                      {choice === "scissors" ? "✌" : choice === "rock" ? "✊" : "✋"}
                    </span>
                    <span>{choiceLabels[choice]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.resultPanel}>
              <h3>결과</h3>
              {lastOutcome ? (
                <div className={styles.resultCard}>
                  <div className={styles.resultChoices}>
                    <article>
                      <span>내 선택</span>
                      <strong>{choiceLabels[lastOutcome.playerChoice]}</strong>
                    </article>
                    <article>
                      <span>컴퓨터</span>
                      <strong>{choiceLabels[lastOutcome.computerChoice]}</strong>
                    </article>
                  </div>
                  <div className={styles.resultStatus}>{resultLabels[lastOutcome.result]}</div>
                  {awardedTicket ? (
                    <div className={styles.ticketPreview}>
                      {awardedTicket.numbers.map((number) => (
                        <span key={`${awardedTicket.id}-${number}`}>{number}</span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.resultHint}>이번 판에서는 티켓이 발급되지 않았습니다.</p>
                  )}
                </div>
              ) : (
                <div className={styles.resultEmpty}>
                  <p>첫 판을 시작하면 여기에서 결과와 티켓 지급 여부가 바로 보입니다.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.ticketSection}>
            <div className={styles.ticketSummary}>
              <div>
                <p className={styles.sectionEyebrow}>TICKET BOX</p>
                <h3>내 로또 티켓</h3>
              </div>
              <span>{tickets.length}장 보관 중</span>
            </div>

            {tickets.length === 0 ? (
              <div className={styles.emptyState}>
                <p>아직 발급된 티켓이 없습니다. 게임에서 먼저 이겨야 합니다.</p>
              </div>
            ) : (
              <div className={styles.ticketList}>
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
