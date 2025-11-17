// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import BookAssistant from "./BookAssistant";
import CatWidget from "./cat"; // 跟檔名 cat.js 對應

const el = document.getElementById("react-root");

if (el) {
  const root = createRoot(el);
  root.render(
    <>
      <BookAssistant />
      <CatWidget />
    </>
  );
} else {
  console.error("找不到 #react-root，請確認 public/index.html 有這個 div");
}
