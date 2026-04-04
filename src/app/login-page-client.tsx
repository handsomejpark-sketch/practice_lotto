"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./auth-page.module.css";

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

export default function LoginPageClient() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("닉네임과 4자리 PIN으로 이벤트에 바로 참여할 수 있습니다.");
  const [authPending, setAuthPending] = useState(false);

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
      const payload = await requestJson<{ message: string }>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          nickname: trimmedNickname,
          pin,
        }),
      });

      setMessage(payload.message);
      router.push("/play");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "입장 처리 중 문제가 발생했습니다.");
    } finally {
      setAuthPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroHeader}>
            <p className={styles.kicker}>PREMIUM EVENT GAME</p>
            <h1 className={styles.heroTitle}>오늘의 승부에 도전하고, 로또 티켓을 받아가세요.</h1>
            <p className={styles.heroSummary}>
              닉네임과 PIN만 입력하면 바로 참여할 수 있는 모바일 이벤트입니다. 한 판 승부에서
              이기면 즉시 로또 티켓이 지급됩니다.
            </p>
          </div>

          <div className={styles.cards}>
            <article>
              <span>STEP 1</span>
              <strong>닉네임과 4자리 PIN으로 빠르게 입장</strong>
            </article>
            <article>
              <span>STEP 2</span>
              <strong>승부에 이기면 새 티켓이 즉시 지급</strong>
            </article>
          </div>

          <div className={styles.heroList}>
            <p className={styles.eyebrow}>HOW IT WORKS</p>
            <ul>
              <li>닉네임과 PIN만 입력하면 별도 절차 없이 바로 참여할 수 있습니다.</li>
              <li>가위, 바위, 보 중 하나를 선택해 한 판 승부를 진행합니다.</li>
              <li>승리한 순간 새 로또 티켓이 자동으로 지급됩니다.</li>
            </ul>
          </div>

          <div className={styles.stats}>
            <article>
              <span>입장 방식</span>
              <strong>닉네임 + PIN</strong>
            </article>
            <article>
              <span>참여 방식</span>
              <strong>입장 후 바로 플레이</strong>
            </article>
            <article>
              <span>보상 구조</span>
              <strong>승리 시 티켓 1장</strong>
            </article>
          </div>
        </section>

        <aside className={styles.panel}>
          <div className={styles.badge}>ENTRY DESK</div>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>SIGN IN</p>
            <h2>지금 바로 입장하고 티켓에 도전하세요.</h2>
          </div>

          <p className={styles.description}>
            처음이라면 회원가입, 이미 계정이 있다면 로그인으로 바로 시작할 수 있습니다.
          </p>

          <div className={styles.form}>
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
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              disabled={authPending}
              onClick={() => void handleAuth("login")}
              type="button"
            >
              {authPending ? "입장 처리 중..." : "로그인"}
            </button>
            <button
              className={styles.secondaryButton}
              disabled={authPending}
              onClick={() => void handleAuth("signup")}
              type="button"
            >
              회원가입
            </button>
          </div>

          <div className={styles.status}>
            <p className={styles.eyebrow}>STATUS</p>
            <p>{message}</p>
          </div>

          <div className={styles.notice}>
            <p className={styles.eyebrow}>EVENT GUIDE</p>
            <p>
              승리 시 지급된 티켓은 자동으로 보관되며, 플레이 화면에서 바로 확인할 수 있습니다.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
