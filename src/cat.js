// src/cat.js
import React, { useEffect, useState } from "react";

const CAT_API_KEY = "live_QAA9jtJzqRM73Wtm0kf02vqAJJS7U3zaNDWuAS7znVucAG6osgU9idGUrqVHMwUF"; 
export default function CatWidget() {
  const [catUrl, setCatUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchCat() {
    try {
      setLoading(true);
      setError("");
      setCatUrl("");

      const res = await fetch("https://api.thecatapi.com/v1/images/search", {
        headers: CAT_API_KEY
          ? {
              "x-api-key": CAT_API_KEY,
            }
          : {},
      });

      if (!res.ok) {
        throw new Error("Cat API 回傳錯誤：" + res.status);
      }

      const data = await res.json();
      if (Array.isArray(data) && data[0]?.url) {
        setCatUrl(data[0].url);
      } else {
        throw new Error("沒有拿到圖片網址 QQ");
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // 進來頁面自動抓一張
  useEffect(() => {
    fetchCat();
  }, []);

  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #ddd",
        background: "#fafafa",
      }}
    >
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>🐱 隨機貓咪生成器</h3>
      <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
        使用 TheCatAPI 拿一張隨機貓咪圖，每次點按鈕都會換一隻。
      </p>

      {error && (
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            borderRadius: 8,
            background: "#ffe5e5",
            color: "#a11",
            fontSize: 12,
          }}
        >
          ⚠ {error}
        </div>
      )}

      <button
        type="button"
        onClick={fetchCat}
        disabled={loading}
        style={{
          padding: "8px 14px",
          borderRadius: 999,
          border: "none",
          background: "#ffb347",
          color: "#222",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}
      >
        {loading ? "載入中..." : "換一隻貓咪"}
      </button>

      <div style={{ minHeight: 180 }}>
        {catUrl && (
          <img
            src={catUrl}
            alt="Random cat from TheCatAPI"
            style={{
              maxWidth: "100%",
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            }}
          />
        )}
      </div>
    </div>
  );
}
