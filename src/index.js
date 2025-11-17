import React from "react";
import { createRoot } from "react-dom/client";
import BookAssistant from "./BookAssistant.js";   // 這裡路徑要跟你的 Aitest.js 檔名一致

const el = document.getElementById("react-root");

if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <BookAssistant />
    </React.StrictMode>
  );
}