import React from "react";

/* Icons im Lucide-Stil: 24er-Raster, Strichstärke 2, keine Füllung. */
export const P = {
  settings: <g><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></g>,
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  book: <g><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></g>,
  sigma: <path d="M18 7V4H6l6 8-6 8h12v-3" />,
  target: <g><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></g>,
  pencil: <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  eye: <g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></g>,
  trash: <g><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></g>,
  download: <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></g>,
  upload: <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></g>,
  printer: <g><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></g>,
  info: <g><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></g>,
  lock: <g><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></g>,
  calendar: <g><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></g>,
  hash: <g><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /></g>,
  save: <g><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></g>,
  chart: <g><path d="M22 7l-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></g>,
  chartDown: <g><path d="M22 17l-8.5-8.5-5 5L2 7" /><path d="M16 17h6v-6" /></g>,
  flat: <path d="M4 12h16" />,
  alert: <g><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></g>,
  table: <g><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></g>,
  bug: <g><rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 8l-3 2M5 8l3 2M19 16l-3-2M5 16l3-2M12 2v4" /></g>,
  scale: <g><path d="M12 3v18M7 7h10" /><path d="M4 12l3-5 3 5a3 3 0 0 1-6 0z" /><path d="M14 12l3-5 3 5a3 3 0 0 1-6 0z" /></g>,
  cap: <g><path d="M22 9L12 4 2 9l10 5 10-5z" /><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></g>,
  percent: <g><path d="M19 5L5 19" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></g>,
  sliders: <g><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></g>,
  archive: <g><rect x="2" y="4" width="20" height="5" rx="1" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M10 13h4" /></g>,
};

export const Ic = ({ n, size = 16, style, color }) => (
  <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={style} aria-hidden="true" focusable="false">{P[n] || null}</svg>
);

export const FlagDE = ({ size = 64 }) => (
  <svg width={size} height={size * 0.65} viewBox="0 0 60 39" style={{ borderRadius: 8, boxShadow: "0 2px 10px rgba(23,42,70,.25)" }} aria-hidden="true">
    <rect width="60" height="13" fill="#111" /><rect y="13" width="60" height="13" fill="#DD0000" /><rect y="26" width="60" height="13" fill="#FFCC00" />
  </svg>);

export const FlagEN = ({ size = 64 }) => (
  <svg width={size} height={size * 0.65} viewBox="0 0 60 39" style={{ borderRadius: 8, boxShadow: "0 2px 10px rgba(23,42,70,.25)" }} aria-hidden="true">
    <rect width="60" height="39" fill="#012169" />
    <path d="M0,0 60,39 M60,0 0,39" stroke="#fff" strokeWidth="7" />
    <path d="M0,0 60,39 M60,0 0,39" stroke="#C8102E" strokeWidth="3" />
    <path d="M30,0 V39 M0,19.5 H60" stroke="#fff" strokeWidth="12" />
    <path d="M30,0 V39 M0,19.5 H60" stroke="#C8102E" strokeWidth="7" />
  </svg>);
