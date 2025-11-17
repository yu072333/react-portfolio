import React, { useEffect, useMemo, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function BookAssistant({
  defaultModel = "gemini-2.5-flash",
  starter = "我最近想多看書，可以先幫我推薦 3 本入門的書嗎？",
}) {
  const [model, setModel] = useState(defaultModel);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [rememberKey, setRememberKey] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  // 讀取 localStorage 的 key（Demo 用）
  useEffect(() => {
    const saved = localStorage.getItem("gemini_api_key");
    if (saved) setApiKey(saved);
  }, []);

  // 初始歡迎訊息＋預設輸入
  useEffect(() => {
    setHistory([
      {
        role: "model",
        parts: [
          {
            text:
              "📚 嗨，我是你的《書籍推薦助理》。\n" +
              "可以先跟我說：你平常喜歡看什麼類型？最近的心情、想解決的困擾，我會幫你配書單。",
          },
        ],
      },
    ]);
    if (starter) setInput(starter);
  }, [starter]);

  // 捲軸自動滾到底
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history, loading]);

  // 建立 Gemini client
  const ai = useMemo(() => {
    try {
      return apiKey ? new GoogleGenerativeAI(apiKey) : null;
    } catch {
      return null;
    }
  }, [apiKey]);

  async function sendMessage(message) {
    const content = (message ?? input).trim();
    if (!content || loading) return;
    if (!ai) {
      setError("請先輸入有效的 Gemini API Key");
      return;
    }

    setError("");
    setLoading(true);

    const newHistory = [
      ...history,
      { role: "user", parts: [{ text: content }] },
    ];
    setHistory(newHistory);
    setInput("");

    try {
      // ✅ 正確用法：先拿到 model，再呼叫 generateContent
      const modelClient = ai.getGenerativeModel({ model });

      const resp = await modelClient.generateContent({
        contents: newHistory,
      });

      const reply = resp?.response?.text
        ? resp.response.text()
        : "[No content]";

      setHistory((prev) => [
        ...prev,
        { role: "model", parts: [{ text: reply }] },
      ]);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function renderMarkdownLike(text) {
    const lines = text.split(/\n/);
    return (
      <>
        {lines.map((ln, i) => (
          <div
            key={i}
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {ln}
          </div>
        ))}
      </>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        {/* 左側：聊天主區 */}
        <section style={styles.chatPanel}>
          <header style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.logoCircle}>📚</div>
              <div>
                <div style={styles.headerTitle}>BookSense 書籍推薦助理</div>
                <div style={styles.headerSub}>
                  告訴我你的心情、興趣或想成為什麼樣的人，我幫你挑幾本書陪你。
                </div>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.modelLabel}>Model</div>
              <div style={styles.modelValue}>{model}</div>
            </div>
          </header>

          {/* 訊息區 */}
          <div ref={listRef} style={styles.messages}>
            {history.map((m, idx) => {
              const isUser = m.role === "user";
              const body = m.parts.map((p) => p.text).join("\n");
              return (
                <div
                  key={idx}
                  style={{
                    ...styles.msgRow,
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  {!isUser && (
                    <div style={styles.avatarAssistant}>
                      <span>BS</span>
                    </div>
                  )}
                  {isUser && (
                    <div style={styles.avatarUser}>
                      <span>U</span>
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.msgBubble,
                      ...(isUser
                        ? styles.msgBubbleUser
                        : styles.msgBubbleAssistant),
                    }}
                  >
                    <div style={styles.msgMeta}>
                      {isUser ? "你" : "書籍助理"}
                    </div>
                    <div style={styles.msgBody}>
                      {renderMarkdownLike(body)}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div
                style={{
                  ...styles.msgRow,
                  justifyContent: "flex-start",
                }}
              >
                <div style={styles.avatarAssistant}>
                  <span>BS</span>
                </div>
                <div
                  style={{
                    ...styles.msgBubble,
                    ...styles.msgBubbleAssistant,
                  }}
                >
                  <div style={styles.msgMeta}>書籍助理</div>
                  <div style={styles.msgBody}>正在幫你翻書架…</div>
                </div>
              </div>
            )}
          </div>

          {error && <div style={styles.errorBox}>⚠ {error}</div>}

          {/* 下方輸入區 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={styles.composer}
          >
            <input
              placeholder="輸入你的閱讀需求，例如：想看輕鬆一點、關於女性成長的故事書"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={styles.textInput}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !apiKey}
              style={{
                ...styles.sendBtn,
                opacity:
                  loading || !input.trim() || !apiKey ? 0.6 : 1,
                cursor:
                  loading || !input.trim() || !apiKey
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              推薦看看
            </button>
          </form>

          {/* 快速問題 */}
          <div style={styles.quickRow}>
            {[
              "我喜歡村上春樹跟吳青峰的歌，適合看什麼書？",
              "推薦幾本適合大學生的理財入門書，而且不要太難。",
              "最近覺得有點迷惘，有沒有關於自我探索、長大過程的書？",
            ].map((q) => (
              <button
                key={q}
                type="button"
                style={styles.quickChip}
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* 右側：設定＋使用說明 */}
        <aside style={styles.sidePanel}>
          <div style={styles.sideCard}>
            <div style={styles.sideTitle}>連線設定</div>

            <label style={styles.label}>
              <span>Gemini 模型名稱</span>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="例如：gemini-2.5-flash 或 gemini-2.5-pro"
                style={styles.input}
              />
              <div style={styles.labelHint}>
                模型名稱會不定期更新，出現錯誤時可以到官方文件確認最新 ID。
              </div>
            </label>

            <label style={styles.label}>
              <span>Gemini API Key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  const v = e.target.value;
                  setApiKey(v);
                  if (rememberKey) {
                    localStorage.setItem("gemini_api_key", v);
                  }
                }}
                placeholder="貼上你的 API Key（只存在本機瀏覽器）"
                style={styles.input}
              />
            </label>

            <label style={styles.rememberRow}>
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRememberKey(checked);
                  if (!checked) {
                    localStorage.removeItem("gemini_api_key");
                  } else if (apiKey) {
                    localStorage.setItem("gemini_api_key", apiKey);
                  }
                }}
              />
              <span>記住在本機（localStorage）</span>
            </label>

            <div style={styles.labelHint}>
              Demo 用：正式環境建議改為後端呼叫或有權限限制的 Key。
            </div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideTitle}>怎麼跟「書籍助理」聊天？</div>
            <ul style={styles.tipList}>
              <li>先說說你最近的狀態：心情、科系、正在煩惱的事。</li>
              <li>可以給幾本你喜歡或不喜歡的書，讓助理比較好抓你的口味。</li>
              <li>可以要求：想要「療癒系、節奏輕快」、或「偏理性、有實作練習」。</li>
              <li>如果得到的推薦太廣，可以回覆「再聚焦」「給我更小眾一點」。</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 24,
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #e5e3df 0%, #f2f3f5 50%, #e7ecef 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  layout: {
    width: "min(1120px, 100%)",
    display: "grid",
    gridTemplateColumns: "2.1fr minmax(260px, 320px)",
    gap: 20,
  },
  chatPanel: {
    background: "#f7f5f2",
    borderRadius: 18,
    border: "1px solid #d9d7d2",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.04)",
    overflow: "hidden",
  },
  header: {
    padding: "14px 18px",
    borderBottom: "1px solid #d9d7d2",
    background: "#ede9e4",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    background: "#c4b5a5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#3f3a36",
  },
  headerSub: {
    fontSize: 12,
    color: "#6b6661",
    marginTop: 2,
  },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  modelLabel: {
    fontSize: 11,
    color: "#8f8a84",
  },
  modelValue: {
    fontSize: 11,
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid #c9c6c0",
    background: "#f9f7f4",
  },
  messages: {
    padding: "14px 14px 10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxHeight: 440,
    overflowY: "auto",
    scrollBehavior: "smooth",
  },
  msgRow: {
    display: "flex",
    gap: 8,
  },
  avatarAssistant: {
    width: 30,
    height: 30,
    borderRadius: 999,
    background: "#b0b8b4",
    color: "#292524",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  avatarUser: {
    width: 30,
    height: 30,
    borderRadius: 999,
    background: "#5b5a57",
    color: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  msgBubble: {
    maxWidth: "78%",
    borderRadius: 16,
    padding: "8px 12px 9px 12px",
    fontSize: 14,
    lineHeight: 1.55,
    border: "1px solid transparent",
    boxSizing: "border-box",
  },
  msgBubbleUser: {
    background: "#68635d",
    color: "#f4f3f0",
    borderColor: "#55514c",
  },
  msgBubbleAssistant: {
    background: "#f3f1ed",
    color: "#34302c",
    borderColor: "#d4d0c9",
  },
  msgMeta: {
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.7,
    marginBottom: 4,
  },
  msgBody: {
    fontSize: 14,
  },
  errorBox: {
    padding: "6px 14px",
    margin: "0 14px 8px 14px",
    fontSize: 12,
    borderRadius: 10,
    background: "#fbeaea",
    color: "#9b1c1c",
    border: "1px solid #f5caca",
  },
  composer: {
    padding: "10px 12px 12px 12px",
    borderTop: "1px solid #d9d7d2",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "center",
    background: "#f5f3f0",
  },
  textInput: {
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid #c8c4bf",
    outline: "none",
    fontSize: 14,
    background: "#f9f7f4",
  },
  sendBtn: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    background: "#8a9a8f",
    color: "#fdfcfb",
    fontSize: 14,
    fontWeight: 600,
  },
  quickRow: {
    padding: "4px 12px 12px 12px",
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    borderRadius: 999,
    border: "1px solid #d4d0c9",
    padding: "6px 10px",
    fontSize: 11,
    background: "#faf8f5",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sideCard: {
    background: "#f9f7f4",
    borderRadius: 16,
    border: "1px solid #d9d7d2",
    padding: 14,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.03)",
  },
  sideTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: "#3f3a36",
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 10,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #c8c4bf",
    fontSize: 13,
    outline: "none",
    background: "#fdfcfb",
  },
  labelHint: {
    fontSize: 11,
    color: "#87827c",
  },
  rememberRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    fontSize: 11,
    fontWeight: 400,
    color: "#5f5a55",
  },
  tipList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 12,
    color: "#5f5a55",
    display: "grid",
    gap: 4,
  },
};

export default BookAssistant;

