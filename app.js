const { useState, useRef, useEffect, useMemo } = React;
const C = {
    bg0: "#080D14", bg1: "#0D1420", bg2: "#111827", bg3: "rgba(255,255,255,0.055)", bg4: "rgba(255,255,255,0.085)",
    border: "rgba(255,255,255,0.10)", accent: "#0A84FF", accentD: "#5AC8FA",
    green: "#30D158", amber: "#FFB340", red: "#FF453A",
    text: "#F5F5F7", muted: "#A6ADBB", dim: "#707888",
};
const UI = {
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
    mono: "'SF Mono', ui-monospace, monospace",
    appBg: "linear-gradient(180deg,#0D1420 0%,#080D14 100%)",
    panelBg: "rgba(13,20,32,0.88)",
    cardBg: "rgba(255,255,255,0.045)",
    controlBg: "rgba(255,255,255,0.055)",
    activeBg: "rgba(255,255,255,0.075)",
    border: "rgba(255,255,255,0.09)",
    borderMedium: "rgba(255,255,255,0.14)",
    cardShadow: "none",
    softShadow: "0 8px 24px rgba(0,0,0,0.12)",
    glowBlue: "0 8px 22px rgba(10,132,255,0.12)",
    glowAmber: "0 8px 22px rgba(255,179,64,0.12)",
};
function cardSurface(extra = {}) {
    return { background: UI.cardBg, border: `1px solid ${UI.border}`, boxShadow: "none", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", ...extra };
}
function controlSurface(extra = {}) {
    return { background: UI.controlBg, border: `1px solid ${UI.border}`, boxShadow: "none", ...extra };
}
function actionButtonSurface(color, bg) {
    return { width: 48, height: 48, borderRadius: 15, border: `1px solid ${color}22`, background: bg || UI.controlBg, color, cursor: "pointer", fontWeight: 850, fontSize: 17, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "none", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", lineHeight: 1 };
}
function ActionIcon({ name, size = 23 }) {
    const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" };
    if (name === "return")
        return React.createElement("svg", common, React.createElement("path", { d: "M9 7 4 12l5 5" }), React.createElement("path", { d: "M5 12h9a5 5 0 1 1 0 10h-2" }));
    if (name === "today")
        return React.createElement("svg", common, React.createElement("path", { d: "M6 6h12" }), React.createElement("path", { d: "M6 11h7" }), React.createElement("path", { d: "M6 16h5" }), React.createElement("path", { d: "M17 14v6" }), React.createElement("path", { d: "M14 17h6" }));
    if (name === "sync" || name === "open")
        return React.createElement("svg", common, React.createElement("path", { d: "M7 17 17 7" }), React.createElement("path", { d: "M10 7h7v7" }));
    if (name === "edit")
        return React.createElement("svg", { ...common, strokeWidth: 2.8 }, React.createElement("path", { d: "M4 20h4.5L19.2 9.3a2.4 2.4 0 0 0-3.4-3.4L5.1 16.6 4 20Z" }), React.createElement("path", { d: "M13.5 8.2l2.3 2.3" }));
    if (name === "delete")
        return React.createElement("svg", common, React.createElement("path", { d: "M7 7l10 10" }), React.createElement("path", { d: "M17 7 7 17" }));
    if (name === "trash")
        return React.createElement("svg", common, React.createElement("path", { d: "M4 7h16" }), React.createElement("path", { d: "M10 11v6" }), React.createElement("path", { d: "M14 11v6" }), React.createElement("path", { d: "M6 7l1 14h10l1-14" }), React.createElement("path", { d: "M9 7V4h6v3" }));
    if (name === "plus")
        return React.createElement("svg", common, React.createElement("path", { d: "M12 5v14" }), React.createElement("path", { d: "M5 12h14" }));
    if (name === "pin")
        return React.createElement("svg", common, React.createElement("path", { d: "m9 4 6 0 0 5 3 3-12 0 3-3z" }), React.createElement("path", { d: "M12 12v8" }));
    return React.createElement("span", null, name);
}
const ACCENT_COLORS = ["#00C2FF", "#1EDF80", "#F5A623", "#FF4444", "#A78BFA", "#F97316", "#06B6D4", "#84CC16"];
const PRIORITY = {
    high: { label: "High", icon: "▲", color: C.red, bg: C.red + "14" },
    medium: { label: "Medium", icon: "●", color: C.amber, bg: "#F5A6231A" },
    low: { label: "Low", icon: "▼", color: C.green, bg: "#1EDF801A" },
};
const DAYS_S = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_L = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
});
function notifyPlannerStorageStatus(key, ok) {
    try {
        if (typeof window !== "undefined")
            window.dispatchEvent(new CustomEvent("planner-storage-save-status", { detail: { key, ok: !!ok } }));
    }
    catch { }
}
function useLocalState(key, init) {
    const [val, setVal] = useState(() => {
        try {
            const s = localStorage.getItem(key);
            return s ? JSON.parse(s) : init;
        }
        catch {
            return init;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(val));
            notifyPlannerStorageStatus(key, true);
        }
        catch {
            // Keep the current state in memory, but make a failed write visible to the app.
            notifyPlannerStorageStatus(key, false);
        }
    }, [key, val]);
    return [val, setVal];
}
function clonePlannerSnapshot(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return value && typeof value === "object" ? { ...value } : value; }
}
function estimatePlannerDataBytes(data) {
    try {
        const text = JSON.stringify(data || {});
        if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text).length;
        return unescape(encodeURIComponent(text)).length;
    }
    catch { return 0; }
}
function formatPlannerDataSize(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
function getBackupHealth(lastExportAt) {
    if (!lastExportAt) return { label: "No backup export recorded yet.", color: C.muted };
    const t = new Date(lastExportAt).getTime();
    if (!Number.isFinite(t)) return { label: "No backup export recorded yet.", color: C.muted };
    const days = Math.floor(Math.max(0, Date.now() - t) / 86400000);
    if (days <= 7) return { label: "Backup export is recent.", color: C.green };
    if (days <= 21) return { label: "A fresh backup is recommended.", color: C.amber };
    return { label: "Backup export is overdue.", color: C.amber };
}
function formatBackupExportTime(value) {
    if (!value) return "Never";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Unknown";
    return d.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function EmptyState({ title, description, actionLabel, onAction, icon = "" }) {
    return React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: "28px 20px", textAlign: "center", margin: "12px 0 14px" }) },
        icon ? React.createElement("div", { style: { color: C.dim, fontSize: 20, marginBottom: 9, lineHeight: 1 } }, icon) : null,
        React.createElement("div", { style: { color: C.text, fontSize: 14, fontWeight: 760, lineHeight: 1.3 } }, title),
        description ? React.createElement("div", { style: { color: C.muted, fontSize: 12, lineHeight: 1.5, margin: "6px auto 0", maxWidth: 300 } }, description) : null,
        actionLabel && onAction ? React.createElement("button", { onClick: onAction, style: { marginTop: 14, minHeight: 38, padding: "8px 13px", borderRadius: 12, border: `1px solid ${C.accent}44`, background: C.accent + "18", color: C.accent, cursor: "pointer", fontFamily: "inherit", fontWeight: 760, fontSize: 12 } }, actionLabel) : null);
}
function UndoToast({ record, onUndo, onDismiss }) {
    if (!record) return null;
    // App-shell toast: always above the floating action button and safe-area.
    return React.createElement("div", { style: { position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(env(safe-area-inset-bottom, 0px) + 94px)", zIndex: 950, width: "min(calc(100vw - 28px), 480px)", pointerEvents: "none" } },
        React.createElement("div", { style: { ...cardSurface({ borderRadius: 16, padding: "10px 10px 10px 14px", background: "rgba(17,24,39,.96)", boxShadow: "0 12px 30px rgba(0,0,0,.30)" }), display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" } },
            React.createElement("div", { style: { color: C.text, fontSize: 13, fontWeight: 700, flex: 1, minWidth: 0 } }, record.label),
            React.createElement("button", { onClick: onUndo, style: { minHeight: 38, padding: "8px 12px", borderRadius: 11, border: "none", background: C.accent + "1E", color: C.accent, cursor: "pointer", fontFamily: "inherit", fontWeight: 850, fontSize: 12 } }, "UNDO"),
            React.createElement("button", { onClick: onDismiss, ariaLabel: "Dismiss", style: { width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1 } }, "×")));
}
function useWindowWidth() {
    const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 390);
    useEffect(() => {
        const h = () => setW(window.innerWidth);
        window.addEventListener("resize", h);
        return () => window.removeEventListener("resize", h);
    }, []);
    return w;
}
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function formatBrDate(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
        return dateStr || "";
    const [y, m, d] = dateStr.split("-");
    return d + "/" + m + "/" + y;
}
function shortcutFriendlyDateTime(dateStr, timeStr) {
    if (!dateStr)
        return "";
    const safeTime = timeStr || "09:00";
    const d = new Date(`${dateStr}T${safeTime}:00`);
    if (Number.isNaN(d.getTime()))
        return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} at ${hours}:${minutes}`;
}
function shortcutFriendlyDate(dateStr) {
    if (!dateStr)
        return "";
    const d = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime()))
        return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}
function shiftDateStr(dateStr, days) {
    if (!dateStr)
        return "";
    const d = new Date(dateStr + "T12:00:00");
    if (Number.isNaN(d.getTime()))
        return "";
    d.setDate(d.getDate() + days);
    return dateToLocalStr(d);
}
function addDaysStr(dateStr, days) {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}
function nextDueDate(dateStr, recurrence) {
    const d = new Date(dateStr + "T12:00:00");
    if (recurrence === "daily")
        d.setDate(d.getDate() + 1);
    else if (recurrence === "weekly")
        d.setDate(d.getDate() + 7);
    else if (recurrence === "monthly")
        d.setMonth(d.getMonth() + 1);
    else
        return dateStr;
    return d.toISOString().split("T")[0];
}
function isTodayStr(dateStr) { return !!dateStr && dateStr === todayStr(); }
function occursOn(appt, dateStr) {
    if (!appt.date)
        return false;
    if (appt.date === dateStr)
        return true;
    const target = new Date(dateStr + "T12:00:00");
    const start = new Date(appt.date + "T12:00:00");
    if (target < start)
        return false;
    if (appt.recurrence === "daily")
        return true;
    if (appt.recurrence === "weekly")
        return target.getDay() === start.getDay();
    if (appt.recurrence === "monthly")
        return target.getDate() === start.getDate();
    return false;
}
function timeToMinutes(t) {
    if (!t || !t.includes(":"))
        return null;
    const parts = t.split(":").map(Number);
    const h = parts[0], m = parts[1];
    if (Number.isNaN(h) || Number.isNaN(m))
        return null;
    return h * 60 + m;
}
function eventDurationMinutes(appt) {
    const start = timeToMinutes(appt.time);
    const end = timeToMinutes(appt.endTime);
    if (start === null)
        return 60;
    if (end === null || end <= start)
        return 60;
    return end - start;
}
function dateToLocalStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function weekStartFromDate(d) {
    const n = new Date(d);
    n.setDate(n.getDate() - n.getDay());
    return n;
}

function readImageFileRaw(file) {
    return new Promise(r => { const fr = new FileReader(); fr.onload = e => { var _a, _b; return r((_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result) !== null && _b !== void 0 ? _b : ""); }; fr.readAsDataURL(file); });
}
function readImageFile(file) {
    if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/gif")
        return readImageFileRaw(file);
    return new Promise(resolve => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        const fallback = () => {
            URL.revokeObjectURL(url);
            readImageFileRaw(file).then(resolve);
        };
        img.onload = () => {
            try {
                const maxSide = 1280;
                const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                const w = Math.max(1, Math.round(img.width * scale));
                const h = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx)
                    return fallback();
                ctx.fillStyle = C.bg1;
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL("image/jpeg", 0.72));
            }
            catch {
                fallback();
            }
        };
        img.onerror = fallback;
        img.src = url;
    });
}
function getOccurrencesForMonth(appts, year, month) {
    const res = {};
    const dim = getDaysInMonth(year, month);
    const add = (day, a) => { if (!res[day])
        res[day] = []; if (!res[day].find(x => x.id === a.id))
        res[day].push(a); };
    for (const a of appts) {
        if (!a.date)
            continue;
        const orig = new Date(a.date + "T12:00:00");
        if (orig.getFullYear() === year && orig.getMonth() === month)
            add(orig.getDate(), a);
        if (a.recurrence === "none")
            continue;
        const thisYM = year * 12 + month, origYM = orig.getFullYear() * 12 + orig.getMonth();
        if (a.recurrence === "daily" && thisYM >= origYM) {
            for (let d = 1; d <= dim; d++) {
                if (new Date(year, month, d) > orig)
                    add(d, a);
            }
        }
        else if (a.recurrence === "weekly" && thisYM >= origYM) {
            const dow = orig.getDay();
            for (let d = 1; d <= dim; d++) {
                const dt = new Date(year, month, d);
                if (dt.getDay() === dow && dt > orig)
                    add(d, a);
            }
        }
        else if (a.recurrence === "monthly" && thisYM > origYM) {
            const day = orig.getDate();
            if (day <= dim)
                add(day, a);
        }
    }
    return res;
}
function getWeekStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
}
const inp = {
    width: "100%", background: "rgba(255,255,255,0.055)", border: `1px solid ${UI.border}`,
    borderRadius: 13, padding: "11px 14px", fontSize: 14, minHeight: 42,
    fontFamily: "inherit", color: C.text, outline: "none", boxSizing: "border-box",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.035)",
};
const DEFAULT_CATEGORIES = [
    { id: "homework", name: "Homework", color: "#06B6D4" },
    { id: "tests", name: "Tests", color: "#F5A623" },
    { id: "personal", name: "Personal", color: "#A78BFA" },
    { id: "work", name: "Work", color: "#F97316" },
];
const DEFAULT_EVENT_CATEGORIES = [
    { id: "personal", name: "Personal", color: "#A78BFA" },
    { id: "work", name: "Work", color: "#F97316" },
    { id: "homework", name: "Homework", color: "#06B6D4" },
    { id: "tests", name: "Tests", color: "#F5A623" },
];
const DEFAULT_FOLDERS = [{ id: "general", name: "General", color: "#00C2FF" }];
const APP_VERSION = "v69";
function offsetDateStr(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return dateToLocalStr(d);
}
function weekdayLabel(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    if (Number.isNaN(d.getTime()))
        return dateStr;
    return d.toLocaleDateString([], { weekday: "long" });
}
function pruneRecentDayMap(map) {
    const keep = new Set([offsetDateStr(-2), offsetDateStr(-1), todayStr(), offsetDateStr(1), offsetDateStr(2)]);
    const out = {};
    for (const k of Object.keys(map || {})) {
        if (keep.has(k))
            out[k] = Array.isArray(map[k]) ? map[k] : [];
    }
    return out;
}


function capitalizeLabel(s) {
    return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "";
}
function normalizeTaskTagName(value) {
    let raw = String(value || "").trim();
    if (!raw)
        return "";
    raw = raw.replace(/^#+/, "").trim();
    if (!raw || /\s/.test(raw))
        return "";
    return raw.toLowerCase();
}
function displayTaskTag(value) {
    const clean = normalizeTaskTagName(value);
    return clean ? `#${clean}` : "";
}
function normalizeTaskTags(list) {
    const out = [];
    const seen = new Set();
    if (Array.isArray(list)) {
        for (const item of list) {
            const name = normalizeTaskTagName(item && (item.name || item.taskTag || item.tagName || item.id));
            if (!name || seen.has(name))
                continue;
            seen.add(name);
            out.push({ id: `tag-${name}`, name, createdAt: (item && item.createdAt) || new Date().toISOString() });
        }
    }
    return out;
}
function getTaskDueDateTime(task) {
    if (!task || !task.dueDate)
        return null;
    const t = task.dueTime || "12:00";
    const d = new Date(`${task.dueDate}T${t}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}
function taskDateProximityKey(task) {
    const d = getTaskDueDateTime(task);
    if (!d)
        return Number.MAX_SAFE_INTEGER;
    const now = new Date();
    return Math.abs(d.getTime() - now.getTime());
}
function taskDateColor(task) {
    if (!task || !task.dueDate)
        return C.muted;
    const today = new Date(todayStr() + "T12:00:00");
    const due = new Date(task.dueDate + "T12:00:00");
    const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
    if (diff <= 0)
        return C.red;
    if (diff <= 2)
        return C.amber;
    return C.green;
}
function taskTimeColor(task) {
    if (!task || !task.dueDate || !task.dueTime)
        return C.muted;
    const d = new Date(`${task.dueDate}T${task.dueTime}:00`);
    if (Number.isNaN(d.getTime()))
        return C.muted;
    const diff = (d.getTime() - Date.now()) / 60000;
    if (diff <= 60)
        return C.red;
    if (diff <= 180)
        return C.amber;
    return C.green;
}
function mergeEventCategories(existing) {
    const out = [...DEFAULT_EVENT_CATEGORIES];
    const seen = new Set(out.map(c => c.id));
    if (Array.isArray(existing)) {
        for (const c of existing) {
            if (!c || !c.id || seen.has(c.id))
                continue;
            out.push(c);
            seen.add(c.id);
        }
    }
    return out;
}

function normalizeTaskCategoryId(id) {
    return id === "college" ? "homework" : id;
}
function mergeTaskCategories(existing) {
    const out = [...DEFAULT_CATEGORIES];
    const seen = new Set(out.map(c => c.id));
    const deprecated = new Set(["college"]);
    if (Array.isArray(existing)) {
        for (const c of existing) {
            if (!c || !c.id || deprecated.has(c.id) || seen.has(c.id))
                continue;
            out.push(c);
            seen.add(c.id);
        }
    }
    return out;
}

function getImages(item) {
    const arr = Array.isArray(item && item.imageUrls) ? item.imageUrls.filter(Boolean) : [];
    if (item && item.imageUrl && !arr.includes(item.imageUrl))
        arr.unshift(item.imageUrl);
    return arr;
}
function makeImageData(images) {
    const clean = (images || []).filter(Boolean);
    return { imageUrls: clean, imageUrl: clean[0] || "" };
}
function inlineImageMarker(id) {
    return `[[image:${id}]]`;
}
function normalizeInlineImageSpacing(content) {
    let raw = String(content || "");
    raw = raw.replace(/\r\n/g, "\n");
    raw = raw.replace(/\s*\[\[image:([^\]]+)\]\]\s*/g, (m, id) => `\n[[image:${id}]]\n`);
    raw = raw.replace(/\n{3,}/g, "\n\n");
    return raw;
}
function noteTextHeightSource(text) {
    const raw = String(text || "");
    return raw.replace(/^\n+/, "").replace(/\n+$/, "");
}
function parsePlainTextListLine(line) {
    const value = String(line || "");
    const match = value.match(/^(\s*)(•\s*|-\s*|(\d+)\.\s*)(.*)$/);
    if (!match) return null;
    const marker = match[2];
    return {
        indent: match[1] || "",
        marker,
        number: match[3] ? Number(match[3]) : null,
        kind: marker.trim().startsWith("•") ? "bullet" : (marker.trim().startsWith("-") ? "dash" : "number"),
        text: match[4] || "",
        prefixLength: (match[1] || "").length + marker.length
    };
}
function noteListMarker(style, number = 1) {
    if (style === "bullet") return "• ";
    if (style === "dash") return "- ";
    return `${Math.max(1, Number(number) || 1)}. `;
}
function noteLineBounds(text, pos) {
    const value = String(text || "");
    const safePos = Math.max(0, Math.min(value.length, Number(pos) || 0));
    const start = value.lastIndexOf("\n", Math.max(0, safePos - 1)) + 1;
    const endIndex = value.indexOf("\n", safePos);
    return { start, end: endIndex < 0 ? value.length : endIndex, pos: safePos };
}
function shouldRenderNoteTextBlock(block, blocks, index) {
    if (!block || block.type !== "text") return true;
    const all = blocks || [];
    if (all.length <= 1) return true;
    if (String(block.text || "").trim().length > 0) return true;
    const prev = all[index - 1];
    const isTrailingEditSpace = index === all.length - 1 && prev && prev.type === "image";
    return !!isTrailingEditSpace;
}
function parseNoteContentBlocks(content) {
    const raw = String(content || "");
    const re = /\[\[image:([^\]]+)\]\]/g;
    const blocks = [];
    let last = 0;
    let match;
    while ((match = re.exec(raw))) {
        if (match.index > last) blocks.push({ type: "text", text: raw.slice(last, match.index), start: last, end: match.index });
        blocks.push({ type: "image", id: match[1], start: match.index, end: re.lastIndex });
        last = re.lastIndex;
    }
    if (last < raw.length || blocks.length === 0) blocks.push({ type: "text", text: raw.slice(last), start: last, end: raw.length });
    return blocks;
}
function inlineImageIds(content) {
    return parseNoteContentBlocks(content).filter(b => b.type === "image").map(b => b.id);
}
function estimateNoteTextHeight(text, minHeight) {
    const raw = String(text || "");
    const lines = raw.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 34)), 0);
    return Math.max(minHeight || 180, lines * 27 + 36);
}
function noteShareTextFromContent(content) {
    return String(content || "").replace(/\s*\[\[image:[^\]]+\]\]\s*/g, "\n[Image]\n").replace(/\n{3,}/g, "\n\n").trim();
}
function getNoteEmbeddedImages(note) {
    const embedded = note && note.embeddedImages;
    return embedded && typeof embedded === "object" && !Array.isArray(embedded) ? embedded : {};
}
function getNoteInlineImageUrl(note, id) {
    return getNoteEmbeddedImages(note)[id] || "";
}
function getUnpositionedNoteImages(note) {
    const usedIds = new Set(inlineImageIds(note && note.content));
    const embedded = getNoteEmbeddedImages(note);
    const usedUrls = new Set(Object.keys(embedded).filter(id => usedIds.has(id)).map(id => embedded[id]).filter(Boolean));
    return getImages(note).filter(url => url && !usedUrls.has(url));
}
function InlineImageUploadBtn({ onImages, compact = false }) {
    const ref = useRef(null);
    async function addFiles(files) {
        const list = Array.from(files || []);
        if (!list.length) return;
        const reads = await Promise.all(list.map(f => readImageFile(f)));
        onImages(reads.filter(Boolean));
    }
    const btn = React.createElement("button", {
        onMouseDown: e => e.preventDefault(),
        onTouchStart: e => e.stopPropagation(),
        onClick: () => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.click(); },
        style: {
            padding: compact ? "7px 11px" : "8px 12px",
            borderRadius: compact ? 999 : 10,
            border: `1px solid ${compact ? C.border : C.dim}`,
            background: compact ? C.bg2 : "transparent",
            cursor: "pointer",
            color: compact ? C.text : C.muted,
            fontSize: compact ? 12 : 11,
            fontFamily: "inherit",
            fontWeight: 760,
            letterSpacing: 0.1,
            display: "inline-flex",
            alignItems: "center",
            gap: 6
        }
    }, compact ? "Add Image" : "+ Add Images");
    return React.createElement("div", { style: compact ? { margin: 0 } : { marginTop: 14, marginBottom: 22 } },
        React.createElement("input", { ref: ref, type: "file", accept: "image/*", multiple: true, style: { display: "none" }, onChange: async (e) => { await addFiles(e.target.files); e.target.value = ""; } }),
        btn);
}
function NoteListIcon() {
    return React.createElement("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        React.createElement("path", { d: "M8 6h12M8 12h12M8 18h12" }),
        React.createElement("path", { d: "M3.5 6h.01M3.5 12h.01M3.5 18h.01" }));
}
function NoteChevronIcon() {
    return React.createElement("svg", { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, React.createElement("path", { d: "m7 10 5 5 5-5" }));
}
function renderNoteToolbar({ onImages, showList = false, listMenuOpen = false, onToggleList, onPickList }) {
    const menuRow = (marker, label, style) => React.createElement("button", {
        key: style,
        onMouseDown: e => e.preventDefault(),
        onTouchStart: e => e.stopPropagation(),
        onClick: () => onPickList && onPickList(style),
        style: { width: "100%", display: "flex", alignItems: "center", gap: 11, textAlign: "left", padding: "10px 12px", border: "none", background: "transparent", color: C.text, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 680 }
    }, React.createElement("span", { style: { width: 24, color: C.accent, fontFamily: UI.mono, fontWeight: 800, fontSize: 15 } }, marker), label);
    return React.createElement("div", {
        "data-note-formatting-tray": "true",
        style: { position: "sticky", top: 4, zIndex: 12, margin: "0 0 14px", padding: "5px 0", alignSelf: "flex-start" }
    },
        React.createElement("div", {
            style: { position: "relative", display: "inline-flex", alignItems: "center", gap: 7, padding: 5, borderRadius: 16, border: `1px solid ${C.border}`, background: "rgba(17,24,39,0.88)", boxShadow: "0 8px 22px rgba(0,0,0,.16)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }
        },
            showList && React.createElement(React.Fragment, null,
                React.createElement("button", {
                    onMouseDown: e => e.preventDefault(),
                    onTouchStart: e => e.stopPropagation(),
                    onClick: () => onToggleList && onToggleList(),
                    style: { minHeight: 34, padding: "7px 9px", borderRadius: 11, border: "none", background: listMenuOpen ? C.bg4 : "transparent", color: C.text, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 760, display: "inline-flex", alignItems: "center", gap: 6 }
                }, React.createElement(NoteListIcon, null), "List", React.createElement(NoteChevronIcon, null)),
                React.createElement("span", { style: { width: 1, height: 20, background: C.border, margin: "0 1px" } }),
                listMenuOpen && React.createElement("div", {
                    style: { position: "absolute", top: "calc(100% + 8px)", left: 0, width: 198, padding: 5, borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(17,24,39,0.97)", boxShadow: "0 14px 30px rgba(0,0,0,.32)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", zIndex: 30 }
                }, menuRow("•", "Bulleted list", "bullet"), menuRow("-", "Dashed list", "dash"), menuRow("1.", "Numbered list", "number"))),
            React.createElement(InlineImageUploadBtn, { onImages, compact: true })));
}
function stripHeavyDetails(item) {
    return { ...item, description: "", imageUrl: "", imageUrls: [], embeddedImages: {} };
}
function compactDoneTaskRecord(task) {
    return task;
}
function compactPastApptRecord(appt) {
    const isPastOneTime = appt && appt.date && appt.date < todayStr() && ((appt.recurrence || "none") === "none");
    if (!isPastOneTime || (!appt.description && getImages(appt).length === 0))
        return appt;
    return stripHeavyDetails(appt);
}
function compactStoredRecords(list, compactOne) {
    if (!Array.isArray(list))
        return list;
    let changed = false;
    const next = list.map(item => {
        const compacted = compactOne(item);
        if (compacted !== item)
            changed = true;
        return compacted;
    });
    return changed ? next : list;
}
function taskPlannerId(task) {
    return (task && task.plannerId) || `planner-task-${task && task.id}`;
}
function eventPlannerId(event) {
    return (event && event.plannerId) || `planner-event-${event && event.id}`;
}
function appleNotesWithPlannerId(notes, plannerId) {
    const clean = String(notes || "").trim();
    const marker = `[planner-id: ${plannerId}]`;
    return clean ? `${clean}\n\n${marker}` : marker;
}
function pendingAppleChangeCount(map) {
    return Object.keys(map || {}).length;
}
function normalizePendingAppleChanges(map) {
    if (!map || typeof map !== "object" || Array.isArray(map))
        return {};
    const out = {};
    Object.values(map).forEach(ch => {
        if (!ch || !ch.plannerId || !ch.type)
            return;
        out[ch.plannerId] = { ...ch, operation: ch.operation === "delete" ? "delete" : "upsert" };
    });
    return out;
}
function plannerDeletePayload(change) {
    const plannerId = change && change.plannerId;
    const type = change && change.type;
    if (!plannerId || !type)
        return null;
    return {
        type,
        operation: "delete",
        plannerId,
        title: (change.snapshot && change.snapshot.title) || "",
        notes: "",
        appleNotes: appleNotesWithPlannerId("", plannerId)
    };
}
function ImageUploadBtn({ value, onChange }) {
    const ref = useRef(null);
    return (React.createElement("div", { style: { marginBottom: 10 } },
        React.createElement("input", { ref: ref, type: "file", accept: "image/*", style: { display: "none" }, onChange: async (e) => { var _a; const f = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]; if (f)
                onChange(await readImageFile(f)); } }),
        value ? (React.createElement("div", { style: { position: "relative", display: "inline-block" } },
            React.createElement("img", { src: value, alt: "", onClick: () => openPlannerImage(value), style: { maxWidth: "100%", borderRadius: 10, maxHeight: 150, objectFit: "cover", display: "block" } }),
            React.createElement("button", { onClick: () => onChange(""), style: { position: "absolute", top: 4, right: 4, background: "#00000088", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 14 } }, "\u00D7"))) : (React.createElement("button", { onClick: () => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { padding: "7px 12px", borderRadius: 8, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.muted, fontSize: 10, fontFamily: "inherit", fontWeight: 700, letterSpacing: 0.2 } }, "+ ADD IMAGE"))));
}

function MultiImageUploadBtn({ value, onChange }) {
    const ref = useRef(null);
    const images = Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
    async function addFiles(files) {
        const list = Array.from(files || []);
        if (!list.length)
            return;
        const reads = await Promise.all(list.map(f => readImageFile(f)));
        onChange([...images, ...reads]);
    }
    function removeAt(index) {
        onChange(images.filter((_, i) => i !== index));
    }
    return (React.createElement("div", { style: { marginBottom: 10 } },
        React.createElement("input", { ref: ref, type: "file", accept: "image/*", multiple: true, style: { display: "none" }, onChange: async (e) => { await addFiles(e.target.files); e.target.value = ""; } }),
        images.length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 } }, images.map((url, i) => React.createElement("div", { key: i, style: { position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: C.bg3, border: `1px solid ${C.border}` } },
            React.createElement("img", { src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in" } }),
            React.createElement("button", { onClick: () => removeAt(i), style: { position: "absolute", top: 4, right: 4, background: "#000000AA", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", color: C.red, fontWeight: 900, fontSize: 14 } }, "\u00D7")))),
        React.createElement("button", { onClick: () => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { padding: "7px 12px", borderRadius: 8, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.muted, fontSize: 10, fontFamily: "inherit", fontWeight: 700, letterSpacing: 0.2 } }, images.length ? "+ Add More Images" : "+ Add Images")));
}
function CatPill({ label, active, color, onClick }) {
    const text = prettyLabel(label);
    return React.createElement("button", { onClick: onClick, style: { padding: "7px 12px", minHeight: 32, borderRadius: 999, border: `1px solid ${active ? C.accent + "44" : UI.border}`, cursor: "pointer", background: active ? C.accent + "14" : "rgba(255,255,255,0.035)", color: active ? C.text : C.muted, fontWeight: 760, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.1, boxShadow: "none" } }, text);
}
function prettyLabel(label) {
    const raw = String(label || "").replace(/^\/\/\s*/, "").trim();
    if (!raw) return "";
    return raw.toLowerCase().replace(/\w/g, ch => ch.toUpperCase()).replace(/Ios/g, "iOS").replace(/Api/g, "API");
}
function SectionHeader({ icon, label, color }) {
    return (React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 760, letterSpacing: 0.1, color: C.text, margin: "18px 2px 8px" } },
        React.createElement("span", { style: { color: color || C.muted, opacity: 0.85, fontSize: 13 } }, icon),
        React.createElement("span", null, prettyLabel(label)),
        React.createElement("div", { style: { flex: 1, height: 1, background: UI.border } })));
}
function openPlannerImage(url) {
    if (url)
        window.dispatchEvent(new CustomEvent("planner-lightbox", { detail: url }));
}
function stopLinkedTextEvent(e) {
    if (!e) return;
    e.stopPropagation();
}
function trimLinkTrailingPunctuation(candidate) {
    let text = String(candidate || "");
    let suffix = "";
    while (text && /[.,;:!?\)\]\}]/.test(text[text.length - 1])) {
        const ch = text[text.length - 1];
        if (ch === ")" && (text.match(/\(/g) || []).length > (text.match(/\)/g) || []).length) break;
        if (ch === "]" && (text.match(/\[/g) || []).length > (text.match(/\]/g) || []).length) break;
        if (ch === "}" && (text.match(/\{/g) || []).length > (text.match(/\}/g) || []).length) break;
        suffix = ch + suffix;
        text = text.slice(0, -1);
    }
    return { text, suffix };
}
function safeLinkHref(displayText) {
    const raw = String(displayText || "").trim();
    if (!raw) return "";
    const href = /^www\./i.test(raw) ? `https://${raw}` : raw;
    try {
        const url = new URL(href);
        const protocol = url.protocol.toLowerCase();
        if (protocol === "http:" || protocol === "https:" || protocol === "mailto:") return href;
    }
    catch { }
    return "";
}
function splitLinkedText(text) {
    const raw = String(text || "");
    const re = /(?:https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|mailto:[^\s<>"']+)/gi;
    const parts = [];
    let last = 0;
    let match;
    while ((match = re.exec(raw))) {
        const candidate = match[0];
        const absoluteStart = match.index;
        if (candidate.startsWith("[[image:")) continue;
        if (absoluteStart > last) parts.push({ type: "text", text: raw.slice(last, absoluteStart) });
        const trimmed = trimLinkTrailingPunctuation(candidate);
        const href = safeLinkHref(trimmed.text);
        if (href) parts.push({ type: "link", text: trimmed.text, href });
        else parts.push({ type: "text", text: trimmed.text });
        if (trimmed.suffix) parts.push({ type: "text", text: trimmed.suffix });
        last = absoluteStart + candidate.length;
    }
    if (last < raw.length) parts.push({ type: "text", text: raw.slice(last) });
    return parts.length ? parts : [{ type: "text", text: raw }];
}
function renderLinkedText(text, style = {}, emptyText = "") {
    const raw = String(text || "");
    const display = raw || emptyText;
    const linkStyle = { color: C.accent, textDecoration: "none", fontWeight: 650, overflowWrap: "anywhere", WebkitTapHighlightColor: "transparent" };
    return React.createElement("span", { style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", ...style } }, splitLinkedText(display).map((part, i) => part.type === "link"
        ? React.createElement("a", { key: i, href: part.href, target: "_blank", rel: "noopener noreferrer", onClick: stopLinkedTextEvent, onPointerDown: stopLinkedTextEvent, onPointerUp: stopLinkedTextEvent, onTouchStart: stopLinkedTextEvent, style: linkStyle }, part.text)
        : part.text));
}

function searchTextWithoutMarkers(value) {
    return String(value || "").replace(/\[\[image:[^\]]+\]\]/g, "[Image]").replace(/\s+/g, " ").trim();
}
function buildSearchSnippet(body, query, maxLength = 138) {
    const clean = searchTextWithoutMarkers(body);
    if (!clean) return "";
    const q = String(query || "").trim().toLowerCase();
    const index = q ? clean.toLowerCase().indexOf(q) : -1;
    if (index < 0) return clean.length > maxLength ? clean.slice(0, maxLength - 1).trimEnd() + "…" : clean;
    const before = Math.max(0, index - 54);
    const after = Math.min(clean.length, index + q.length + 78);
    return `${before ? "…" : ""}${clean.slice(before, after).trim()}${after < clean.length ? "…" : ""}`;
}
function renderSearchHighlightedText(value, query) {
    const text = String(value || "");
    const q = String(query || "").trim();
    if (!q) return text;
    const lower = text.toLowerCase();
    const needle = q.toLowerCase();
    const parts = [];
    let cursor = 0;
    let index = lower.indexOf(needle, cursor);
    while (index >= 0) {
        if (index > cursor) parts.push(text.slice(cursor, index));
        parts.push(React.createElement("mark", { key: `${index}-${parts.length}`, style: { color: "inherit", background: C.accent + "35", borderRadius: 4, padding: "0 2px" } }, text.slice(index, index + needle.length)));
        cursor = index + needle.length;
        index = lower.indexOf(needle, cursor);
    }
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts.length ? parts : text;
}
function SearchResultCard({ type, title, snippet, meta, color, query, onClick }) {
    return React.createElement("button", { onClick, style: cardSurface({ width: "100%", padding: "13px 14px", borderRadius: 16, marginBottom: 8, cursor: "pointer", textAlign: "left", fontFamily: "inherit", borderLeft: `3px solid ${color || C.accent}` }) },
        React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 10 } },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 } },
                    React.createElement("span", { style: { color: color || C.accent, background: (color || C.accent) + "1A", borderRadius: 999, padding: "3px 7px", fontSize: 9, fontWeight: 820, letterSpacing: 0.2 } }, type),
                    meta ? React.createElement("span", { style: { color: C.muted, fontSize: 10, fontWeight: 650 } }, meta) : null),
                React.createElement("div", { style: { color: C.text, fontSize: 14, fontWeight: 760, lineHeight: 1.3 } }, renderSearchHighlightedText(title, query)),
                snippet ? React.createElement("div", { style: { color: C.muted, fontSize: 12, lineHeight: 1.5, marginTop: 5, overflowWrap: "anywhere" } }, renderSearchHighlightedText(snippet, query)) : null),
            React.createElement("div", { style: { color: C.dim, fontSize: 19, lineHeight: 1, paddingTop: 5 } }, "›")));
}

function EventViewPanel({ a, onBack, onEdit, onExport }) {
    if (!a)
        return React.createElement("div", null);
    const d = new Date(a.date + "T12:00:00");
    return React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 16, borderLeft: `3px solid ${a.color}`, marginTop: 10, marginBottom: 14, boxShadow: "none" }) },
        React.createElement("button", { onClick: onBack, style: { background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.2, marginBottom: 12, padding: 0 } }, "← BACK"),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 8 } },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 18, fontWeight: 800, color: a.color, lineHeight: 1.3, marginBottom: 5 } }, a.title),
                React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 0.2, lineHeight: 1.6 } }, d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })),
                a.categoryText && React.createElement("div", { style: { fontSize: 11, color: a.color, letterSpacing: 0.2, lineHeight: 1.6, fontWeight: 800 } }, "Category: ", a.categoryText),
                (a.time || a.endTime) && React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 0.2, lineHeight: 1.6 } }, a.time || "No start", a.endTime ? ` – ${a.endTime}` : "")),
            React.createElement("button", { onClick: () => onEdit(a), style: { padding: "7px 12px", borderRadius: 9, border: "none", background: C.accent, color: C.text, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2 } }, "Edit")),
        onExport && React.createElement("button", { onClick: () => onExport(a), style: { width: "100%", padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, marginTop: 8 } }, "Send to Apple Calendar"),
                    getImages(a).length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, margin: "12px 0" } }, getImages(a).map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1", borderRadius: 10, objectFit: "cover", display: "block", cursor: "zoom-in" } }))),
        React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.7, marginTop: 12 } }, a.description ? renderLinkedText(a.description) : "No description."));
}

function TaskCard({ task, categories, onToggle, onDelete, onEdit, onToggleSubtask, onAddSubtask, onExport, onCopyToToday }) {
    var _a, _b;
    const [expanded, setExpanded] = useState(false);
    const [newSub, setNewSub] = useState("");
    const [actionMode, setActionMode] = useState(false);
    const tapRef = useRef(null);
    const p = PRIORITY[task.priority] || PRIORITY.medium;
    const cat = categories.find(c => c.id === task.categoryId);
    const subs = (_a = task.subtasks) !== null && _a !== void 0 ? _a : [];
    const subDone = subs.filter(s => s.done).length;
    const isOverdue = !task.done && task.dueDate && task.dueDate < todayStr();
    const isToday = !task.done && isTodayStr(task.dueDate);
    const recurLabel = { daily: "↺ Daily", weekly: "↺ Weekly", monthly: "↺ Monthly" };
    const taskImages = getImages(task);
    const hasExtra = !!(task.description || taskImages.length || subs.length);
    const cardStyle = cardSurface({ borderRadius: 16, padding: "14px 14px", marginBottom: 10, borderLeft: task.done ? `3px solid ${C.dim}` : isOverdue ? `3px solid ${C.red}` : `3px solid ${p.color}`, opacity: task.done ? 0.48 : 1, transition: "transform 0.16s ease, opacity 0.25s ease, border-color 0.16s ease", cursor: "pointer" });
    const stop = e => { e.stopPropagation(); };
    const actionBtn = (label, title, color, onClick, bg) => React.createElement("button", { title, onClick: e => { e.stopPropagation(); e.preventDefault(); onClick(); }, onPointerDown: stop, onPointerUp: stop, style: actionButtonSurface(color, bg) }, label);
    function isInteractiveTarget(e) {
        return !!(e && e.target && e.target.closest && e.target.closest("button,input,textarea,select,a"));
    }
    function rememberTap(e) {
        if (isInteractiveTarget(e)) {
            tapRef.current = null;
            return;
        }
        tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
    function maybeOpenActions(e) {
        if (isInteractiveTarget(e)) {
            tapRef.current = null;
            return;
        }
        const start = tapRef.current;
        tapRef.current = null;
        if (!start)
            return;
        const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
        if (moved <= 12 && Date.now() - start.t < 700)
            setActionMode(true);
    }
    if (actionMode) {
        return React.createElement("div", { style: { ...cardStyle, opacity: 1, minHeight: 64, display: "flex", alignItems: "center" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" } },
                actionBtn(React.createElement(ActionIcon, { name: "return" }), "Return", C.red, () => setActionMode(false), C.red + "14"),
                React.createElement("div", { style: { flex: 1, display: "flex", justifyContent: "space-around", gap: 10 } },
                    onCopyToToday ? actionBtn(React.createElement(ActionIcon, { name: "today" }), "Send to Today tasks", C.amber, () => { onCopyToToday(task); setActionMode(false); }, C.amber + "16") : null,
                    onExport ? actionBtn(React.createElement(ActionIcon, { name: "sync" }), "Sync to Apple", C.bg0, () => { onExport(task); setActionMode(false); }, C.amber) : null,
                    actionBtn(React.createElement(ActionIcon, { name: "edit" }), "Edit", C.text, () => { onEdit(task); setActionMode(false); }),
                    actionBtn(React.createElement(ActionIcon, { name: "delete" }), "Delete", C.red, () => { onDelete(task.id); setActionMode(false); }, C.red + "14"))));
    }
    const metaItems = [];
    if (!task.done)
        metaItems.push(React.createElement("span", { key: "pri", style: { fontSize: 9, fontWeight: 700, color: isOverdue ? C.red : isToday ? C.green : p.color, letterSpacing: 0.4 } }, isOverdue ? "⚠ Overdue" : isToday ? "● Today" : `${p.icon} ${p.label}`));
    if (task.done)
        metaItems.push(React.createElement("span", { key: "done", style: { fontSize: 9, fontWeight: 800, color: C.green, letterSpacing: 0.2 } }, "✓ DONE"));
    const taskTagLabel = displayTaskTag(task.taskTag || task.tagName || "");
    if (taskTagLabel)
        metaItems.push(React.createElement("span", { key: "tag", style: { fontSize: 9, fontWeight: 800, color: C.muted, background: UI.controlBg, padding: "1px 6px", borderRadius: 10, letterSpacing: 0.2 } }, taskTagLabel));
    if (cat)
        metaItems.push(React.createElement("span", { key: "cat", style: { fontSize: 9, fontWeight: 700, color: cat.color, background: cat.color + "18", padding: "1px 6px", borderRadius: 10, letterSpacing: 0.2 } }, cat.name));
    if (task.dueDate && !task.done)
        metaItems.push(React.createElement("span", { key: "date", style: { fontSize: 9, color: taskDateColor(task), letterSpacing: 0.2, fontWeight: 800 } }, "📅 ", formatBrDate(task.dueDate)));
    if (task.dueTime && !task.done)
        metaItems.push(React.createElement("span", { key: "time", style: { fontSize: 9, color: taskTimeColor(task), letterSpacing: 0.2, fontWeight: 800 } }, "⏰ ", task.dueTime));
    if (((_b = task.recurrence) !== null && _b !== void 0 ? _b : "none") !== "none" && !task.done)
        metaItems.push(React.createElement("span", { key: "rec", style: { fontSize: 9, color: C.accent, fontWeight: 700, letterSpacing: 0.2 } }, recurLabel[task.recurrence]));
    if (subs.length > 0)
        metaItems.push(React.createElement("span", { key: "subs", style: { fontSize: 9, color: subDone === subs.length ? C.green : C.muted, letterSpacing: 0.2 } }, "☑ ", subDone, "/", subs.length));
    const expandButton = hasExtra ? React.createElement("button", { onClick: e => { e.stopPropagation(); e.preventDefault(); setExpanded(v => !v); }, onPointerDown: stop, onPointerUp: stop, title: expanded ? "Collapse" : "Expand", style: { width: 36, height: 36, borderRadius: 12, border: `1px solid ${C.border}`, background: UI.controlBg, color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", fontWeight: 900 } }, expanded ? "▲" : "▼") : React.createElement("div", { style: { width: 36, height: 36, flexShrink: 0 } });
    const detailChildren = [];
    if (task.description)
        detailChildren.push(React.createElement("div", { key: "desc", onClick: stop, onPointerDown: stop, onPointerUp: stop, style: { fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 8 } }, renderLinkedText(task.description)));
    if (taskImages.length > 0)
        detailChildren.push(React.createElement("div", { key: "imgs", style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 } }, taskImages.map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: e => { e.stopPropagation(); openPlannerImage(url); }, style: { width: "100%", aspectRatio: "1", borderRadius: 8, objectFit: "cover", display: "block", cursor: "zoom-in" } }))));
    if (subs.length > 0)
        detailChildren.push(React.createElement("div", { key: "subs", style: { marginBottom: 8 } }, subs.map(s => React.createElement("div", { key: s.id, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 } },
            React.createElement("button", { onClick: e => { e.stopPropagation(); onToggleSubtask(task.id, s.id); }, onPointerDown: stop, onPointerUp: stop, style: { width: 18, height: 18, borderRadius: 4, border: s.done ? "none" : `1px solid ${C.dim}`, background: s.done ? C.green : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg0, fontWeight: 700, fontSize: 10 } }, s.done ? "✓" : ""),
            React.createElement("span", { style: { fontSize: 12, color: s.done ? C.dim : C.muted, textDecoration: s.done ? "line-through" : "none" } }, s.text)))));
    detailChildren.push(React.createElement("div", { key: "add", style: { display: "flex", gap: 6 } },
        React.createElement("input", { placeholder: "Add subtask...", value: newSub, onClick: stop, onPointerDown: stop, onPointerUp: stop, onChange: e => setNewSub(e.target.value), onKeyDown: e => { if (e.key === "Enter" && newSub.trim()) { onAddSubtask(task.id, newSub.trim()); setNewSub(""); } }, style: { ...inp, flex: 1, padding: "6px 10px", fontSize: 11 } }),
        React.createElement("button", { onClick: e => { e.stopPropagation(); if (newSub.trim()) { onAddSubtask(task.id, newSub.trim()); setNewSub(""); } }, onPointerDown: stop, onPointerUp: stop, style: { padding: "6px 10px", borderRadius: 8, border: "none", background: C.accent, color: C.text, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" } }, "+")));
    return React.createElement("div", { style: cardStyle, onPointerDown: rememberTap, onPointerUp: maybeOpenActions },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            React.createElement("button", { onClick: e => { e.stopPropagation(); onToggle(task.id); }, onPointerDown: stop, onPointerUp: stop, style: { width: 22, height: 22, borderRadius: 6, border: task.done ? "none" : `1px solid ${isOverdue ? C.red : p.color}66`, background: task.done ? C.green : "transparent", cursor: "pointer", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg0, fontWeight: 800, boxShadow: task.done ? "none" : "none" } }, task.done ? "✓" : ""),
            React.createElement("div", { style: { flex: 1, minWidth: 0, paddingRight: 2 } },
                React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none", letterSpacing: 0.3 } }, task.text),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 3, alignItems: "center", flexWrap: "wrap" } }, metaItems)),
            expandButton),
        expanded ? React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` } }, detailChildren) : null);
}

function TodayTaskCard({ task, onToggle, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
    const [expanded, setExpanded] = useState(false);
    const [actionMode, setActionMode] = useState(false);
    const tapRef = useRef(null);
    const hasDesc = !!(task.description && task.description.trim());
    const stop = e => e.stopPropagation();
    const actionBtn = (label, title, color, onClick, bg) => React.createElement("button", { title, onClick: e => { e.stopPropagation(); e.preventDefault(); onClick(); }, onPointerDown: stop, onPointerUp: stop, style: actionButtonSurface(color, bg) }, label);
    function isInteractiveTarget(e) {
        return !!(e && e.target && e.target.closest && e.target.closest("button,input,textarea,select,a"));
    }
    function rememberTap(e) {
        if (isInteractiveTarget(e)) {
            tapRef.current = null;
            return;
        }
        tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
    function maybeOpenActions(e) {
        if (isInteractiveTarget(e)) {
            tapRef.current = null;
            return;
        }
        const start = tapRef.current;
        tapRef.current = null;
        if (!start) return;
        const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
        if (moved <= 12 && Date.now() - start.t < 700) setActionMode(true);
    }
    const cardStyle = cardSurface({ borderRadius: 16, padding: "13px 14px", marginBottom: 8, borderLeft: task.done ? `3px solid ${C.green}` : `3px solid ${C.amber}`, opacity: task.done ? 0.55 : 1, cursor: "pointer" });
    if (actionMode) {
        return React.createElement("div", { style: { ...cardStyle, opacity: 1, minHeight: 62, display: "flex", alignItems: "center" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%" } },
                actionBtn(React.createElement(ActionIcon, { name: "return" }), "Return", C.red, () => setActionMode(false), C.red + "14"),
                React.createElement("div", { style: { flex: 1, display: "flex", justifyContent: "flex-end", gap: 8 } },
                    actionBtn("↑", "Move up", canMoveUp ? C.text : C.dim, () => canMoveUp && onMoveUp(), "rgba(255,255,255,0.045)"),
                    actionBtn("↓", "Move down", canMoveDown ? C.text : C.dim, () => canMoveDown && onMoveDown(), "rgba(255,255,255,0.045)"),
                    actionBtn(React.createElement(ActionIcon, { name: "delete" }), "Delete", C.red, () => { onDelete(task.id); setActionMode(false); }, C.red + "14"))));
    }
    return React.createElement("div", { style: cardStyle, onPointerDown: rememberTap, onPointerUp: maybeOpenActions },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            React.createElement("button", { onClick: e => { e.stopPropagation(); onToggle(task.id); }, onPointerDown: stop, onPointerUp: stop, style: { width: 22, height: 22, borderRadius: 7, border: task.done ? "none" : `1px solid ${C.amber}55`, background: task.done ? C.green : "transparent", cursor: "pointer", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg0, fontWeight: 900 } }, task.done ? "✓" : ""),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 14, fontWeight: 650, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none", lineHeight: 1.35 } }, task.title || "Untitled"),
                hasDesc && React.createElement("button", { onClick: e => { e.stopPropagation(); setExpanded(!expanded); }, onPointerDown: stop, onPointerUp: stop, style: { marginTop: 3, padding: 0, border: "none", background: "transparent", color: C.dim, fontSize: 10, fontWeight: 760, fontFamily: "inherit", cursor: "pointer" } }, expanded ? "Hide note" : "Show note"))),
        expanded && hasDesc && React.createElement("div", { onClick: stop, onPointerDown: stop, onPointerUp: stop, style: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${UI.border}`, fontSize: 12, color: C.muted, lineHeight: 1.6 } }, renderLinkedText(task.description)));
}

function ApptCard({ appt, onDelete, onEdit, onExport, onView }) {
    const [expanded, setExpanded] = useState(false);
    const [actionMode, setActionMode] = useState(false);
    const tapRef = useRef(null);
    const d = new Date(appt.date + "T12:00:00");
    const apptImages = getImages(appt);
    const hasExtra = !!(appt.description || apptImages.length);
    const recurLabel = { daily: "↺ Daily", weekly: "↺ Weekly", monthly: "↺ Monthly" };
    const cardStyle = cardSurface({ borderRadius: 16, padding: "14px 14px", marginBottom: 10, borderLeft: `3px solid ${appt.color}`, cursor: "pointer" });
    const stop = e => e.stopPropagation();
    const actionBtn = (label, title, color, onClick, bg) => React.createElement("button", { title, onClick: e => { e.stopPropagation(); e.preventDefault(); onClick(); }, onPointerDown: stop, onPointerUp: stop, style: actionButtonSurface(color, bg) }, label);
    function isInteractiveTarget(e) {
        return !!(e && e.target && e.target.closest && e.target.closest("button,input,textarea,select,a"));
    }
    function rememberTap(e) {
        if (isInteractiveTarget(e)) { tapRef.current = null; return; }
        tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
    function maybeOpenActions(e) {
        if (isInteractiveTarget(e)) { tapRef.current = null; return; }
        const start = tapRef.current;
        tapRef.current = null;
        if (!start) return;
        const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
        if (moved <= 12 && Date.now() - start.t < 700) setActionMode(true);
    }
    if (actionMode) {
        return React.createElement("div", { style: { ...cardStyle, minHeight: 64, display: "flex", alignItems: "center" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" } },
                actionBtn(React.createElement(ActionIcon, { name: "return" }), "Return", C.red, () => setActionMode(false), C.red + "14"),
                React.createElement("div", { style: { flex: 1, display: "flex", justifyContent: "space-around", gap: 10 } },
                    onView && actionBtn(React.createElement(ActionIcon, { name: "open" }), "Open", C.accent, () => { onView(appt); setActionMode(false); }, C.accent + "18"),
                    onExport && actionBtn(React.createElement(ActionIcon, { name: "sync" }), "Sync to Apple", C.bg0, () => { onExport(appt); setActionMode(false); }, C.amber),
                    actionBtn(React.createElement(ActionIcon, { name: "edit" }), "Edit", C.text, () => { onEdit(appt); setActionMode(false); }),
                    actionBtn(React.createElement(ActionIcon, { name: "delete" }), "Delete", C.red, () => { onDelete(appt.id); setActionMode(false); }, C.red + "14"))));
    }
    const expandButton = hasExtra ? React.createElement("button", { onClick: e => { e.stopPropagation(); e.preventDefault(); setExpanded(v => !v); }, onPointerDown: stop, onPointerUp: stop, title: expanded ? "Collapse" : "Expand", style: { width: 36, height: 36, borderRadius: 12, border: `1px solid ${C.border}`, background: UI.controlBg, color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", fontWeight: 900 } }, expanded ? "▲" : "▼") : React.createElement("div", { style: { width: 36, height: 36, flexShrink: 0 } });
    return (React.createElement("div", { style: cardStyle, onPointerDown: rememberTap, onPointerUp: maybeOpenActions },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
            React.createElement("div", { style: { background: appt.color + "18", borderRadius: 8, padding: "6px 8px", textAlign: "center", minWidth: 38, flexShrink: 0 } },
                React.createElement("div", { style: { fontSize: 8, fontWeight: 700, color: appt.color, letterSpacing: 0.2 } }, MONTHS[d.getMonth()]),
                React.createElement("div", { style: { fontSize: 20, fontWeight: 900, color: appt.color, lineHeight: 1.1 } }, d.getDate())),
            React.createElement("div", { style: { flex: 1, minWidth: 0, paddingRight: 2 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: C.text } }, appt.title),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap", alignItems: "center" } },
                    appt.time && React.createElement("span", { style: { fontSize: 10, color: C.muted, letterSpacing: 0.2 } }, appt.time + (appt.endTime ? `–${appt.endTime}` : "")),
                    appt.categoryText && React.createElement("span", { style: { fontSize: 9, color: appt.color, background: appt.color + "18", fontWeight: 800, letterSpacing: 0.2, borderRadius: 10, padding: "1px 6px" } }, appt.categoryText),
                    appt.recurrence !== "none" && React.createElement("span", { style: { fontSize: 9, color: appt.color, fontWeight: 700, letterSpacing: 0.2 } }, recurLabel[appt.recurrence]))),
            expandButton),
        expanded && hasExtra && (React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` } },
            appt.description && React.createElement("div", { onClick: stop, onPointerDown: stop, onPointerUp: stop, style: { fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: apptImages.length ? 8 : 0 } }, renderLinkedText(appt.description)),
            apptImages.length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: appt.description ? 8 : 0 } }, apptImages.map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: e => { e.stopPropagation(); openPlannerImage(url); }, style: { width: "100%", aspectRatio: "1", borderRadius: 8, objectFit: "cover", display: "block", cursor: "zoom-in" } })))))));
}

function DayTimeline({ date, appts, onEdit, onDelete, selectedApptId, onBack, onRealEdit, onExport }) {
    var _a;
    const sorted = [...appts].sort((a, b) => (timeToMinutes(a.time) ?? 9999) - (timeToMinutes(b.time) ?? 9999));
    const startHour = 5;
    const endHour = 22;
    const hourHeight = 58;
    const timelineHeight = (endHour - startHour + 1) * hourHeight;
    const noTime = sorted.filter(a => !a.time);
    const timed = sorted.filter(a => a.time);
    return (React.createElement("div", { style: { marginTop: 14 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } },
            React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.accent, marginBottom: 4 } }, "// DAY TIMELINE"),
                React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: 0.3 } }, date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }).toUpperCase())),
            React.createElement("div", { style: { fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.2 } }, sorted.length, " EVENT", sorted.length === 1 ? "" : "S")),
        noTime.length > 0 && React.createElement("div", { style: { marginBottom: 10 } },
            React.createElement("div", { style: { fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: 0.4, marginBottom: 6 } }, "NO TIME"),
            noTime.map(a => React.createElement(React.Fragment, { key: a.id }, React.createElement(ApptCard, { appt: a, onDelete: onDelete, onEdit: onEdit, onExport: onExport }), selectedApptId === a.id && React.createElement(EventViewPanel, { a: a, onBack: onBack, onEdit: onRealEdit || onEdit, onExport: onExport })))),
        timed.length === 0 ? (noTime.length ? null : React.createElement(EmptyState, { title: "Nothing scheduled for this day.", description: "Add an event when you are ready.", icon: "□" }))
            : React.createElement("div", { style: { position: "relative", minHeight: timelineHeight, borderLeft: `1px solid ${C.border}`, marginLeft: 50, paddingBottom: 20 } },
                Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                    const hour = startHour + i;
                    return React.createElement("div", { key: hour, style: { position: "absolute", top: i * hourHeight, left: 0, right: 0, height: 1, background: C.border } },
                        React.createElement("div", { style: { position: "absolute", left: -50, top: -9, width: 40, textAlign: "right", fontSize: 10, color: C.muted, fontWeight: 600 } }, String(hour).padStart(2, "0"), ":00"));
                }),
                timed.map((a, idx) => {
                    const start = timeToMinutes(a.time) ?? startHour * 60;
                    const top = Math.max(0, ((start - startHour * 60) / 60) * hourHeight);
                    const duration = eventDurationMinutes(a);
                    const height = Math.max(42, (duration / 60) * hourHeight - 4);
                    const slightOffset = (idx % 2) * 8;
                    return React.createElement(React.Fragment, { key: a.id },
                        React.createElement("div", { onClick: () => onEdit(a), style: { position: "absolute", top, left: 12 + slightOffset, right: 0, minHeight: height, borderRadius: 10, background: UI.cardBg, border: `1px solid ${UI.border}`, borderLeft: `4px solid ${a.color}`, boxShadow: "none", padding: "9px 10px", cursor: "pointer", overflow: "hidden" } },
                            React.createElement("button", { onClick: e => { e.stopPropagation(); onDelete(a.id); }, style: { position: "absolute", right: 7, top: 6, background: "transparent", border: "none", color: a.color, fontWeight: 900, fontSize: 13, cursor: "pointer" } }, "\u00d7"),
                            React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: a.color, lineHeight: 1.25, paddingRight: 18 } }, a.title),
                            React.createElement("div", { style: { fontSize: 10, color: a.color, marginTop: 3, fontWeight: 700, letterSpacing: 0.5 } }, a.time, a.endTime ? ` \u2013 ${a.endTime}` : ""),
                            a.description && height > 64 && React.createElement("div", { onClick: e => e.stopPropagation(), onPointerDown: e => e.stopPropagation(), onPointerUp: e => e.stopPropagation(), style: { fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } }, renderLinkedText(a.description))),
                        selectedApptId === a.id && React.createElement("div", { style: { position: "absolute", top: top + height + 8, left: 0, right: 0, zIndex: 30 } },
                            React.createElement(EventViewPanel, { a: a, onBack: onBack, onEdit: onRealEdit || onEdit, onExport: onExport })));
                }))));
}


const MED_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function cleanMedTimes(times) {
    if (Array.isArray(times))
        return times.map(t => String(t || "").trim()).filter(Boolean);
    if (typeof times === "string")
        return times.split(",").map(t => t.trim()).filter(Boolean);
    return [];
}
function buildMedDoseKey(med, dateStr, label) {
    return "med-" + med.id + "-" + dateStr + "-" + String(label || "dose").replace(/[^a-z0-9]/gi, "_");
}
function getMedDosesForDate(med, dateStr) {
    if (!med || !med.id || !dateStr)
        return [];
    const d = new Date(dateStr + "T12:00:00");
    if (Number.isNaN(d.getTime()))
        return [];
    const type = med.scheduleType || "daily-anytime";
    let labels = [];
    if (type === "daily-times") {
        const times = cleanMedTimes(med.times);
        labels = (times.length ? times : ["09:00"]).map(t => ({ label: t, time: t }));
    }
    else if (type === "weekly") {
        const day = Number(med.weeklyDay ?? 0);
        if (d.getDay() !== day)
            return [];
        const t = med.weeklyTime || "";
        labels = [{ label: t || "Weekly dose", time: t }];
    }
    else if (type === "interval") {
        const intervalDays = Math.max(1, Number(med.intervalDays || 1));
        const start = new Date((med.startDate || dateStr) + "T12:00:00");
        if (Number.isNaN(start.getTime()))
            return [];
        const diff = Math.floor((d.getTime() - start.getTime()) / 86400000);
        if (diff < 0 || diff % intervalDays !== 0)
            return [];
        const t = med.intervalTime || "";
        labels = [{ label: t || ("Every " + intervalDays + " day dose"), time: t }];
    }
    else {
        const n = Math.max(1, Math.min(12, Number(med.timesPerDay || 1)));
        labels = Array.from({ length: n }, (_, i) => ({ label: "Dose " + (i + 1), time: "" }));
    }
    return labels.map(x => ({ ...x, key: buildMedDoseKey(med, dateStr, x.label) }));
}
function medScheduleSummary(med) {
    if (!med)
        return "";
    const type = med.scheduleType || "daily-anytime";
    if (type === "daily-times") {
        const times = cleanMedTimes(med.times);
        return "Daily at " + (times.length ? times.join(", ") : "chosen times");
    }
    if (type === "weekly")
        return "Weekly on " + MED_DAYS[Number(med.weeklyDay ?? 0)] + (med.weeklyTime ? " at " + med.weeklyTime : "");
    if (type === "interval")
        return "Every " + Math.max(1, Number(med.intervalDays || 1)) + " day(s)" + (med.startDate ? ", from " + formatBrDate(med.startDate) : "") + (med.intervalTime ? " at " + med.intervalTime : "");
    const n = Math.max(1, Number(med.timesPerDay || 1));
    return n === 1 ? "Once a day, no specific time" : n + " times a day, no specific time";
}
function MedicationCard({ med, medLogs, onToggleDose, onEdit, onDelete }) {
    const [actionMode, setActionMode] = useState(false);
    const tapRef = useRef(null);
    const doses = getMedDosesForDate(med, todayStr());
    const taken = doses.filter(d => medLogs[d.key]).length;
    const stop = e => e.stopPropagation();
    const actionBtn = (label, title, color, onClick, bg) => React.createElement("button", { title, onClick: e => { e.stopPropagation(); e.preventDefault(); onClick(); }, onPointerDown: stop, onPointerUp: stop, style: actionButtonSurface(color, bg) }, label);
    function rememberTap(e) { tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }; }
    function maybeOpenActions(e) {
        const start = tapRef.current;
        tapRef.current = null;
        if (!start) return;
        const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
        if (moved <= 12 && Date.now() - start.t < 700) setActionMode(true);
    }
    const cardStyle = cardSurface({ borderRadius: 18, padding: 15, borderLeft: `3px solid ${med.color || C.green}`, marginBottom: 10, cursor: "pointer" });
    if (actionMode) {
        return React.createElement("div", { style: { ...cardStyle, minHeight: 62, display: "flex", alignItems: "center" } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%" } },
                actionBtn(React.createElement(ActionIcon, { name: "return" }), "Return", C.red, () => setActionMode(false), C.red + "14"),
                React.createElement("div", { style: { flex: 1, display: "flex", justifyContent: "flex-end", gap: 8 } },
                    actionBtn(React.createElement(ActionIcon, { name: "edit" }), "Edit", C.text, () => { onEdit(med); setActionMode(false); }),
                    actionBtn(React.createElement(ActionIcon, { name: "delete" }), "Delete", C.red, () => { onDelete(med.id); setActionMode(false); }, C.red + "14"))));
    }
    return React.createElement("div", { style: cardStyle, onPointerDown: rememberTap, onPointerUp: maybeOpenActions },
        React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: doses.length ? 12 : 0 } },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 16, fontWeight: 780, color: C.text, lineHeight: 1.25 } }, med.name || "Medication"),
                React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.4 } }, medScheduleSummary(med)),
                med.notes && React.createElement("div", { style: { fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.55, whiteSpace: "pre-wrap" } }, med.notes)),
            React.createElement("div", { style: { fontSize: 12, color: taken === doses.length && doses.length ? C.green : C.muted, fontWeight: 760, whiteSpace: "nowrap" } }, taken, "/", doses.length, " taken")),
        doses.length ? React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 7 } }, doses.map(d => React.createElement("button", { key: d.key, onClick: e => { e.stopPropagation(); onToggleDose(d.key); }, onPointerDown: stop, onPointerUp: stop, style: { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 11px", borderRadius: 12, border: `1px solid ${medLogs[d.key] ? C.green + "44" : UI.border}`, background: medLogs[d.key] ? C.green + "16" : "rgba(255,255,255,0.035)", cursor: "pointer", color: medLogs[d.key] ? C.green : C.text, fontFamily: "inherit", fontWeight: 720, textAlign: "left" } },
            React.createElement("span", { style: { width: 22, height: 22, borderRadius: 7, border: medLogs[d.key] ? "none" : `1px solid ${C.dim}`, background: medLogs[d.key] ? C.green : "transparent", color: C.bg0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 } }, medLogs[d.key] ? "✓" : ""),
            React.createElement("span", null, d.label)))) : React.createElement("div", { style: { fontSize: 12, color: C.dim, marginTop: 10 } }, "No dose scheduled today."));
}
function MedicationForm({ draft, setDraft, onSave, onCancel, editing }) {
    const type = draft.scheduleType || "daily-anytime";
    const timeText = cleanMedTimes(draft.times).join(", ");
    return React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 16, marginBottom: 14 }) },
        React.createElement("input", { autoFocus: true, placeholder: "Medication name", value: draft.name || "", onChange: e => setDraft(d => ({ ...d, name: e.target.value })), style: { ...inp, marginBottom: 8 } }),
        React.createElement("textarea", { placeholder: "Notes, dose, instructions (optional)", value: draft.notes || "", onChange: e => setDraft(d => ({ ...d, notes: e.target.value })), rows: 2, style: { ...inp, resize: "none", marginBottom: 8 } }),
        React.createElement("select", { value: type, onChange: e => setDraft(d => ({ ...d, scheduleType: e.target.value })), style: { ...inp, marginBottom: 8 } },
            React.createElement("option", { value: "daily-anytime" }, "Daily · no specific time"),
            React.createElement("option", { value: "daily-times" }, "Daily · specific times"),
            React.createElement("option", { value: "weekly" }, "Weekly"),
            React.createElement("option", { value: "interval" }, "Every X days")),
        type === "daily-anytime" && React.createElement("div", { style: { marginBottom: 8 } },
            React.createElement("div", { style: { fontSize: 8, fontWeight: 800, letterSpacing: 0.4, color: C.muted, marginBottom: 4 } }, "TIMES PER DAY"),
            React.createElement("input", { type: "number", min: 1, max: 12, value: draft.timesPerDay || 1, onChange: e => setDraft(d => ({ ...d, timesPerDay: e.target.value })), style: { ...inp } })),
        type === "daily-times" && React.createElement("div", { style: { marginBottom: 8 } },
            React.createElement("div", { style: { fontSize: 8, fontWeight: 800, letterSpacing: 0.4, color: C.muted, marginBottom: 4 } }, "TIMES, SEPARATED BY COMMAS"),
            React.createElement("input", { placeholder: "09:00, 21:00", value: timeText, onChange: e => setDraft(d => ({ ...d, times: e.target.value })), style: { ...inp } })),
        type === "weekly" && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 8 } },
            React.createElement("select", { value: draft.weeklyDay ?? 0, onChange: e => setDraft(d => ({ ...d, weeklyDay: Number(e.target.value) })), style: { ...inp } },
                MED_DAYS.map((day, i) => React.createElement("option", { key: day, value: i }, day))),
            React.createElement("input", { type: "time", value: draft.weeklyTime || "", onChange: e => setDraft(d => ({ ...d, weeklyTime: e.target.value })), style: { ...inp, padding: "10px 6px", textAlign: "center" } })),
        type === "interval" && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,0.8fr) minmax(0,1.1fr) minmax(0,1fr)", gap: 8, marginBottom: 8 } },
            React.createElement("input", { type: "number", min: 1, value: draft.intervalDays || 2, onChange: e => setDraft(d => ({ ...d, intervalDays: e.target.value })), style: { ...inp } }),
            React.createElement("input", { type: "date", value: draft.startDate || todayStr(), onChange: e => setDraft(d => ({ ...d, startDate: e.target.value })), style: { ...inp, minWidth: 0 } }),
            React.createElement("input", { type: "time", value: draft.intervalTime || "", onChange: e => setDraft(d => ({ ...d, intervalTime: e.target.value })), style: { ...inp, padding: "10px 6px", textAlign: "center" } })),
        React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 } }, ACCENT_COLORS.map(c => React.createElement("button", { key: c, onClick: () => setDraft(d => ({ ...d, color: c })), style: { width: 24, height: 24, borderRadius: 7, border: "none", background: c, cursor: "pointer", outline: (draft.color || C.green) === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: 2, opacity: (draft.color || C.green) === c ? 1 : 0.45 } }))),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement("button", { onClick: onCancel, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 800, fontFamily: "inherit", fontSize: 11, letterSpacing: 0.2 } }, "Cancel"),
            React.createElement("button", { onClick: onSave, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 900, fontFamily: "inherit", fontSize: 11, letterSpacing: 0.2 } }, editing ? "Save Medication" : "Add Medication")));
}

function QuickCapture({ categories, folders, onAddTask, onAddNote, onClose, fixed }) {
    var _a, _b, _c, _d;
    const [text, setText] = useState("");
    const [type, setType] = useState("task");
    const [catId, setCatId] = useState((_b = (_a = categories[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "personal");
    const [folderId, setFolderId] = useState((_d = (_c = folders[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : "general");
    const ref = useRef(null);
    useEffect(() => { setTimeout(() => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 100); }, []);
    function save() {
        if (!text.trim())
            return;
        if (type === "task")
            onAddTask(text.trim(), catId);
        else
            onAddNote(text.trim(), folderId);
        onClose();
    }
    return (React.createElement("div", { style: { position: fixed ? "fixed" : "absolute", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end" }, onClick: onClose },
        React.createElement("div", { style: cardSurface({ width: "100%", borderRadius: "28px 28px 0 0", padding: "22px 16px 38px", border: `1px solid ${UI.border}` }), onClick: e => e.stopPropagation() },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.accent } }, "Quick Capture"),
                React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", fontWeight: 700 } }, "\u00D7")),
            React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 12, background: C.bg3, borderRadius: 10, padding: 3 } }, [["task", "Task"], ["note", "Note"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setType(k), style: { flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10, letterSpacing: 0.3, fontFamily: "inherit", background: type === k ? C.accent + "20" : "transparent", color: type === k ? C.accent : C.muted } }, l)))),
            React.createElement("input", { ref: ref, placeholder: type === "task" ? "What needs doing?" : "Note title...", value: text, onChange: e => setText(e.target.value), onKeyDown: e => e.key === "Enter" && save(), style: { ...inp, marginBottom: 10 } }),
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" } }, type === "task"
                ? categories.map(c => React.createElement(CatPill, { key: c.id, label: c.name.toUpperCase(), active: catId === c.id, color: c.color, onClick: () => setCatId(c.id) }))
                : folders.map(f => React.createElement(CatPill, { key: f.id, label: f.name, active: folderId === f.id, color: f.color, onClick: () => setFolderId(f.id) }))),
            React.createElement("button", { onClick: save, style: { width: "100%", padding: 12, borderRadius: 12, border: "none", background: C.accent, color: C.text, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.2, boxShadow: "none" } }, "Capture"))));
}
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
    var _a, _b, _c, _d;
    const windowWidth = useWindowWidth();
    const isWide = windowWidth >= 640;
    const [tab, setTab] = useState("today");
    const [storageSaveFailures, setStorageSaveFailures] = useState({});
    const [undoRecord, setUndoRecord] = useState(null);
    const undoTimerRef = useRef(null);
    const [motivation, setMotivation] = useLocalState("adhd3_mot", "don’t interact with your mind, command it");
    const [focusColor, setFocusColor] = useLocalState("adhd3_focus_color", C.text);
    const [editMot, setEditMot] = useState(false);
    const [motDraft, setMotDraft] = useState("");
    const motRef = useRef(null);
    const today = new Date();
    useEffect(() => { if (motivation === "Lock in. Every task done is a win.") setMotivation("don’t interact with your mind, command it"); }, []);
    useEffect(() => {
        const handleStorageStatus = e => {
            const detail = (e && e.detail) || {};
            if (!detail.key) return;
            setStorageSaveFailures(prev => {
                const next = { ...(prev || {}) };
                if (detail.ok) delete next[detail.key];
                else next[detail.key] = true;
                return next;
            });
        };
        window.addEventListener("planner-storage-save-status", handleStorageStatus);
        return () => window.removeEventListener("planner-storage-save-status", handleStorageStatus);
    }, []);
    useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFilter, setSearchFilter] = useState("all");
    const searchRef = useRef(null);
    const [showCapture, setShowCapture] = useState(false);
    const importRef = useRef(null);
    const [reviewDraft, setReviewDraft] = useState({ done: "", move: "", tomorrow: "" });
    const [reviews, setReviews] = useLocalState("adhd3_reviews", []);
    const [lastBackupExportAt, setLastBackupExportAt] = useLocalState("adhd3_last_backup_export_at", "");
    const [meds, setMeds] = useLocalState("adhd3_meds", []);
    const [medLogs, setMedLogs] = useLocalState("adhd3_med_logs", {});
    const [showMedForm, setShowMedForm] = useState(false);
    const [editingMedId, setEditingMedId] = useState(null);
    const emptyMed = () => ({ name: "", notes: "", scheduleType: "daily-anytime", timesPerDay: 1, times: ["09:00"], weeklyDay: today.getDay(), weeklyTime: "09:00", intervalDays: 2, startDate: todayStr(), intervalTime: "09:00", color: C.green });
    const [medDraft, setMedDraft] = useState(emptyMed);
    const [rawTasks, setTasks] = useLocalState("adhd3_tasks", []);
    const tasks = rawTasks.map(t => {
        const normalized = { dueDate: "", dueTime: "", alertEnabled: false, alertDate: "", alertTime: "", recurrence: "none", subtasks: [], imageUrls: [], completedAt: "", plannerId: "", taskTag: "", ...t, imageUrls: getImages(t) };
        return { ...normalized, plannerId: normalized.plannerId || taskPlannerId(normalized), categoryId: normalizeTaskCategoryId(normalized.categoryId), taskTag: normalizeTaskTagName(normalized.taskTag || normalized.tagName || "") };
    });
    useEffect(() => { setTasks(p => compactStoredRecords(p, compactDoneTaskRecord)); }, [rawTasks]);
    const [categories, setCategories] = useLocalState("adhd3_cats", DEFAULT_CATEGORIES);
    useEffect(() => { setCategories(p => mergeTaskCategories(p)); }, []);
    const [taskTags, setTaskTags] = useLocalState("adhd3_task_tags", []);
    useEffect(() => { setTaskTags(p => normalizeTaskTags(p)); }, []);
    const [showTaskTagMgr, setShowTaskTagMgr] = useState(false);
    const [taskTagDraft, setTaskTagDraft] = useState("");
    const [taskTagError, setTaskTagError] = useState("");
    const [taskCatFilter, setTaskCatFilter] = useState("all");
    const [taskViewFilter, setTaskViewFilter] = useState("all");
    const [taskSort, setTaskSort] = useState("due");
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [showCatMgr, setShowCatMgr] = useState(false);
    const [catDraft, setCatDraft] = useState({ name: "", color: ACCENT_COLORS[4] });
    const emptyTask = () => { var _a, _b; return ({ text: "", description: "", priority: "medium", categoryId: (_b = (_a = categories[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "personal", taskTag: "", imageUrl: "", imageUrls: [], dueDate: "", dueTime: "", alertEnabled: false, alertDate: "", alertTime: "", recurrence: "none", subtasks: [] }); };
    const [taskDraft, setTaskDraft] = useState(emptyTask);
    const [taskAlertOpen, setTaskAlertOpen] = useState(false);
    const [taskSubTab, setTaskSubTab] = useState("overview");
    const [taskOverviewActionOpen, setTaskOverviewActionOpen] = useState(false);
    const [todayTasksByDate, setTodayTasksByDate] = useLocalState("adhd3_today_tasks", {});
    const [selectedTodayTaskDate, setSelectedTodayTaskDate] = useState(todayStr());
    const [showTodayTaskForm, setShowTodayTaskForm] = useState(false);
    const emptyTodayTask = () => ({ title: "", description: "" });
    const [todayTaskDraft, setTodayTaskDraft] = useState(emptyTodayTask);
    useEffect(() => { setTodayTasksByDate(p => pruneRecentDayMap(p)); }, []);
    const [eventCategories, setEventCategories] = useLocalState("adhd3_event_cats", DEFAULT_EVENT_CATEGORIES);
    useEffect(() => { setEventCategories(p => mergeEventCategories(p)); }, []);
    const [showEventCatMgr, setShowEventCatMgr] = useState(false);
    const [eventCatDraft, setEventCatDraft] = useState({ name: "", color: ACCENT_COLORS[0] });
    const [rawAppts, setAppts] = useLocalState("adhd3_appts", []);
    const appts = rawAppts.map(a => {
        const normalized = { endDate: "", endTime: "", allDay: false, alertEnabled: false, alertDate: "", alertTime: "", locationText: "", categoryId: "personal", recurrence: "none", imageUrls: [], plannerId: "", ...a, imageUrls: getImages(a) };
        const eventCat = eventCategories.find(c => c.id === normalized.categoryId) || eventCategories[0] || DEFAULT_EVENT_CATEGORIES[0];
        return { ...normalized, plannerId: normalized.plannerId || eventPlannerId(normalized), categoryId: eventCat.id, categoryText: capitalizeLabel(eventCat.name), color: eventCat.color || normalized.color || C.accent, allDay: !!normalized.allDay || (!normalized.time && !normalized.endTime) };
    });
    useEffect(() => { setAppts(p => compactStoredRecords(p, compactPastApptRecord)); }, [rawAppts]);
    const [pendingAppleChanges, setPendingAppleChanges] = useLocalState("adhd3_pending_apple_changes", {});
    const [showDoneTasks, setShowDoneTasks] = useLocalState("adhd3_show_done_tasks", false);
    const pendingAppleCount = pendingAppleChangeCount(pendingAppleChanges);
    const [activePendingChangeId, setActivePendingChangeId] = useState(null);
    const [searchReturnSnapshot, setSearchReturnSnapshot] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const swipeBackRef = useRef(null);
    const [calView, setCalView] = useState("grid");
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [selDay, setSelDay] = useState(null);
    const [weekStart, setWeekStart] = useState(getWeekStart);
    const [apptColorFilter, setApptColorFilter] = useState(new Set());
    const [showApptForm, setShowApptForm] = useState(false);
    const [selectedApptId, setSelectedApptId] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [editingApptId, setEditingApptId] = useState(null);
    const emptyAppt = () => { const cat = eventCategories[0] || DEFAULT_EVENT_CATEGORIES[0]; return ({ title: "", date: "", endDate: "", time: "", endTime: "", allDay: true, alertEnabled: false, alertDate: "", alertTime: "", locationText: "", categoryId: cat.id, categoryText: capitalizeLabel(cat.name), color: cat.color || C.accent, description: "", imageUrl: "", imageUrls: [], recurrence: "none" }); };
    const [apptDraft, setApptDraft] = useState(emptyAppt);
    // Changing the start date keeps the end date aligned until the user explicitly chooses another end date.
    const [apptEndDateManuallySet, setApptEndDateManuallySet] = useState(false);
    const [apptAlertOpen, setApptAlertOpen] = useState(false);
    const [notes, setNotes] = useLocalState("adhd3_notes", []);
    const [folders, setFolders] = useLocalState("adhd3_folders", DEFAULT_FOLDERS);
    const [selFolderId, setSelFolderId] = useState(null);
    const [noteView, setNoteView] = useState("overview");
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [activeNoteActionsId, setActiveNoteActionsId] = useState(null);
    const [noteReturnTarget, setNoteReturnTarget] = useState({ view: "overview", folderId: null });
    const [showFolderMgr, setShowFolderMgr] = useState(false);
    const [folderDraft, setFolderDraft] = useState({ name: "", color: ACCENT_COLORS[0] });
    const emptyNote = () => { var _a, _b; return ({ title: "", type: "descriptive", content: "", topics: [""], folderId: (_b = (_a = folders[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "general", imageUrl: "", imageUrls: [], embeddedImages: {} }); };
    const [noteDraft, setNoteDraft] = useState(emptyNote);
    const noteBodyCursorRef = useRef(null);
    const noteBodySelectionRef = useRef(null);
    const [activeNoteTextBlockIndex, setActiveNoteTextBlockIndex] = useState(null);
    const [noteListMenuOpen, setNoteListMenuOpen] = useState(false);
    useEffect(() => {
        setFolders(p => {
            const list = Array.isArray(p) ? p : [];
            return list.some(f => f.id === "general") ? list : [{ ...DEFAULT_FOLDERS[0] }, ...list];
        });
    }, []);
    useEffect(() => {
        if (!noteListMenuOpen) return;
        const closeMenu = e => {
            const target = e && e.target;
            if (!target || !target.closest || !target.closest('[data-note-formatting-tray="true"]')) setNoteListMenuOpen(false);
        };
        document.addEventListener("pointerdown", closeMenu);
        return () => document.removeEventListener("pointerdown", closeMenu);
    }, [noteListMenuOpen]);
    function startEditMot() { setMotDraft(motivation); setEditMot(true); setTimeout(() => { var _a; return (_a = motRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 50); }
    function offerUndo(label, restore) {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        const record = { id: Date.now() + Math.random(), label, restore };
        setUndoRecord(record);
        undoTimerRef.current = setTimeout(() => {
            setUndoRecord(current => current && current.id === record.id ? null : current);
            undoTimerRef.current = null;
        }, 7000);
    }
    function dismissUndo() {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
        setUndoRecord(null);
    }
    function undoLastAction() {
        const record = undoRecord;
        dismissUndo();
        try { if (record && typeof record.restore === "function") record.restore(); }
        catch (err) { console.warn("[Planner] Undo restore failed.", err); }
    }
    function renderStorageSaveWarning() {
        if (!Object.keys(storageSaveFailures || {}).length) return null;
        return React.createElement("div", { style: { ...cardSurface({ borderRadius: 16, padding: "12px 14px", marginBottom: 14, border: `1px solid ${C.red}55`, background: C.red + "12" }), color: C.text } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 780, marginBottom: 4, color: C.text } }, "Planner could not save the latest change locally."),
            React.createElement("div", { style: { fontSize: 12, color: C.muted, lineHeight: 1.45 } }, "Export a backup before closing the app."));
    }
    function renderUndoToast() {
        return React.createElement(UndoToast, { record: undoRecord, onUndo: undoLastAction, onDismiss: dismissUndo });
    }
    function saveMot() { if (motDraft.trim())
        setMotivation(motDraft.trim()); setEditMot(false); }
    useEffect(() => { if (searchOpen)
        setTimeout(() => { var _a; return (_a = searchRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 100); }, [searchOpen]);
    useEffect(() => {
        const h = (e) => setLightboxImage(e.detail);
        window.addEventListener("planner-lightbox", h);
        return () => window.removeEventListener("planner-lightbox", h);
    }, []);
    const searchResults = useMemo(() => {
        if (!searchQuery.trim())
            return null;
        const q = searchQuery.toLowerCase();
        return {
            tasks: tasks.filter(t => { var _a; return t.text.toLowerCase().includes(q) || displayTaskTag(t.taskTag).toLowerCase().includes(q) || normalizeTaskTagName(t.taskTag).includes(q.replace(/^#/, "")) || ((_a = t.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q)); }),
            appts: appts.filter(a => { var _a; return a.title.toLowerCase().includes(q) || ((_a = a.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q)); }),
            notes: notes.filter(n => { var _a, _b; return n.title.toLowerCase().includes(q) || ((_a = n.content) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q)) || ((_b = n.topics) === null || _b === void 0 ? void 0 : _b.some(t => t.toLowerCase().includes(q))); }),
        };
    }, [searchQuery, rawTasks, rawAppts, notes]);
    function getNavigationSnapshot() {
        return { tab, taskSubTab, selectedTodayTaskDate, calView, selectedApptId, showApptForm, editingApptId, noteView, selFolderId, selectedNoteId, editingNoteId, noteReturnTarget };
    }
    function restoreNavigationSnapshot(snapshot) {
        const snap = snapshot || { tab: "today" };
        setTab(snap.tab || "today");
        if (snap.taskSubTab) setTaskSubTab(snap.taskSubTab);
        if (snap.selectedTodayTaskDate) setSelectedTodayTaskDate(snap.selectedTodayTaskDate);
        if (snap.calView) setCalView(snap.calView);
        setSelectedApptId(snap.selectedApptId || null);
        setShowApptForm(!!snap.showApptForm);
        setEditingApptId(snap.editingApptId ?? null);
        setNoteView(snap.noteView || "overview");
        setSelFolderId(snap.selFolderId ?? null);
        setSelectedNoteId(snap.selectedNoteId || null);
        setEditingNoteId(snap.editingNoteId ?? null);
        setNoteReturnTarget(snap.noteReturnTarget || { view: "overview", folderId: null });
    }
    function openSearch() {
        if (!searchOpen) setSearchReturnSnapshot(getNavigationSnapshot());
        setSearchOpen(true);
        setSearchQuery("");
        setSearchFilter("all");
    }
    function closeSearch() {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchFilter("all");
        restoreNavigationSnapshot(searchReturnSnapshot || { tab: "today" });
        setSearchReturnSnapshot(null);
    }
    function goBackOneLevel() {
        if (searchOpen) { closeSearch(); return; }
        if (tab === "today") return;
        if (tab === "tasks") {
            if (taskSubTab && taskSubTab !== "overview") { openTaskPage("overview"); return; }
            setTab("today");
            return;
        }
        if (tab === "calendar") {
            if (showApptForm) { setShowApptForm(false); setEditingApptId(null); return; }
            if (selectedApptId) { setSelectedApptId(null); return; }
            setTab("today");
            return;
        }
        if (tab === "notes") {
            if (noteView === "view") { returnFromNotePage(); return; }
            if (noteView === "list") { openNotesOverview(); return; }
            setTab("today");
            return;
        }
        if (tab === "meds") {
            if (showMedForm) { setShowMedForm(false); setEditingMedId(null); return; }
            setTab("today");
            return;
        }
        if (tab === "sync") { setTab("today"); return; }
        setTab("today");
    }
    function isSwipeBlockedTarget(target) {
        return !!(target && target.closest && target.closest("input,textarea,select,button,a,[contenteditable='true'],[data-no-swipe-back='true'],.no-swipe-back"));
    }
    function handleSwipeBackStart(e) {
        if (!e.touches || e.touches.length !== 1) return;
        const touch = e.touches[0];
        if (touch.clientX > 24 || isSwipeBlockedTarget(e.target)) return;
        if (tab === "today" && !searchOpen) return;
        swipeBackRef.current = { startX: touch.clientX, startY: touch.clientY, lastX: touch.clientX, startTime: Date.now(), locked: false, canceled: false };
    }
    function handleSwipeBackMove(e) {
        const st = swipeBackRef.current;
        if (!st || !e.touches || e.touches.length !== 1 || st.canceled) return;
        const touch = e.touches[0];
        const dx = touch.clientX - st.startX;
        const dy = touch.clientY - st.startY;
        st.lastX = touch.clientX;
        if (dx < 0) { st.canceled = true; setSwipeOffset(0); return; }
        if (!st.locked) {
            if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { st.canceled = true; setSwipeOffset(0); return; }
            if (dx > 12 && dx > Math.abs(dy) * 1.5) st.locked = true;
        }
        if (st.locked) setSwipeOffset(Math.min(36, Math.max(0, dx) * 0.35));
    }
    function handleSwipeBackEnd() {
        const st = swipeBackRef.current;
        swipeBackRef.current = null;
        if (!st || st.canceled) { setSwipeOffset(0); return; }
        const dx = Math.max(0, (st.lastX || st.startX) - st.startX);
        const dt = Math.max(1, Date.now() - st.startTime);
        const velocity = dx / dt;
        const threshold = Math.min(100, Math.max(80, window.innerWidth * 0.28));
        setSwipeOffset(0);
        if (st.locked && (dx >= threshold || (dx >= 55 && velocity > 0.55))) goBackOneLevel();
    }
    function clearPendingAppleChange(id) {
        if (!id) return;
        clearPendingAppleChanges([id]);
        setActivePendingChangeId(null);
    }
    function clearPendingAppleChanges(ids) {
        const idSet = new Set((ids || []).filter(Boolean));
        if (!idSet.size)
            return;
        setPendingAppleChanges(p => {
            const next = { ...(p || {}) };
            idSet.forEach(id => delete next[id]);
            return next;
        });
    }
    function markPendingAppleChange(type, item, operation = "upsert", reason = "edited") {
        if (!item)
            return;
        const plannerIdValue = type === "event" ? eventPlannerId(item) : taskPlannerId(item);
        if (!plannerIdValue)
            return;
        setPendingAppleChanges(p => ({
            ...(p || {}),
            [plannerIdValue]: {
                plannerId: plannerIdValue,
                type,
                operation: operation === "delete" ? "delete" : "upsert",
                itemId: item.id,
                changedAt: new Date().toISOString(),
                reason,
                snapshot: {
                    title: item.text || item.title || "",
                    categoryId: item.categoryId || "",
                    categoryText: item.categoryText || ""
                }
            }
        }));
    }
    function payloadForPendingChange(change) {
        if (!change || !change.plannerId)
            return null;
        if (change.operation === "delete")
            return plannerDeletePayload(change);
        if (change.type === "task") {
            const task = tasks.find(t => taskPlannerId(t) === change.plannerId || t.id === change.itemId);
            return task ? plannerTaskPayload(task) : null;
        }
        if (change.type === "event") {
            const appt = appts.find(a => eventPlannerId(a) === change.plannerId || a.id === change.itemId);
            return appt ? plannerEventPayload(appt) : null;
        }
        return null;
    }
    useEffect(() => {
        const cutoff = Date.now() - (2 * 24 * 60 * 60 * 1000);
        const oldDoneTasks = tasks.filter(t => t.done && t.completedAt && !Number.isNaN(new Date(t.completedAt).getTime()) && new Date(t.completedAt).getTime() < cutoff);
        if (!oldDoneTasks.length)
            return;
        oldDoneTasks.forEach(t => markPendingAppleChange("task", t, "delete", "auto-completed-cleanup"));
        const removeIds = new Set(oldDoneTasks.map(t => t.id));
        setTasks(p => p.filter(t => !removeIds.has(t.id)));
    }, [rawTasks]);
    function openAddTask(defaultCategoryId = "") {
        const draft = emptyTask();
        if (defaultCategoryId && categories.some(c => c.id === defaultCategoryId))
            draft.categoryId = defaultCategoryId;
        setTaskDraft(draft);
        setTaskAlertOpen(false);
        setEditingTaskId(null);
        setShowTaskForm(true);
        setShowTaskTagMgr(false);
    }
    function openEditTask(t) {
        var _a, _b, _c, _d, _e;
        setTaskDraft({ text: t.text, description: t.description, priority: t.priority, categoryId: t.categoryId, taskTag: normalizeTaskTagName(t.taskTag || t.tagName || ""), imageUrl: getImages(t)[0] || "", imageUrls: getImages(t), dueDate: (_a = t.dueDate) !== null && _a !== void 0 ? _a : "", dueTime: (_d = t.dueTime) !== null && _d !== void 0 ? _d : "", alertEnabled: !!t.alertEnabled, alertDate: t.alertDate || "", alertTime: (_e = t.alertTime) !== null && _e !== void 0 ? _e : "", recurrence: (_b = t.recurrence) !== null && _b !== void 0 ? _b : "none", subtasks: (_c = t.subtasks) !== null && _c !== void 0 ? _c : [] });
        setTaskAlertOpen(!!(t.alertEnabled || t.alertDate || t.alertTime));
        setEditingTaskId(t.id);
        setShowTaskForm(true);
    }
    function saveTask() {
        if (!taskDraft.text.trim())
            return null;
        const normalizedTaskDraft = { ...taskDraft, taskTag: normalizeTaskTagName(taskDraft.taskTag), alertEnabled: !!taskDraft.alertEnabled };
        if (!normalizedTaskDraft.alertEnabled) {
            normalizedTaskDraft.alertDate = "";
            normalizedTaskDraft.alertTime = "";
        }
        const existing = editingTaskId !== null ? tasks.find(t => t.id === editingTaskId) : null;
        const id = editingTaskId !== null ? editingTaskId : Date.now();
        const saved = existing
            ? { ...existing, ...normalizedTaskDraft, id, plannerId: taskPlannerId(existing) }
            : { id, plannerId: `planner-task-${id}`, done: false, completedAt: "", ...normalizedTaskDraft };
        if (editingTaskId !== null)
            setTasks((p) => p.map(t => t.id === editingTaskId ? saved : t));
        else
            setTasks((p) => [...p, saved]);
        markPendingAppleChange("task", saved, "upsert", editingTaskId !== null ? "edited" : "created");
        setShowTaskForm(false);
        setEditingTaskId(null);
        return saved;
    }
    function saveTaskAndExport() {
        const saved = saveTask();
        if (saved)
            exportTaskToApple(saved);
    }
    function toggleTask(id) {
        const current = tasks.find(t => t.id === id);
        if (!current)
            return;
        const recurrence = current.recurrence || "none";
        let updated;
        let reason = "edited";
        if (!current.done && recurrence !== "none" && current.dueDate) {
            updated = { ...current, dueDate: nextDueDate(current.dueDate, recurrence), done: false, completedAt: "" };
        }
        else {
            const nextDone = !current.done;
            updated = { ...current, done: nextDone, completedAt: nextDone ? new Date().toISOString() : "" };
            reason = nextDone ? "completed" : "uncompleted";
        }
        setTasks((p) => p.map(t => t.id === id ? updated : t));
        markPendingAppleChange("task", updated, "upsert", reason);
    }
    function deleteTask(id) {
        const existing = tasks.find(t => t.id === id);
        if (!existing) return;
        const storedRecord = rawTasks.find(t => t.id === id) || existing;
        const snapshot = clonePlannerSnapshot(storedRecord);
        const index = rawTasks.findIndex(t => t.id === id);
        const plannerId = taskPlannerId(existing);
        const priorPending = clonePlannerSnapshot((pendingAppleChanges || {})[plannerId]);
        markPendingAppleChange("task", existing, "delete", "deleted");
        setTasks((p) => p.filter(t => t.id !== id));
        offerUndo("Task deleted", () => {
            setTasks(p => {
                if ((p || []).some(t => t.id === snapshot.id)) return p;
                const next = [...(p || [])];
                next.splice(Math.max(0, Math.min(index < 0 ? next.length : index, next.length)), 0, snapshot);
                return next;
            });
            setPendingAppleChanges(p => {
                const next = { ...(p || {}) };
                if (priorPending) next[plannerId] = priorPending;
                else delete next[plannerId];
                return next;
            });
        });
    }
    function getTodayList(dateStr = selectedTodayTaskDate) {
        return [...((todayTasksByDate && todayTasksByDate[dateStr]) || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    function addTodayTask(title, description = "", dateStr = selectedTodayTaskDate, sourceTaskId = null) {
        const cleanTitle = String(title || "").trim();
        if (!cleanTitle)
            return;
        setTodayTasksByDate(p => {
            const current = [...((p && p[dateStr]) || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const nextTask = { id: Date.now() + Math.floor(Math.random() * 1000), title: cleanTitle, description: description || "", done: false, order: current.length, createdAt: Date.now(), sourceTaskId };
            return pruneRecentDayMap({ ...(p || {}), [dateStr]: [...current, nextTask] });
        });
    }
    function saveTodayTask() {
        addTodayTask(todayTaskDraft.title, todayTaskDraft.description, selectedTodayTaskDate);
        setTodayTaskDraft(emptyTodayTask());
        setShowTodayTaskForm(false);
    }
    function toggleTodayTask(id, dateStr = selectedTodayTaskDate) {
        const todayItem = getTodayList(dateStr).find(t => t.id === id);
        const linkedSourceTaskId = todayItem && todayItem.sourceTaskId ? todayItem.sourceTaskId : null;
        const linkedDoneValue = todayItem ? !todayItem.done : null;
        setTodayTasksByDate(p => {
            const current = ((p && p[dateStr]) || []).map(t => t.id === id ? { ...t, done: !t.done } : t);
            return { ...(p || {}), [dateStr]: current };
        });
        if (linkedSourceTaskId !== null) {
            const linkedTask = tasks.find(t => t.id === linkedSourceTaskId);
            if (linkedTask) {
                const updated = linkedDoneValue ? { ...linkedTask, done: true, completedAt: new Date().toISOString() } : { ...linkedTask, done: false, completedAt: "" };
                setTasks(p => p.map(t => t.id === linkedSourceTaskId ? updated : t));
                markPendingAppleChange("task", updated, "upsert", linkedDoneValue ? "completed" : "uncompleted");
            }
        }
    }
    function deleteTodayTask(id, dateStr = selectedTodayTaskDate) {
        setTodayTasksByDate(p => {
            const current = ((p && p[dateStr]) || []).filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
            return { ...(p || {}), [dateStr]: current };
        });
    }
    function moveTodayTask(id, dir, dateStr = selectedTodayTaskDate) {
        setTodayTasksByDate(p => {
            const current = [...((p && p[dateStr]) || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const idx = current.findIndex(t => t.id === id);
            const nextIdx = idx + dir;
            if (idx < 0 || nextIdx < 0 || nextIdx >= current.length)
                return p;
            const copy = [...current];
            const [item] = copy.splice(idx, 1);
            copy.splice(nextIdx, 0, item);
            return { ...(p || {}), [dateStr]: copy.map((t, i) => ({ ...t, order: i })) };
        });
    }
    function copyTaskToToday(task) {
        addTodayTask(task.text || task.title || "Untitled task", task.description || "", todayStr(), task.id);
        openTaskPage("today");
        setSelectedTodayTaskDate(todayStr());
    }
    function copyUnfinishedToToday(dateStr = selectedTodayTaskDate) {
        const unfinished = getTodayList(dateStr).filter(t => !t.done);
        unfinished.forEach(t => addTodayTask(t.title, t.description || "", todayStr(), t.sourceTaskId || null));
        setSelectedTodayTaskDate(todayStr());
        setShowTodayTaskForm(false);
    }
    function toggleSubtask(taskId, subId) {
        const current = tasks.find(t => t.id === taskId);
        if (!current)
            return;
        const updated = { ...current, subtasks: (current.subtasks || []).map((s) => s.id === subId ? { ...s, done: !s.done } : s) };
        setTasks((p) => p.map(t => t.id === taskId ? updated : t));
        markPendingAppleChange("task", updated, "upsert", "edited");
    }
    function addSubtask(taskId, text) {
        const current = tasks.find(t => t.id === taskId);
        if (!current)
            return;
        const updated = { ...current, subtasks: [...(current.subtasks || []), { id: Date.now(), text, done: false }] };
        setTasks((p) => p.map(t => t.id === taskId ? updated : t));
        markPendingAppleChange("task", updated, "upsert", "edited");
    }
    function addSubtaskToDraft() { setTaskDraft(d => ({ ...d, subtasks: [...d.subtasks, { id: Date.now(), text: "", done: false }] })); }
    function removeSubtaskFromDraft(id) { setTaskDraft(d => ({ ...d, subtasks: d.subtasks.filter(s => s.id !== id) })); }
    function updateSubtaskInDraft(id, text) { setTaskDraft(d => ({ ...d, subtasks: d.subtasks.map(s => s.id === id ? { ...s, text } : s) })); }
    function addCategory() {
        if (!catDraft.name.trim())
            return;
        setCategories(p => [...p, { id: Date.now().toString(), name: catDraft.name.trim(), color: catDraft.color }]);
        setCatDraft({ name: "", color: ACCENT_COLORS[4] });
    }
    function deleteCategory(id) {
        if (["homework", "tests", "personal", "work"].includes(id))
            return;
        setCategories(p => p.filter(c => c.id !== id));
        setTasks((p) => p.map(t => t.categoryId === id ? { ...t, categoryId: "personal" } : t));
    }
    function addTaskTag(autoSelect = false) {
        const raw = String(taskTagDraft || "").trim();
        if (!raw) {
            setTaskTagError("Enter a tag name.");
            return;
        }
        if (/\s/.test(raw)) {
            setTaskTagError("Tags cannot contain spaces.");
            return;
        }
        const name = normalizeTaskTagName(raw);
        if (!name) {
            setTaskTagError("Use letters, numbers, dashes, or underscores.");
            return;
        }
        if (taskTags.some(t => normalizeTaskTagName(t.name) === name)) {
            setTaskTagError(`${displayTaskTag(name)} already exists.`);
            if (autoSelect)
                setTaskDraft(d => ({ ...d, taskTag: name }));
            return;
        }
        setTaskTags(p => normalizeTaskTags([...p, { id: `tag-${name}`, name, createdAt: new Date().toISOString() }]));
        setTaskTagDraft("");
        setTaskTagError("");
        if (autoSelect)
            setTaskDraft(d => ({ ...d, taskTag: name }));
    }
    function deleteTaskTag(tag) {
        const name = normalizeTaskTagName(tag);
        if (!name)
            return;
        const assigned = tasks.filter(t => normalizeTaskTagName(t.taskTag) === name);
        if (assigned.length && !window.confirm(`Delete ${displayTaskTag(name)} and remove it from ${assigned.length} assigned task${assigned.length === 1 ? "" : "s"}?`))
            return;
        setTaskTags(p => normalizeTaskTags(p).filter(t => t.name !== name));
        if (normalizeTaskTagName(taskDraft.taskTag) === name)
            setTaskDraft(d => ({ ...d, taskTag: "" }));
        if (assigned.length) {
            setTasks(p => p.map(t => normalizeTaskTagName(t.taskTag) === name ? { ...t, taskTag: "" } : t));
            assigned.forEach(t => markPendingAppleChange("task", { ...t, taskTag: "" }, "upsert", "tag-deleted"));
        }
    }
    function renderTaskTagManager(compact = false) {
        const cleanTags = normalizeTaskTags(taskTags);
        return React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 14, marginBottom: compact ? 12 : 14 }) },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 } },
                React.createElement("div", { style: { fontSize: 12, fontWeight: 800, color: C.text } }, "Task Tags"),
                React.createElement("button", { onClick: () => setShowTaskTagMgr(false), style: { background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, fontWeight: 700 } }, "×")),
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
                React.createElement("input", { placeholder: "New tag", value: taskTagDraft, onChange: e => { setTaskTagDraft(e.target.value.replace(/\s+/g, "")); setTaskTagError(""); }, onKeyDown: e => { if (e.key === "Enter") addTaskTag(!!showTaskForm); }, style: { ...inp, flex: 1, padding: "8px 10px", fontSize: 12 } }),
                React.createElement("button", { onClick: () => addTaskTag(!!showTaskForm), style: { width: 38, height: 38, borderRadius: 10, border: "none", background: C.accent, color: C.text, cursor: "pointer", fontWeight: 800, fontSize: 18, fontFamily: "inherit" } }, "+")),
            taskTagError && React.createElement("div", { style: { color: C.red, fontSize: 11, marginBottom: 8 } }, taskTagError),
            cleanTags.length ? React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                cleanTags.map(tag => React.createElement("div", { key: tag.name, style: { display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 999, background: UI.controlBg, border: `1px solid ${C.border}` } },
                    React.createElement("span", { style: { fontSize: 11, color: C.muted, fontWeight: 800 } }, displayTaskTag(tag.name)),
                    React.createElement("button", { onClick: () => deleteTaskTag(tag.name), title: `Delete ${displayTaskTag(tag.name)}`, style: { background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 13, fontWeight: 900, padding: 0, lineHeight: 1 } }, "×"))))
                : React.createElement("div", { style: { color: C.dim, fontSize: 11, padding: "4px 0" } }, "No tags yet."));
    }
    function addEventCategory() {
        if (!eventCatDraft.name.trim())
            return;
        const id = eventCatDraft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Date.now().toString();
        setEventCategories(p => mergeEventCategories([...p, { id, name: eventCatDraft.name.trim(), color: eventCatDraft.color }]));
        setEventCatDraft({ name: "", color: ACCENT_COLORS[0] });
    }
    function deleteEventCategory(id) {
        setEventCategories(p => p.filter(c => c.id !== id));
        const fallback = eventCategories.find(c => c.id !== id) || DEFAULT_EVENT_CATEGORIES[0];
        setAppts(p => p.map(a => a.categoryId === id ? { ...a, categoryId: fallback.id, categoryText: capitalizeLabel(fallback.name), color: fallback.color } : a));
    }
    function quickAddTask(text, categoryId) {
        const id = Date.now();
        const saved = { id, plannerId: `planner-task-${id}`, text, description: "", priority: "medium", done: false, completedAt: "", categoryId, imageUrl: "", imageUrls: [], dueDate: "", dueTime: "", alertEnabled: false, alertDate: "", alertTime: "", recurrence: "none", subtasks: [] };
        setTasks((p) => [...p, saved]);
        markPendingAppleChange("task", saved, "upsert", "created");
    }
    function openAddAppt() {
        const draft = emptyAppt();
        let selected = null;
        if (selWeekDay)
            selected = selWeekDay;
        else if (selDay)
            selected = new Date(calYear, calMonth, selDay);
        if (selected) {
            draft.date = dateToLocalStr(selected);
            draft.endDate = dateToLocalStr(selected);
        }
        setApptDraft(draft);
        setApptEndDateManuallySet(false);
        setApptAlertOpen(false);
        setSelectedApptId(null);
        setEditingApptId(null);
        setShowApptForm(true);
    }
    function openEditAppt(a) {
        var _a, _b, _c, _d, _e;
        setApptDraft({ title: a.title, date: a.date, endDate: (_d = a.endDate) !== null && _d !== void 0 ? _d : (a.date || ""), time: a.time, endTime: a.endTime || "", allDay: !!a.allDay || (!a.time && !a.endTime), alertEnabled: !!a.alertEnabled, alertDate: a.alertDate || "", alertTime: (_c = a.alertTime) !== null && _c !== void 0 ? _c : "", locationText: a.locationText || "", categoryId: a.categoryId || "personal", categoryText: a.categoryText || "", color: a.color, description: a.description, imageUrl: getImages(a)[0] || "", imageUrls: getImages(a), recurrence: (_a = a.recurrence) !== null && _a !== void 0 ? _a : "none" });
        setApptAlertOpen(!!(a.alertEnabled || a.alertDate || a.alertTime));
        setApptEndDateManuallySet(true);
        setSelectedApptId(null);
        setEditingApptId(a.id);
        setShowApptForm(true);
    }
    function openViewAppt(a) {
        setSelectedApptId(a.id);
        setShowApptForm(false);
    }
    function saveAppt() {
        if (!apptDraft.title.trim() || !apptDraft.date)
            return null;
        const eventCat = eventCategories.find(c => c.id === apptDraft.categoryId) || eventCategories[0] || DEFAULT_EVENT_CATEGORIES[0];
        const normalizedApptDraft = { ...apptDraft, endDate: apptDraft.endDate || apptDraft.date, categoryId: eventCat.id, categoryText: capitalizeLabel(eventCat.name), color: eventCat.color || apptDraft.color || C.accent, alertEnabled: !!apptDraft.alertEnabled, allDay: !!apptDraft.allDay || (!apptDraft.time && !apptDraft.endTime) };
        if (!normalizedApptDraft.alertEnabled) {
            normalizedApptDraft.alertDate = "";
            normalizedApptDraft.alertTime = "";
        }
        if (normalizedApptDraft.allDay) {
            normalizedApptDraft.time = "";
            normalizedApptDraft.endTime = "";
        }
        const existing = editingApptId !== null ? appts.find(a => a.id === editingApptId) : null;
        const id = editingApptId !== null ? editingApptId : Date.now();
        const saved = existing ? { ...existing, ...normalizedApptDraft, id, plannerId: eventPlannerId(existing) } : { id, plannerId: `planner-event-${id}`, ...normalizedApptDraft };
        if (editingApptId !== null)
            setAppts((p) => p.map(a => a.id === editingApptId ? saved : a));
        else
            setAppts((p) => [...p, saved]);
        markPendingAppleChange("event", saved, "upsert", editingApptId !== null ? "edited" : "created");
        setShowApptForm(false);
        setSelectedApptId(null);
        setEditingApptId(null);
        return saved;
    }
    function saveApptAndExport() {
        const saved = saveAppt();
        if (saved)
            exportEventToApple(saved);
    }
    function deleteAppt(id) {
        const existing = appts.find(a => a.id === id);
        if (!existing) return;
        const storedRecord = rawAppts.find(a => a.id === id) || existing;
        const snapshot = clonePlannerSnapshot(storedRecord);
        const index = rawAppts.findIndex(a => a.id === id);
        const plannerId = eventPlannerId(existing);
        const priorPending = clonePlannerSnapshot((pendingAppleChanges || {})[plannerId]);
        markPendingAppleChange("event", existing, "delete", "deleted");
        setAppts((p) => p.filter(a => a.id !== id));
        offerUndo("Event deleted", () => {
            setAppts(p => {
                if ((p || []).some(a => a.id === snapshot.id)) return p;
                const next = [...(p || [])];
                next.splice(Math.max(0, Math.min(index < 0 ? next.length : index, next.length)), 0, snapshot);
                return next;
            });
            setPendingAppleChanges(p => {
                const next = { ...(p || {}) };
                if (priorPending) next[plannerId] = priorPending;
                else delete next[plannerId];
                return next;
            });
        });
    }
    function toggleColorFilter(c) { setApptColorFilter(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; }); }
    const filteredAppts = apptColorFilter.size === 0 ? appts : appts.filter(a => apptColorFilter.has(a.color));

    function plannerTaskPayload(t) {
        const cat = categories.find(c => c.id === t.categoryId);
        const dueDate = t.dueDate || "";
        const dueTime = t.dueTime || "";
        const alertEnabled = !!t.alertEnabled;
        const alertDate = alertEnabled ? (t.alertDate || "") : "";
        const alertTime = alertEnabled ? (t.alertTime || "") : "";
        const dueDateTime = dueDate && dueTime ? `${dueDate}T${dueTime}:00` : "";
        const dueDateText = dueDate ? (dueTime ? shortcutFriendlyDateTime(dueDate, dueTime) : shortcutFriendlyDate(dueDate)) : "";
        const alertDateText = alertDate && alertTime ? shortcutFriendlyDateTime(alertDate, alertTime) : "";
        const priorityLabel = t.priority ? String(t.priority).charAt(0).toUpperCase() + String(t.priority).slice(1).toLowerCase() : "Medium";
        const notes = t.description || "";
        const taskTag = displayTaskTag(t.taskTag || t.tagName || "");
        const plannerIdValue = taskPlannerId(t);
        return {
            type: "task",
            operation: "upsert",
            plannerId: plannerIdValue,
            title: t.text || "Untitled task",
            notes,
            taskTag,
            taskDone: t.done ? "yes" : "no",
            appleNotes: appleNotesWithPlannerId(notes, plannerIdValue),
            categoryId: normalizeTaskCategoryId(t.categoryId) || "",
            categoryText: cat && cat.name ? String(cat.name).charAt(0).toUpperCase() + String(cat.name).slice(1) : "",
            dueDate,
            dueTime,
            dueDateTime,
            dueDateText,
            alertEnabled: alertEnabled ? "yes" : "no",
            alertDate,
            alertTime,
            alertDateText,
            priority: priorityLabel,
            completed: !!t.done
        };
    }
    function plannerEventPayload(a) {
        const startDate = a.date || "";
        const endDate = a.endDate || a.date || "";
        const allDay = !!a.allDay || (!a.time && !a.endTime);
        const startTime = allDay ? "" : (a.time || "");
        const rawEndTime = allDay ? "" : (a.endTime || "");
        const fallbackEnd = (!rawEndTime && startTime) ? (() => {
            const startMinutes = timeToMinutes(startTime);
            if (startMinutes === null)
                return "";
            const total = (startMinutes + 60) % (24 * 60);
            const h = Math.floor(total / 60);
            const m = total % 60;
            return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
        })() : "";
        const cleanEndTime = rawEndTime || fallbackEnd;
        const startDateTime = startDate && startTime ? `${startDate}T${startTime}:00` : "";
        const endDateTime = endDate && cleanEndTime ? `${endDate}T${cleanEndTime}:00` : "";
        const startDateText = startDate ? (startTime ? shortcutFriendlyDateTime(startDate, startTime) : shortcutFriendlyDate(startDate)) : "";
        const endDateText = endDate ? (cleanEndTime ? shortcutFriendlyDateTime(endDate, cleanEndTime) : (endDate !== startDate ? shortcutFriendlyDate(endDate) : "")) : "";
        const alertEnabled = !!a.alertEnabled;
        const alertDate = alertEnabled ? (a.alertDate || "") : "";
        const alertTime = alertEnabled ? (a.alertTime || "") : "";
        const alertDateText = alertDate && alertTime ? shortcutFriendlyDateTime(alertDate, alertTime) : "";
        const notes = a.description || "";
        const eventCat = eventCategories.find(c => c.id === a.categoryId);
        const plannerIdValue = eventPlannerId(a);
        return {
            type: "event",
            operation: "upsert",
            plannerId: plannerIdValue,
            title: a.title || "Untitled event",
            notes,
            appleNotes: appleNotesWithPlannerId(notes, plannerIdValue),
            locationText: a.locationText || "",
            categoryId: a.categoryId || "",
            categoryText: eventCat && eventCat.name ? capitalizeLabel(eventCat.name) : (a.categoryText || ""),
            date: startDate,
            endDate,
            allDay: allDay ? "yes" : "",
            startTime,
            endTime: cleanEndTime,
            startDateTime,
            endDateTime,
            startDateText,
            endDateText,
            alertEnabled: alertEnabled ? "yes" : "no",
            alertDate,
            alertTime,
            alertDateText,
            recurrence: a.recurrence || "none"
        };
    }
    let plannerShortcutLaunchLock = 0;
    function openShortcutUrl(url) {
        window.location.href = url;
    }
    async function runPlannerShortcut(items) {
        const now = Date.now();
        if (now - plannerShortcutLaunchLock < 2500) {
            console.warn("[Planner] Ignored duplicate Shortcut launch.");
            return false;
        }
        plannerShortcutLaunchLock = now;
        const cleanItems = (Array.isArray(items) ? items : [items]).filter(Boolean);
        if (!cleanItems.length) {
            alert("Nothing to export.");
            plannerShortcutLaunchLock = 0;
            return false;
        }
        let payload = "";
        try {
            payload = JSON.stringify({
                source: "ADHD Planner",
                exportVersion: 2,
                exportedAt: new Date().toISOString(),
                items: cleanItems
            });
        }
        catch (err) {
            console.error("[Planner] Export JSON failed.", err);
            alert("Export failed while creating JSON.");
            plannerShortcutLaunchLock = 0;
            return false;
        }
        const name = encodeURIComponent("Planner Import");
        const clipboardUrl = "shortcuts://run-shortcut?name=" + name + "&input=clipboard";
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(payload);
                openShortcutUrl(clipboardUrl);
                return true;
            }
        }
        catch (err) {
            console.warn("[Planner] Clipboard export failed, falling back to URL text.", err);
        }
        if (payload.length > 6500) {
            alert("This export is too large for URL export. Try exporting fewer items, or allow clipboard access and try again.");
            plannerShortcutLaunchLock = 0;
            return false;
        }
        openShortcutUrl("shortcuts://run-shortcut?name=" + name + "&input=text&text=" + encodeURIComponent(payload));
        return true;
    }
    function pendingDeletePayloads() {
        return Object.values(pendingAppleChanges || {}).filter(ch => ch && ch.operation === "delete").map(plannerDeletePayload).filter(Boolean);
    }
    function exportTaskToApple(t) {
        runPlannerShortcut(plannerTaskPayload(t));
        clearPendingAppleChanges([taskPlannerId(t)]);
    }
    function exportEventToApple(a) {
        runPlannerShortcut(plannerEventPayload(a));
        clearPendingAppleChanges([eventPlannerId(a)]);
    }
    function exportPendingAppleChanges() {
        const changes = Object.values(pendingAppleChanges || {});
        const payloads = changes.map(payloadForPendingChange).filter(Boolean);
        runPlannerShortcut(payloads);
        clearPendingAppleChanges(changes.map(ch => ch.plannerId));
    }
    function bulkExportTasksToApple() {
        const taskItems = tasks.map(plannerTaskPayload);
        const deleteItems = pendingDeletePayloads().filter(p => p.type === "task");
        runPlannerShortcut([...taskItems, ...deleteItems]);
        setPendingAppleChanges(p => {
            const next = { ...(p || {}) };
            [...taskItems, ...deleteItems].forEach(item => delete next[item.plannerId]);
            return next;
        });
    }
    function bulkExportEventsToApple() {
        const eventItems = appts.filter(a => a.date && (a.date >= todayStr() || ((a.recurrence || "none") !== "none"))).map(plannerEventPayload);
        const deleteItems = pendingDeletePayloads().filter(p => p.type === "event");
        runPlannerShortcut([...eventItems, ...deleteItems]);
        setPendingAppleChanges(p => {
            const next = { ...(p || {}) };
            [...eventItems, ...deleteItems].forEach(item => delete next[item.plannerId]);
            return next;
        });
    }
    function bulkExportPlannerToApple() {
        const taskItems = tasks.map(plannerTaskPayload);
        const upcomingEvents = appts.filter(a => a.date && (a.date >= todayStr() || ((a.recurrence || "none") !== "none"))).map(plannerEventPayload);
        const deleteItems = pendingDeletePayloads();
        runPlannerShortcut([...taskItems, ...upcomingEvents, ...deleteItems]);
        setPendingAppleChanges({});
    }

    function generalFolderId() {
        return folders.some(f => f.id === "general") ? "general" : ((folders[0] && folders[0].id) || "general");
    }
    function normalizeNoteTitle(title) {
        return String(title || "").trim() || "Untitled";
    }
    function noteSortTime(n) {
        return Number(n && (n.updatedAt || n.createdAt || 0)) || 0;
    }
    function noteToDraft(n) {
        const imgs = getImages(n || {});
        return {
            title: (n && n.title) || "",
            type: (n && n.type) || "descriptive",
            content: (n && n.content) || "",
            topics: Array.isArray(n && n.topics) && n.topics.length ? n.topics : [""],
            folderId: (n && n.folderId) || generalFolderId(),
            imageUrl: imgs[0] || "",
            imageUrls: imgs,
            embeddedImages: getNoteEmbeddedImages(n || {}),
            updatedAt: (n && n.updatedAt) || (n && n.createdAt) || Date.now()
        };
    }
    function openNotesOverview() {
        setNoteView("overview");
        setActiveNoteTextBlockIndex(null);
        setSelFolderId(null);
        setSelectedNoteId(null);
        setEditingNoteId(null);
        setActiveNoteActionsId(null);
        setActiveNoteTextBlockIndex(null);
        setNoteListMenuOpen(false);
    }
    function openNotesList(folderId) {
        setSelFolderId(folderId || null);
        setNoteView("list");
        setActiveNoteTextBlockIndex(null);
        setSelectedNoteId(null);
        setEditingNoteId(null);
        setActiveNoteActionsId(null);
        setShowFolderMgr(false);
        setNoteListMenuOpen(false);
    }
    function openAddNote(folderId) {
        const now = Date.now();
        const targetFolder = folderId || (noteView === "list" && selFolderId ? selFolderId : generalFolderId());
        const rec = { id: now, createdAt: now, updatedAt: now, pinned: false, title: "", type: "descriptive", content: "", topics: [], folderId: targetFolder, imageUrl: "", imageUrls: [], embeddedImages: {} };
        setNotes(p => [rec, ...p]);
        setNoteDraft(noteToDraft(rec));
        setActiveNoteTextBlockIndex(0);
        setEditingNoteId(rec.id);
        setSelectedNoteId(rec.id);
        setNoteReturnTarget({ view: "list", folderId: noteView === "list" ? selFolderId : targetFolder });
        setNoteView("view");
        setNoteListMenuOpen(false);
    }
    function openEditNote(n) {
        openViewNote(n);
    }
    function openViewNote(n, returnTarget) {
        if (!n) return;
        setNoteDraft(noteToDraft(n));
        setActiveNoteTextBlockIndex(null);
        setEditingNoteId(n.id);
        setSelectedNoteId(n.id);
        setNoteReturnTarget(returnTarget || { view: noteView === "list" ? "list" : "overview", folderId: selFolderId });
        setActiveNoteActionsId(null);
        setNoteView("view");
        setNoteListMenuOpen(false);
    }
    function returnFromNotePage() {
        const target = noteReturnTarget || { view: "overview", folderId: null };
        setSelectedNoteId(null);
        setEditingNoteId(null);
        setActiveNoteActionsId(null);
        setActiveNoteTextBlockIndex(null);
        setNoteListMenuOpen(false);
        if (target.view === "list") {
            setSelFolderId(target.folderId || null);
            setNoteView("list");
        }
        else {
            openNotesOverview();
        }
    }
    function updateOpenNote(patch) {
        const id = selectedNoteId || editingNoteId;
        if (!id) return;
        const updatedAt = Date.now();
        setNoteDraft(d => ({ ...d, ...patch, updatedAt }));
        setNotes(p => p.map(n => n.id === id ? { ...n, ...patch, updatedAt } : n));
    }
    function rememberNoteBodyCursor(blockStart, e, blockIndex = null, blockEnd = null) {
        const id = selectedNoteId || editingNoteId;
        const el = e && e.target;
        if (!id || !el || typeof el.selectionStart !== "number") return;
        const start = blockStart + el.selectionStart;
        const end = blockStart + (typeof el.selectionEnd === "number" ? el.selectionEnd : el.selectionStart);
        noteBodyCursorRef.current = { noteId: id, pos: start };
        noteBodySelectionRef.current = { noteId: id, start, end, blockStart, blockEnd: Number.isFinite(blockEnd) ? blockEnd : blockStart + String(el.value || "").length, blockIndex };
    }
    function replaceNoteContentRange(start, end, value) {
        const current = String(noteDraft.content || "");
        const next = current.slice(0, start) + value + current.slice(end);
        const id = selectedNoteId || editingNoteId;
        const remembered = noteBodySelectionRef.current;
        noteBodyCursorRef.current = remembered && remembered.noteId === id && remembered.blockStart === start ? { noteId: id, pos: remembered.start } : { noteId: id, pos: start + String(value || "").length };
        updateOpenNote({ content: next });
    }
    function restoreNoteTextSelection(blockIndex, absoluteStart, absoluteEnd = absoluteStart) {
        const id = selectedNoteId || editingNoteId;
        if (!id) return;
        noteBodyCursorRef.current = { noteId: id, pos: absoluteStart };
        noteBodySelectionRef.current = { noteId: id, start: absoluteStart, end: absoluteEnd, blockIndex };
        setActiveNoteTextBlockIndex(blockIndex);
        requestAnimationFrame(() => {
            const el = document.querySelector(`textarea[data-note-body-block-index="${blockIndex}"]`);
            if (!el) return;
            const blockStart = Number(el.getAttribute("data-note-block-start")) || 0;
            const value = String(el.value || "");
            const start = Math.max(0, Math.min(value.length, absoluteStart - blockStart));
            const end = Math.max(start, Math.min(value.length, absoluteEnd - blockStart));
            el.focus();
            el.setSelectionRange(start, end);
        });
    }
    function updateNoteTextBlock(block, blockIndex, nextText, localStart, localEnd = localStart) {
        const current = String(noteDraft.content || "");
        const nextContent = current.slice(0, block.start) + nextText + current.slice(block.end);
        updateOpenNote({ content: nextContent });
        restoreNoteTextSelection(blockIndex, block.start + localStart, block.start + localEnd);
    }
    function getActiveNoteTextSelection() {
        const id = selectedNoteId || editingNoteId;
        if (!id) return null;
        const current = String(noteDraft.content || "");
        const remembered = noteBodySelectionRef.current;
        let start = remembered && remembered.noteId === id && Number.isFinite(remembered.start) ? remembered.start : (noteBodyCursorRef.current && noteBodyCursorRef.current.noteId === id ? noteBodyCursorRef.current.pos : current.length);
        let end = remembered && remembered.noteId === id && Number.isFinite(remembered.end) ? remembered.end : start;
        start = Math.max(0, Math.min(current.length, start));
        end = Math.max(start, Math.min(current.length, end));
        const parsed = parseNoteContentBlocks(current).filter((block, idx, all) => shouldRenderNoteTextBlock(block, all, idx));
        let blockIndex = remembered && remembered.noteId === id && Number.isFinite(remembered.blockIndex) ? remembered.blockIndex : -1;
        let block = blockIndex >= 0 ? parsed[blockIndex] : null;
        if (!block || block.type !== "text" || start < block.start || start > block.end) {
            blockIndex = parsed.findIndex(b => b.type === "text" && start >= b.start && start <= b.end);
            block = blockIndex >= 0 ? parsed[blockIndex] : null;
        }
        if (!block || block.type !== "text") {
            blockIndex = parsed.map((b, i) => ({ b, i })).filter(x => x.b.type === "text").map(x => x.i).pop();
            block = Number.isFinite(blockIndex) ? parsed[blockIndex] : null;
            if (!block) return null;
            start = end = block.end;
        }
        return { id, start, end, block, blockIndex };
    }
    function applyNoteListStyle(style) {
        setNoteListMenuOpen(false);
        if ((noteDraft.type || "descriptive") === "topic") return;
        const selection = getActiveNoteTextSelection();
        if (!selection) return;
        const { block, blockIndex } = selection;
        const localStart = Math.max(0, selection.start - block.start);
        const localEnd = Math.max(localStart, selection.end - block.start);
        const text = String(block.text || "");
        const bounds = noteLineBounds(text, localStart);
        const line = text.slice(bounds.start, bounds.end);
        if (/\[\[image:[^\]]+\]\]/.test(line)) return;
        const parsed = parsePlainTextListLine(line);
        const leading = (line.match(/^\s*/) || [""])[0];
        let nextLine = line;
        let nextStart = localStart;
        let nextEnd = localEnd;
        if (parsed && parsed.kind === style) {
            restoreNoteTextSelection(blockIndex, selection.start, selection.end);
            return;
        }
        const marker = noteListMarker(style);
        if (parsed) {
            const newPrefix = parsed.indent + marker;
            nextLine = newPrefix + parsed.text;
            const delta = newPrefix.length - parsed.prefixLength;
            const adjust = pos => pos <= parsed.prefixLength ? newPrefix.length : pos + delta;
            nextStart = bounds.start + adjust(localStart - bounds.start);
            nextEnd = bounds.start + adjust(localEnd - bounds.start);
        }
        else if (!line.trim()) {
            const newPrefix = leading + marker;
            nextLine = newPrefix;
            nextStart = nextEnd = bounds.start + newPrefix.length;
        }
        else {
            const newPrefix = leading + marker;
            nextLine = newPrefix + line.slice(leading.length);
            const adjust = pos => pos <= leading.length ? newPrefix.length : pos + marker.length;
            nextStart = bounds.start + adjust(localStart - bounds.start);
            nextEnd = bounds.start + adjust(localEnd - bounds.start);
        }
        const nextText = text.slice(0, bounds.start) + nextLine + text.slice(bounds.end);
        updateNoteTextBlock(block, blockIndex, nextText, nextStart, nextEnd);
    }
    function handleDescriptiveNoteListEnter(block, blockIndex, e) {
        if (!e || e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || (e.nativeEvent && e.nativeEvent.isComposing)) return;
        const el = e.target;
        if (!el || el.selectionStart !== el.selectionEnd) return;
        const text = String(block.text || "");
        const caret = el.selectionStart;
        const bounds = noteLineBounds(text, caret);
        const line = text.slice(bounds.start, bounds.end);
        const parsed = parsePlainTextListLine(line);
        if (!parsed) return;
        e.preventDefault();
        let nextText, nextCaret;
        if (!String(parsed.text || "").trim()) {
            nextText = text.slice(0, bounds.start) + parsed.indent + text.slice(bounds.end);
            nextCaret = bounds.start + parsed.indent.length;
        }
        else {
            const marker = noteListMarker(parsed.kind, parsed.kind === "number" ? parsed.number + 1 : 1);
            const insertion = "\n" + parsed.indent + marker;
            nextText = text.slice(0, caret) + insertion + text.slice(caret);
            nextCaret = caret + insertion.length;
        }
        updateNoteTextBlock(block, blockIndex, nextText, nextCaret, nextCaret);
    }
    function insertInlineNoteImages(urls) {
        const clean = (urls || []).filter(Boolean);
        if (!clean.length) return;
        const id = selectedNoteId || editingNoteId;
        if (!id) return;
        if ((noteDraft.type || "descriptive") === "topic") {
            const nextImages = [...getImages(noteDraft), ...clean];
            updateOpenNote(makeImageData(nextImages));
            return;
        }
        const current = String(noteDraft.content || "");
        const savedCursor = noteBodyCursorRef.current;
        const pos = savedCursor && savedCursor.noteId === id && Number.isFinite(savedCursor.pos) ? Math.max(0, Math.min(current.length, savedCursor.pos)) : current.length;
        const embedded = { ...getNoteEmbeddedImages(noteDraft) };
        const markers = clean.map((url, i) => {
            const imgId = `note-img-${Date.now()}-${i}`;
            embedded[imgId] = url;
            return inlineImageMarker(imgId);
        });
        const before = current.slice(0, pos);
        const after = current.slice(pos);
        const markerText = markers.join("\n");
        const needsBeforeBreak = before && !before.endsWith("\n");
        const needsAfterBreak = after && !after.startsWith("\n");
        const insert = `${needsBeforeBreak ? "\n" : ""}${markerText}${needsAfterBreak ? "\n" : ""}`;
        const nextContent = normalizeInlineImageSpacing(before + insert + after);
        const nextImages = [...getImages(noteDraft), ...clean];
        const markerIndex = nextContent.lastIndexOf(markers[markers.length - 1]);
        noteBodyCursorRef.current = { noteId: id, pos: markerIndex >= 0 ? markerIndex + markers[markers.length - 1].length + 1 : nextContent.length };
        updateOpenNote({ content: nextContent, embeddedImages: embedded, ...makeImageData(nextImages) });
    }
    function restoreOpenNoteSnapshot(snapshot) {
        const id = selectedNoteId || editingNoteId || (snapshot && snapshot.id);
        if (!snapshot || !id) return;
        const clean = clonePlannerSnapshot(snapshot);
        setNoteDraft(noteToDraft(clean));
        setNotes(p => p.map(n => n.id === id ? { ...clean } : n));
    }
    function removeInlineNoteImage(imageId) {
        if (!imageId) return;
        const before = clonePlannerSnapshot({ ...(notes.find(n => n.id === (selectedNoteId || editingNoteId)) || {}), ...noteDraft, id: selectedNoteId || editingNoteId });
        const marker = inlineImageMarker(imageId);
        const embedded = { ...getNoteEmbeddedImages(noteDraft) };
        const removedUrl = embedded[imageId];
        delete embedded[imageId];
        const content = normalizeInlineImageSpacing(String(noteDraft.content || "").replace(marker, "")).replace(/^\n+|\n+$/g, "");
        const stillUsed = removedUrl && Object.values(embedded).includes(removedUrl);
        const nextImages = stillUsed || !removedUrl ? getImages(noteDraft) : getImages(noteDraft).filter(url => url !== removedUrl);
        updateOpenNote({ content, embeddedImages: embedded, ...makeImageData(nextImages) });
        offerUndo("Image removed", () => restoreOpenNoteSnapshot(before));
    }
    function removeUnpositionedNoteImage(url) {
        const before = clonePlannerSnapshot({ ...(notes.find(n => n.id === (selectedNoteId || editingNoteId)) || {}), ...noteDraft, id: selectedNoteId || editingNoteId });
        const nextImages = getImages(noteDraft).filter(img => img !== url);
        updateOpenNote(makeImageData(nextImages));
        offerUndo("Image removed", () => restoreOpenNoteSnapshot(before));
    }
    function updateOpenNoteTopic(index, value) {
        const topics = [...(noteDraft.topics || [""])];
        topics[index] = value;
        updateOpenNote({ topics });
    }
    function addOpenNoteTopic(index) {
        const topics = [...(noteDraft.topics || [""])];
        topics.splice(index + 1, 0, "");
        updateOpenNote({ topics });
    }
    function removeOpenNoteTopic(index) {
        const topics = (noteDraft.topics || [""]).filter((_, i) => i !== index);
        updateOpenNote({ topics: topics.length ? topics : [""] });
    }
    function buildNoteShareText(n) {
        if (!n) return "";
        const title = normalizeNoteTitle(n.title);
        if ((n.type || "descriptive") === "topic") {
            const bullets = (n.topics || []).filter(t => String(t || "").trim()).map(t => "• " + String(t).trim()).join("\n");
            return bullets ? `${title}\n\n${bullets}` : title;
        }
        const body = noteShareTextFromContent(n.content);
        return body ? `${title}\n\n${body}` : title;
    }
    async function shareNote(n) {
        const text = buildNoteShareText(n);
        try {
            if (navigator.share) {
                await navigator.share({ title: normalizeNoteTitle(n.title), text });
                return;
            }
            throw new Error("share unavailable");
        }
        catch (err) {
            try {
                await navigator.clipboard.writeText(text);
                window.alert("Note copied");
            }
            catch (copyErr) {
                window.alert(text);
            }
        }
    }
    function saveNote() {
        const now = Date.now();
        const rec = { ...noteDraft, title: normalizeNoteTitle(noteDraft.title), topics: (noteDraft.topics || []).filter(t => String(t || "").trim()), updatedAt: now };
        if (editingNoteId !== null)
            setNotes(p => p.map(n => n.id === editingNoteId ? { ...n, ...rec } : n));
        else
            setNotes(p => [{ id: now, createdAt: now, ...rec }, ...p]);
        setNoteView("list");
        setEditingNoteId(null);
    }
    function setNotePinned(id, pinned) {
        setNotes(p => p.map(n => n.id === id ? { ...n, pinned: !!pinned } : n));
    }
    function deleteNote(id) {
        const existing = notes.find(n => n.id === id);
        if (!existing) return;
        const snapshot = clonePlannerSnapshot(existing);
        const index = notes.findIndex(n => n.id === id);
        setNotes(p => p.filter(n => n.id !== id));
        if (selectedNoteId === id || editingNoteId === id) returnFromNotePage();
        offerUndo("Note deleted", () => {
            setNotes(p => {
                if ((p || []).some(n => n.id === snapshot.id)) return p;
                const next = [...(p || [])];
                next.splice(Math.max(0, Math.min(index < 0 ? next.length : index, next.length)), 0, snapshot);
                return next;
            });
        });
    }
    function addFolder() {
        if (!folderDraft.name.trim()) return;
        const id = "folder-" + Date.now();
        setFolders(p => [...p, { id, name: folderDraft.name.trim(), color: folderDraft.color }]);
        setFolderDraft({ name: "", color: ACCENT_COLORS[0] });
    }
    function deleteFolder(id) {
        if (id === "general") return;
        setFolders(p => p.filter(f => f.id !== id));
        setNotes(p => p.map(n => n.folderId === id ? { ...n, folderId: generalFolderId(), updatedAt: Date.now() } : n));
        if (selFolderId === id) openNotesOverview();
    }
    function quickAddNote(title, folderId) {
        const now = Date.now();
        setNotes(p => [...p, { id: now, createdAt: now, pinned: false, title, type: "descriptive", content: "", topics: [], folderId, imageUrl: "" }]);
    }
    function openAddMed() {
        setMedDraft(emptyMed());
        setEditingMedId(null);
        setShowMedForm(true);
    }
    function openEditMed(med) {
        setMedDraft({ ...emptyMed(), ...med });
        setEditingMedId(med.id);
        setShowMedForm(true);
    }
    function saveMed() {
        if (!medDraft.name.trim())
            return;
        const saved = { ...medDraft, id: editingMedId !== null ? editingMedId : Date.now(), name: medDraft.name.trim() };
        if (editingMedId !== null)
            setMeds(p => p.map(m => m.id === editingMedId ? saved : m));
        else
            setMeds(p => [...p, saved]);
        setShowMedForm(false);
        setEditingMedId(null);
    }
    function deleteMed(id) {
        setMeds(p => p.filter(m => m.id !== id));
    }
    function toggleMedDose(key) {
        setMedLogs(p => ({ ...p, [key]: !p[key] }));
    }
    function buildBackupData() {
        return {
            version: 2,
            exportedAt: new Date().toISOString(),
            motivation, focusColor, tasks, todayTasksByDate, categories, taskTags: normalizeTaskTags(taskTags), eventCategories, appts, notes, folders, reviews, meds, medLogs, pendingAppleChanges, showDoneTasks
        };
    }
    function exportBackup() {
        const data = buildBackupData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `adhd-planner-backup-${todayStr()}.json`;
        a.click();
        setLastBackupExportAt(new Date().toISOString());
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    async function importBackupFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.motivation)
                setMotivation(data.motivation);
            if (data.focusColor)
                setFocusColor(data.focusColor);
            let importedTasks = null;
            if (Array.isArray(data.tasks)) {
                importedTasks = data.tasks.map(t => ({ ...t, plannerId: t.plannerId || taskPlannerId(t), completedAt: t.completedAt || "", categoryId: normalizeTaskCategoryId(t.categoryId), taskTag: normalizeTaskTagName(t.taskTag || t.tagName || "") }));
                setTasks(importedTasks);
            }
            if (Array.isArray(data.taskTags))
                setTaskTags(normalizeTaskTags(data.taskTags));
            else if (importedTasks)
                setTaskTags(normalizeTaskTags(importedTasks.map(t => ({ name: t.taskTag })).filter(t => t.name)));
            if (data.todayTasksByDate && typeof data.todayTasksByDate === "object")
                setTodayTasksByDate(pruneRecentDayMap(data.todayTasksByDate));
            if (Array.isArray(data.categories))
                setCategories(mergeTaskCategories(data.categories));
            if (Array.isArray(data.eventCategories))
                setEventCategories(mergeEventCategories(data.eventCategories));
            if (Array.isArray(data.appts))
                setAppts(data.appts.map(a => ({ ...a, plannerId: a.plannerId || eventPlannerId(a) })));
            if (Array.isArray(data.notes))
                setNotes(data.notes);
            if (Array.isArray(data.folders))
                setFolders(data.folders);
            if (Array.isArray(data.reviews))
                setReviews(data.reviews);
            if (Array.isArray(data.meds))
                setMeds(data.meds);
            if (data.medLogs && typeof data.medLogs === "object")
                setMedLogs(data.medLogs);
            setPendingAppleChanges(normalizePendingAppleChanges(data.pendingAppleChanges));
            if (typeof data.showDoneTasks === "boolean")
                setShowDoneTasks(data.showDoneTasks);
            else
                setShowDoneTasks(false);
            alert("Backup imported.");
        }
        catch {
            alert("Could not import that backup file.");
        }
    }
    function saveReview() {
        if (!reviewDraft.done.trim() && !reviewDraft.move.trim() && !reviewDraft.tomorrow.trim())
            return;
        setReviews(p => [{ id: Date.now(), date: todayStr(), ...reviewDraft }, ...p].slice(0, 30));
        setReviewDraft({ done: "", move: "", tomorrow: "" });
    }
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDay(calYear, calMonth);
    const apptsByDay = useMemo(() => getOccurrencesForMonth(appts, calYear, calMonth), [rawAppts, calYear, calMonth]);
    function prevMonth() { if (calMonth === 0) {
        setCalMonth(11);
        setCalYear(y => y - 1);
    }
    else
        setCalMonth(m => m - 1); setSelDay(null); }
    function nextMonth() { if (calMonth === 11) {
        setCalMonth(0);
        setCalYear(y => y + 1);
    }
    else
        setCalMonth(m => m + 1); setSelDay(null); }
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);
    const [selWeekDay, setSelWeekDay] = useState(null);
    const weekApptsByDay = useMemo(() => {
        const res = {};
        for (const appt of appts) {
            if (!appt.date)
                continue;
            const orig = new Date(appt.date + "T12:00:00");
            for (const wd of weekDays) {
                const key = wd.toDateString();
                if (!res[key])
                    res[key] = [];
                const match = orig.toDateString() === wd.toDateString();
                const recWeekly = appt.recurrence === "weekly" && wd.getDay() === orig.getDay() && wd > orig;
                const recDaily = appt.recurrence === "daily" && wd > orig;
                const recMonthly = appt.recurrence === "monthly" && wd.getDate() === orig.getDate() && wd > orig;
                if ((match || recWeekly || recDaily || recMonthly) && !res[key].find(x => x.id === appt.id))
                    res[key].push(appt);
            }
        }
        return res;
    }, [rawAppts, weekStart]);
    const isGeneralTaskPage = taskSubTab === "all" || String(taskSubTab || "").startsWith("cat:");
    const activeTaskCategoryId = String(taskSubTab || "").startsWith("cat:") ? String(taskSubTab).slice(4) : "";
    const activeTaskCategory = categories.find(c => c.id === activeTaskCategoryId) || null;
    const isTasksOverview = taskSubTab === "overview";
    const taskPageTitle = isTasksOverview ? "Tasks" : taskSubTab === "all" ? "All" : taskSubTab === "today" ? "Today" : (activeTaskCategory ? activeTaskCategory.name : "Tasks");
    const taskPageAccent = activeTaskCategory ? activeTaskCategory.color : taskSubTab === "today" ? C.amber : C.accent;
    function compareTasksByDue(a, b) {
        const ad = a.dueDate || "9999-99-99";
        const bd = b.dueDate || "9999-99-99";
        if (ad !== bd)
            return ad.localeCompare(bd);
        const at = a.dueTime || "99:99";
        const bt = b.dueTime || "99:99";
        if (at !== bt)
            return at.localeCompare(bt);
        const rank = { high: 0, medium: 1, low: 2 };
        return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    }
    function compareTasksByPriority(a, b) {
        const rank = { high: 0, medium: 1, low: 2 };
        const pr = (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
        return pr !== 0 ? pr : compareTasksByDue(a, b);
    }
    const baseRelevantTasks = activeTaskCategoryId ? tasks.filter(t => t.categoryId === activeTaskCategoryId) : tasks;
    const relevantTasks = [...baseRelevantTasks]
        .filter(t => showDoneTasks ? true : !t.done)
        .sort((a, b) => taskSort === "priority" ? compareTasksByPriority(a, b) : compareTasksByDue(a, b));
    const overdueTasks = relevantTasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr());
    const todayTasks = [...tasks].filter(t => showDoneTasks ? true : !t.done).sort((a, b) => {
        const ad = a.dueDate || "9999-99-99";
        const bd = b.dueDate || "9999-99-99";
        if (ad !== bd)
            return ad.localeCompare(bd);
        const rank = { high: 0, medium: 1, low: 2 };
        return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    });
    const todayAppts = appts.filter(a => occursOn(a, todayStr())).sort((a, b) => (timeToMinutes(a.time) ?? 9999) - (timeToMinutes(b.time) ?? 9999));
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const visibleNotes = (selFolderId ? notes.filter(n => n.folderId === selFolderId) : notes).sort((a, b) => noteSortTime(b) - noteSortTime(a));
    const todayMedDoses = meds.flatMap(m => getMedDosesForDate(m, todayStr()).map(d => ({ med: m, dose: d, done: !!medLogs[d.key] })));
    const medsTakenToday = todayMedDoses.filter(x => x.done).length;
    const todayTaskDateOptions = [offsetDateStr(-2), offsetDateStr(-1), todayStr(), offsetDateStr(1), offsetDateStr(2)];
    const selectedTodayTasks = getTodayList(selectedTodayTaskDate);
    const visibleTodayTasks = showDoneTasks ? selectedTodayTasks : selectedTodayTasks.filter(t => !t.done);
    const selectedTodayUnfinished = selectedTodayTasks.filter(t => !t.done);
    const selectedTodayDone = selectedTodayTasks.filter(t => t.done).length;
    const selectedTodayTotal = selectedTodayTasks.length;
    const selectedTodayPct = selectedTodayTotal ? Math.round((selectedTodayDone / selectedTodayTotal) * 100) : 0;
    const selectedTodayIsPast = selectedTodayTaskDate < todayStr();
    const selectedTodayCanEdit = selectedTodayTaskDate >= todayStr();
    const generalProgressTasks = taskSubTab === "all" || taskSubTab === "overview" ? tasks : activeTaskCategoryId ? tasks.filter(t => t.categoryId === activeTaskCategoryId) : tasks;
    const generalProgressDone = generalProgressTasks.filter(t => t.done).length;
    const generalProgressTotal = generalProgressTasks.length;
    const taskProgressDone = taskSubTab === "today" ? selectedTodayDone : generalProgressDone;
    const taskProgressTotal = taskSubTab === "today" ? selectedTodayTotal : generalProgressTotal;
    const taskProgressPct = taskProgressTotal ? Math.round((taskProgressDone / taskProgressTotal) * 100) : 0;
    const taskProgressLabel = taskSubTab === "overview" ? "All Tasks" : taskSubTab === "today" ? (selectedTodayTaskDate === todayStr() ? "Today Tasks" : weekdayLabel(selectedTodayTaskDate) + " Tasks") : taskPageTitle + " Tasks";
    const pendingAppleList = Object.values(pendingAppleChanges || {}).filter(Boolean).sort((a, b) => String(b.changedAt || "").localeCompare(String(a.changedAt || "")));
    const backupDataBytes = useMemo(() => estimatePlannerDataBytes(buildBackupData()), [motivation, focusColor, rawTasks, todayTasksByDate, categories, taskTags, eventCategories, rawAppts, notes, folders, reviews, meds, medLogs, pendingAppleChanges, showDoneTasks]);
    const backupHealth = getBackupHealth(lastBackupExportAt);
    const openTaskForTodayDashboard = task => { setTab("tasks"); openTaskPage("all"); openEditTask(task); };
    const openEventForTodayDashboard = appt => { setTab("calendar"); openEditAppt(appt); };
    const sortDashboardTasks = list => [...list].sort((a, b) => {
        const ak = taskDateProximityKey(a), bk = taskDateProximityKey(b);
        if (ak !== bk)
            return ak - bk;
        const rank = { high: 0, medium: 1, low: 2 };
        return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    });
    const dashboardOverdueTasks = sortDashboardTasks(tasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr()));
    const dashboardTodayTasks = sortDashboardTasks(tasks.filter(t => !t.done && t.dueDate === todayStr()));
    const dashboardLaterTasks = sortDashboardTasks(tasks.filter(t => !t.done && (!t.dueDate || t.dueDate > todayStr())));
    const dashboardNowTask = dashboardOverdueTasks[0] || dashboardTodayTasks[0] || dashboardLaterTasks[0] || null;
    const dashboardNextTasks = [...dashboardOverdueTasks, ...dashboardTodayTasks, ...dashboardLaterTasks].filter(t => !dashboardNowTask || t.id !== dashboardNowTask.id).slice(0, 2);
    function openTaskPage(page) {
        setTaskSubTab(page);
        setTaskOverviewActionOpen(false);
        setShowTaskForm(false);
        setEditingTaskId(null);
        setShowCatMgr(false);
        setShowTaskTagMgr(false);
        setTaskViewFilter("all");
        if (page === "all" || page === "overview")
            setTaskCatFilter("all");
        else if (String(page || "").startsWith("cat:"))
            setTaskCatFilter(String(page).slice(4));
        else if (page === "today")
            setSelectedTodayTaskDate(todayStr());
    }
    useEffect(() => {
        const page = String(taskSubTab || "");
        const valid = page === "overview" || page === "all" || page === "today" || page.startsWith("cat:");
        if (tab === "tasks" && !valid)
            setTaskSubTab("overview");
    }, [tab, taskSubTab]);
    const taskOpenCount = tasks.filter(t => !t.done).length;
    const todayOpenCount = getTodayList(todayStr()).filter(t => !t.done).length;
    function countForCategory(catId) {
        return tasks.filter(t => !t.done && t.categoryId === catId).length;
    }
    function renderTaskOverviewRow({ title, subtitle, count, color, onClick, special }) {
        return React.createElement("button", { onClick, style: cardSurface({ width: "100%", padding: "12px 14px", borderRadius: 16, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", fontFamily: "inherit" }) },
            React.createElement("div", { style: { width: 30, height: 30, borderRadius: 10, background: (color || C.accent) + "1A", color: color || C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: special ? 15 : 12, flexShrink: 0 } }, special || ""),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { color: C.text, fontSize: 14, fontWeight: 760, lineHeight: 1.25 } }, title),
                subtitle ? React.createElement("div", { style: { color: C.muted, fontSize: 10, marginTop: 2, fontWeight: 600 } }, subtitle) : null),
            React.createElement("div", { style: { color: C.muted, fontSize: 14, fontWeight: 800, minWidth: 24, textAlign: "right" } }, count));
    }
    function renderCategoryManager() {
        const defaultIds = ["homework", "tests", "personal", "work"];
        return React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 14, marginBottom: 14 }) },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } },
                React.createElement("div", { style: { fontSize: 12, fontWeight: 800, color: C.text } }, "Categories"),
                React.createElement("button", { onClick: () => setShowCatMgr(false), style: { background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, fontWeight: 700 } }, "×")),
            categories.map(cat => React.createElement("div", { key: cat.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    React.createElement("div", { style: { width: 10, height: 10, borderRadius: "50%", background: cat.color } }),
                    React.createElement("span", { style: { fontSize: 12, color: C.text, fontWeight: 650 } }, cat.name)),
                !defaultIds.includes(cat.id) ? React.createElement("button", { onClick: () => deleteCategory(cat.id), style: { background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16, fontWeight: 700 } }, "×") : null)),
            React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 10, alignItems: "center", flexWrap: "wrap" } },
                React.createElement("input", { placeholder: "New category", value: catDraft.name, onChange: e => setCatDraft(d => ({ ...d, name: e.target.value })), onKeyDown: e => e.key === "Enter" && addCategory(), style: { ...inp, flex: 1, minWidth: 130, padding: "8px 10px", fontSize: 12 } }),
                React.createElement("div", { style: { display: "flex", gap: 3 } }, ACCENT_COLORS.slice(0, 5).map(c => React.createElement("button", { key: c, onClick: () => setCatDraft(d => ({ ...d, color: c })), style: { width: 18, height: 18, borderRadius: 4, background: c, border: "none", cursor: "pointer", outline: catDraft.color === c ? `2px solid white` : "none", outlineOffset: 1 } }))),
                React.createElement("button", { onClick: addCategory, style: { padding: "8px 11px", borderRadius: 9, border: "none", background: C.accent, color: C.text, fontWeight: 750, fontSize: 12, cursor: "pointer", fontFamily: "inherit" } }, "Add")));
    }
    function renderTaskOverview() {
        return React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { color: C.text, fontSize: 22, fontWeight: 780, letterSpacing: -0.2 } }, "Tasks"),
                    React.createElement("div", { style: { color: C.muted, fontSize: 11, marginTop: 2 } }, "Lists and smart pages")),
                React.createElement("button", { onClick: () => setShowTaskTagMgr(v => !v), title: "Task Tags", style: { width: 36, height: 36, borderRadius: 12, border: `1px solid ${showTaskTagMgr ? C.accent : C.border}`, background: showTaskTagMgr ? C.accent + "16" : UI.controlBg, color: showTaskTagMgr ? C.accent : C.muted, fontWeight: 900, fontSize: 15, fontFamily: "inherit", cursor: "pointer" } }, "#")),
            taskOverviewActionOpen && React.createElement("div", { style: cardSurface({ borderRadius: 16, padding: 10, marginBottom: 12 }) },
                React.createElement("button", { onClick: () => { setShowCatMgr(true); setShowTaskTagMgr(false); setTaskOverviewActionOpen(false); }, style: { width: "100%", padding: 11, borderRadius: 12, border: "none", background: UI.controlBg, color: C.text, fontWeight: 750, fontSize: 13, fontFamily: "inherit", cursor: "pointer", marginBottom: 6, textAlign: "left" } }, "New Category"),
                React.createElement("button", { onClick: () => { setShowTaskTagMgr(true); setShowCatMgr(false); setTaskOverviewActionOpen(false); }, style: { width: "100%", padding: 11, borderRadius: 12, border: "none", background: UI.controlBg, color: C.text, fontWeight: 750, fontSize: 13, fontFamily: "inherit", cursor: "pointer", textAlign: "left" } }, "New Tag")),
            showTaskTagMgr && !showTaskForm && renderTaskTagManager(false),
            showCatMgr && !showTaskForm && renderCategoryManager(),
            React.createElement("div", { style: { marginBottom: 12 } },
                renderTaskOverviewRow({ title: "All", subtitle: "All general tasks", count: taskOpenCount, color: C.accent, special: "∞", onClick: () => openTaskPage("all") }),
                renderTaskOverviewRow({ title: "Today", subtitle: "Daily simple list", count: todayOpenCount, color: C.amber, special: "✓", onClick: () => openTaskPage("today") })),
            React.createElement("div", { style: { marginTop: 6 } }, categories.map(cat => renderTaskOverviewRow({ title: cat.name, subtitle: "Task list", count: countForCategory(cat.id), color: cat.color, special: "", onClick: () => openTaskPage("cat:" + cat.id) }))));
    }
    function renderTaskPageTop() {
        if (taskSubTab === "overview")
            return null;
        return React.createElement("div", { style: { marginBottom: 14 } },
            React.createElement("button", { onClick: () => openTaskPage("overview"), style: { border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontWeight: 760, fontSize: 12, fontFamily: "inherit", padding: "0 0 8px" } }, "‹ Tasks"),
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
                React.createElement("div", { style: { minWidth: 0 } },
                    React.createElement("div", { style: { color: taskPageAccent, fontSize: 22, fontWeight: 780, lineHeight: 1.1, letterSpacing: -0.2 } }, taskPageTitle),
                    React.createElement("div", { style: { color: C.muted, fontSize: 10, marginTop: 4 } }, taskSubTab === "today" ? "Daily simple list" : "General tasks")),
                isGeneralTaskPage && React.createElement("select", { value: taskSort, onChange: e => setTaskSort(e.target.value), style: { ...inp, width: "auto", padding: "7px 9px", fontSize: 10, color: C.muted } },
                    React.createElement("option", { value: "due" }, "Sort: Due Date"),
                    React.createElement("option", { value: "priority" }, "Sort: Priority"))));
    }
    function renderTasksBackButton() {
        if (taskSubTab === "overview")
            return null;
        return React.createElement("button", { onClick: () => openTaskPage("overview"), style: { position: "sticky", bottom: 0, marginTop: 16, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: UI.panelBg, color: C.text, cursor: "pointer", fontWeight: 760, fontSize: 12, fontFamily: "inherit", boxShadow: UI.softShadow, zIndex: 5 } }, "‹ Tasks");
    }
    function primaryAction() {
        if (tab === "calendar")
            openAddAppt();
        else if (tab === "meds")
            openAddMed();
        else if (tab === "notes") {
            if (noteView === "overview") setShowFolderMgr(true);
            else if (noteView === "list") openAddNote(selFolderId || generalFolderId());
        }
        else if (tab === "sync")
            exportPendingAppleChanges();
        else if (tab === "tasks" && taskSubTab === "overview")
            setTaskOverviewActionOpen(v => !v);
        else if (tab === "tasks" && taskSubTab === "today") {
            if (selectedTodayTaskDate !== todayStr())
                setSelectedTodayTaskDate(todayStr());
            setShowTodayTaskForm(true);
        }
        else if (tab === "tasks" && activeTaskCategoryId)
            openAddTask(activeTaskCategoryId);
        else
            openAddTask();
    }
    function renderTodayTaskPage() {
        return React.createElement("div", { style: { marginTop: 0 } },
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" } },
                todayTaskDateOptions.map(d => React.createElement("button", { key: d, onClick: () => { setSelectedTodayTaskDate(d); setShowTodayTaskForm(false); }, style: { padding: "7px 10px", borderRadius: 10, border: selectedTodayTaskDate === d ? `1px solid ${C.amber}` : `1px solid ${C.border}`, background: selectedTodayTaskDate === d ? C.amber + "16" : UI.controlBg, color: selectedTodayTaskDate === d ? C.amber : C.muted, fontWeight: 800, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.1, cursor: "pointer" } }, d === todayStr() ? "Today" : weekdayLabel(d)))),
            selectedTodayIsPast && selectedTodayUnfinished.length > 0 && React.createElement("button", { onClick: () => copyUnfinishedToToday(selectedTodayTaskDate), style: { width: "100%", padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 12 } }, "Copy Unfinished to Today"),
            selectedTodayCanEdit && React.createElement("button", { onClick: () => setShowTodayTaskForm(v => !v), style: { width: "100%", padding: "9px 10px", borderRadius: 12, border: `1px solid ${C.amber}33`, background: C.amber + "12", color: C.amber, cursor: "pointer", fontWeight: 760, fontSize: 12, fontFamily: "inherit", letterSpacing: 0.1, marginBottom: 12 } }, showTodayTaskForm ? "Close" : "+ New Task"),
            showTodayTaskForm && selectedTodayCanEdit && React.createElement("div", { style: cardSurface({ borderRadius: 14, padding: 14, marginBottom: 12 }) },
                React.createElement("input", { autoFocus: true, placeholder: "Today task title", value: todayTaskDraft.title, onChange: e => setTodayTaskDraft(d => ({ ...d, title: e.target.value })), onKeyDown: e => e.key === "Enter" && saveTodayTask(), style: { ...inp, marginBottom: 8 } }),
                React.createElement("textarea", { placeholder: "Description (optional)", value: todayTaskDraft.description, onChange: e => setTodayTaskDraft(d => ({ ...d, description: e.target.value })), rows: 2, style: { ...inp, resize: "none", marginBottom: 8 } }),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: () => { setTodayTaskDraft(emptyTodayTask()); setShowTodayTaskForm(false); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontWeight: 800, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2 } }, "Cancel"),
                    React.createElement("button", { onClick: saveTodayTask, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2 } }, "Add"))),
            visibleTodayTasks.length ? visibleTodayTasks.map((t, i) => React.createElement(TodayTaskCard, { key: t.id, task: t, onToggle: id => toggleTodayTask(id, selectedTodayTaskDate), onDelete: id => deleteTodayTask(id, selectedTodayTaskDate), onMoveUp: () => moveTodayTask(t.id, -1, selectedTodayTaskDate), onMoveDown: () => moveTodayTask(t.id, 1, selectedTodayTaskDate), canMoveUp: i > 0, canMoveDown: i < visibleTodayTasks.length - 1 }))
                : !showTodayTaskForm && React.createElement(EmptyState, { title: "Nothing planned for this day.", description: selectedTodayCanEdit ? "Add the next thing while it is on your mind." : "No tasks were planned for this day.", actionLabel: selectedTodayCanEdit ? "Add Today Task" : "", onAction: selectedTodayCanEdit ? () => setShowTodayTaskForm(true) : null, icon: "✓" }),
            React.createElement("button", { onClick: () => setShowDoneTasks(v => !v), style: { width: "100%", marginTop: 14, padding: 10, borderRadius: 12, border: `1px solid ${showDoneTasks ? C.green : C.border}`, background: showDoneTasks ? C.green + "22" : C.bg2, color: showDoneTasks ? C.green : C.muted, cursor: "pointer", fontWeight: 900, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2 } }, showDoneTasks ? "Hide Done Tasks" : "Show Done Tasks"),
            renderTasksBackButton());
    }
    function renderTasksTabContent() {
        if (taskSubTab === "today")
            return React.createElement("div", null, renderTaskPageTop(), renderTodayTaskPage());
        return (React.createElement("div", null,
            renderTaskPageTop(),
            taskSubTab === "overview" && renderTaskOverview(),
            taskSubTab === "today" && (React.createElement("div", null,
                React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" } },
                    todayTaskDateOptions.map((d, i) => React.createElement("button", { key: d, onClick: () => { setSelectedTodayTaskDate(d); setShowTodayTaskForm(false); }, style: { padding: "6px 10px", borderRadius: 10, border: selectedTodayTaskDate === d ? `1px solid ${C.amber}` : `1px solid ${C.border}`, background: selectedTodayTaskDate === d ? C.amber + "16" : UI.controlBg, color: selectedTodayTaskDate === d ? C.amber : C.muted, fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, cursor: "pointer" } }, d === todayStr() ? "Today" : weekdayLabel(d)))),

                selectedTodayIsPast && selectedTodayUnfinished.length > 0 && React.createElement("button", { onClick: () => copyUnfinishedToToday(selectedTodayTaskDate), style: { width: "100%", padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 12 } }, "Copy Unfinished to Today"),
                selectedTodayCanEdit && React.createElement("button", { onClick: () => setShowTodayTaskForm(v => !v), style: { width: "100%", padding: "8px 10px", borderRadius: 12, border: `1px solid ${C.amber}33`, background: C.amber + "12", color: C.amber, cursor: "pointer", fontWeight: 760, fontSize: 12, fontFamily: "inherit", letterSpacing: 0.1, marginBottom: 12 } }, showTodayTaskForm ? "Close" : "+ New Task"),
                showTodayTaskForm && selectedTodayCanEdit && React.createElement("div", { style: { background: C.bg2, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 } },
                    React.createElement("input", { autoFocus: true, placeholder: "Today task title", value: todayTaskDraft.title, onChange: e => setTodayTaskDraft(d => ({ ...d, title: e.target.value })), onKeyDown: e => e.key === "Enter" && saveTodayTask(), style: { ...inp, marginBottom: 8 } }),
                    React.createElement("textarea", { placeholder: "Description (optional)", value: todayTaskDraft.description, onChange: e => setTodayTaskDraft(d => ({ ...d, description: e.target.value })), rows: 2, style: { ...inp, resize: "none", marginBottom: 8 } }),
                    React.createElement("div", { style: { display: "flex", gap: 8 } },
                        React.createElement("button", { onClick: () => { setTodayTaskDraft(emptyTodayTask()); setShowTodayTaskForm(false); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontWeight: 800, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2 } }, "Cancel"),
                        React.createElement("button", { onClick: saveTodayTask, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2 } }, "Add"))),
                visibleTodayTasks.length ? visibleTodayTasks.map((t, i) => React.createElement(TodayTaskCard, { key: t.id, task: t, onToggle: id => toggleTodayTask(id, selectedTodayTaskDate), onDelete: id => deleteTodayTask(id, selectedTodayTaskDate), onMoveUp: () => moveTodayTask(t.id, -1, selectedTodayTaskDate), onMoveDown: () => moveTodayTask(t.id, 1, selectedTodayTaskDate), canMoveUp: i > 0, canMoveDown: i < visibleTodayTasks.length - 1 }))
                    : React.createElement("div", { style: { textAlign: "center", padding: "34px 0", color: C.muted } }, React.createElement("div", { style: { fontSize: 24, marginBottom: 10 } }, "[ ]"), React.createElement("div", { style: { fontSize: 11, fontWeight: 800, letterSpacing: 0.4 } }, selectedTodayTaskDate === todayStr() ? "Today is empty" : "No tasks on this day"))),
                React.createElement("button", { onClick: () => setShowDoneTasks(v => !v), style: { width: "100%", marginTop: 14, padding: 10, borderRadius: 12, border: `1px solid ${showDoneTasks ? C.green : C.border}`, background: showDoneTasks ? C.green + "22" : C.bg2, color: showDoneTasks ? C.green : C.muted, cursor: "pointer", fontWeight: 900, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2 } }, showDoneTasks ? "Hide Done Tasks" : "Show Done Tasks"),
                renderTasksBackButton()),
            isGeneralTaskPage && (React.createElement(React.Fragment, null,
            showCatMgr && !showTaskForm && renderCategoryManager(),
            overdueTasks.length > 0 && (React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement(SectionHeader, { icon: "\u26A0", label: "OVERDUE", color: C.red }),
                overdueTasks.map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple, onCopyToToday: copyTaskToToday })))),
            (taskSort === "due" ? ["due"] : ["high", "medium", "low"]).map(pri => {
                const list = taskSort === "due"
                    ? relevantTasks.filter(t => !t.done && !(t.dueDate && t.dueDate < todayStr()))
                    : relevantTasks.filter(t => t.priority === pri && !t.done && !(t.dueDate && t.dueDate < todayStr()));
                if (!list.length)
                    return null;
                const p = taskSort === "due" ? { icon: "[ ]", label: "Tasks", color: taskPageAccent } : PRIORITY[pri];
                return (React.createElement("div", { key: pri, style: { marginBottom: 16 } },
                    React.createElement(SectionHeader, { icon: p.icon, label: taskSort === "due" ? "TASKS" : `${p.label} PRIORITY`, color: p.color }),
                    list.map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple, onCopyToToday: copyTaskToToday }))));
            }),
            relevantTasks.filter(t => t.done).length > 0 && (React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement(SectionHeader, { icon: "\u2713", label: "DONE", color: C.dim }),
                relevantTasks.filter(t => t.done).map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple, onCopyToToday: copyTaskToToday })))),
            relevantTasks.length === 0 && !overdueTasks.length && !showTaskForm && React.createElement(EmptyState, { title: activeTaskCategory ? `No tasks in ${activeTaskCategory.name} yet.` : "No tasks yet.", description: "Add the next thing while it is on your mind.", actionLabel: "Add Task", onAction: () => openAddTask(activeTaskCategoryId || ""), icon: "✓" }),
            showTaskForm ? (React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 16, marginTop: 10 }) },
                React.createElement("input", { autoFocus: true, placeholder: "What needs to get done?", value: taskDraft.text, onChange: e => setTaskDraft(d => ({ ...d, text: e.target.value })), onKeyDown: e => e.key === "Enter" && saveTask(), style: { ...inp, marginBottom: 8 } }),
                React.createElement("textarea", { placeholder: "Description (optional)", value: taskDraft.description, onChange: e => setTaskDraft(d => ({ ...d, description: e.target.value })), rows: 2, style: { ...inp, resize: "none", marginBottom: 8 } }),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) auto", gap: 8, marginBottom: 8, alignItems: "stretch" } },
                    React.createElement("input", { type: "date", value: taskDraft.dueDate, onChange: e => setTaskDraft(d => ({ ...d, dueDate: e.target.value })), style: { ...inp, minWidth: 0, fontSize: 12 } }),
                    React.createElement("input", { type: "time", value: taskDraft.dueTime || "", onChange: e => setTaskDraft(d => ({ ...d, dueTime: e.target.value })), style: { ...inp, minWidth: 0, fontSize: 12, padding: "10px 6px", textAlign: "center" } }),
                    React.createElement("button", { onClick: () => setTaskDraft(d => ({ ...d, dueDate: "", dueTime: "", alertTime: "" })), style: { padding: "0 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap" } }, "No date")),
                React.createElement("button", { onClick: () => setTaskAlertOpen(v => !v), style: { width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg3, color: taskDraft.alertEnabled ? C.accent : C.muted, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: taskAlertOpen ? 8 : 10, textAlign: "left" } }, taskDraft.alertEnabled ? `Alert On: ${taskDraft.alertDate || "choose date"} ${taskDraft.alertTime || ""}` : "Alert Off  +"),
                taskAlertOpen && React.createElement("div", { style: { marginBottom: 10 } },
                    React.createElement("button", { onClick: () => setTaskDraft(d => ({ ...d, alertEnabled: !d.alertEnabled, alertDate: d.alertEnabled ? "" : d.alertDate, alertTime: d.alertEnabled ? "" : d.alertTime })), style: { width: "100%", padding: 10, borderRadius: 10, border: taskDraft.alertEnabled ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: taskDraft.alertEnabled ? C.accent + "22" : C.bg3, color: taskDraft.alertEnabled ? C.accent : C.muted, cursor: "pointer", fontWeight: 900, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 8 } }, taskDraft.alertEnabled ? "Alert Enabled" : "Alert Disabled"),
                    taskDraft.alertEnabled && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto", gap: 8, alignItems: "center" } },
                        React.createElement("input", { type: "date", value: taskDraft.alertDate || "", onChange: e => setTaskDraft(d => ({ ...d, alertDate: e.target.value })), style: { ...inp, minWidth: 0, fontSize: 12 } }),
                        React.createElement("input", { type: "time", value: taskDraft.alertTime || "", onChange: e => setTaskDraft(d => ({ ...d, alertTime: e.target.value })), style: { ...inp, minWidth: 0, fontSize: 12, padding: "10px 6px", textAlign: "center" } }),
                        React.createElement("button", { onClick: () => setTaskDraft(d => ({ ...d, alertDate: "", alertTime: "" })), style: { padding: "0 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap" } }, "Clear"))),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 6 } }, "Repeat"),
                React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10 } }, ["none", "daily", "weekly", "monthly"].map(r => (React.createElement("button", { key: r, onClick: () => setTaskDraft(d => ({ ...d, recurrence: r })), style: { flex: 1, padding: "6px 0", borderRadius: 8, border: taskDraft.recurrence === r ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: taskDraft.recurrence === r ? C.accent + "22" : C.bg3, cursor: "pointer", fontWeight: 700, fontSize: 8, fontFamily: "inherit", color: taskDraft.recurrence === r ? C.accent : C.muted, letterSpacing: 0.5 } }, r === "none" ? "Once" : prettyLabel(r))))),
                React.createElement(MultiImageUploadBtn, { value: taskDraft.imageUrls || getImages(taskDraft), onChange: urls => setTaskDraft(d => ({ ...d, ...makeImageData(urls) })) }),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 6 } }, "Priority"),
                React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } }, Object.entries(PRIORITY).map(([k, p]) => (React.createElement("button", { key: k, onClick: () => setTaskDraft(d => ({ ...d, priority: k })), style: { flex: 1, padding: "6px 0", borderRadius: 8, cursor: "pointer", border: taskDraft.priority === k ? `1px solid ${p.color}` : `1px solid ${C.border}`, background: taskDraft.priority === k ? p.bg : C.bg3, fontWeight: 700, fontSize: 10, fontFamily: "inherit", color: taskDraft.priority === k ? p.color : C.muted, letterSpacing: 0.2 } },
                    p.icon,
                    " ",
                    p.label)))),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 6 } }, "Category"),
                React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" } }, categories.map(cat => React.createElement("button", { key: cat.id, onClick: () => setTaskDraft(d => ({ ...d, categoryId: cat.id })), style: { padding: "5px 10px", borderRadius: 20, border: taskDraft.categoryId === cat.id ? `1px solid ${cat.color}` : `1px solid ${C.border}`, background: taskDraft.categoryId === cat.id ? cat.color + "22" : "transparent", cursor: "pointer", fontWeight: 700, fontSize: 9, fontFamily: "inherit", color: taskDraft.categoryId === cat.id ? cat.color : C.muted, letterSpacing: 0.2 } }, cat.name))),
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted } }, "Task Tag"),
                    React.createElement("button", { onClick: () => setShowTaskTagMgr(v => !v), style: { width: 30, height: 26, borderRadius: 9, border: `1px solid ${showTaskTagMgr ? C.accent : C.border}`, background: showTaskTagMgr ? C.accent + "16" : "transparent", color: showTaskTagMgr ? C.accent : C.muted, cursor: "pointer", fontWeight: 900, fontSize: 13, fontFamily: "inherit" } }, "#")),
                React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: showTaskTagMgr ? 8 : 12, flexWrap: "wrap" } },
                    React.createElement("button", { onClick: () => setTaskDraft(d => ({ ...d, taskTag: "" })), style: { padding: "5px 10px", borderRadius: 20, border: !normalizeTaskTagName(taskDraft.taskTag) ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: !normalizeTaskTagName(taskDraft.taskTag) ? C.accent + "16" : "transparent", cursor: "pointer", fontWeight: 700, fontSize: 9, fontFamily: "inherit", color: !normalizeTaskTagName(taskDraft.taskTag) ? C.accent : C.muted, letterSpacing: 0.2 } }, "None"),
                    normalizeTaskTags([...taskTags, ...(normalizeTaskTagName(taskDraft.taskTag) && !taskTags.some(t => normalizeTaskTagName(t.name) === normalizeTaskTagName(taskDraft.taskTag)) ? [{ name: taskDraft.taskTag }] : [])]).map(tag => React.createElement("button", { key: tag.name, onClick: () => setTaskDraft(d => ({ ...d, taskTag: tag.name })), style: { padding: "5px 10px", borderRadius: 20, border: normalizeTaskTagName(taskDraft.taskTag) === tag.name ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: normalizeTaskTagName(taskDraft.taskTag) === tag.name ? C.accent + "16" : "transparent", cursor: "pointer", fontWeight: 800, fontSize: 9, fontFamily: "inherit", color: normalizeTaskTagName(taskDraft.taskTag) === tag.name ? C.accent : C.muted, letterSpacing: 0.2 } }, displayTaskTag(tag.name)))),
                showTaskTagMgr && showTaskForm && renderTaskTagManager(true),
                taskDraft.subtasks.length > 0 && (React.createElement("div", { style: { marginBottom: 10 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 6 } }, "Subtasks"),
                    taskDraft.subtasks.map((s, i) => (React.createElement("div", { key: s.id, style: { display: "flex", gap: 6, marginBottom: 6, alignItems: "center" } },
                        React.createElement("span", { style: { color: C.accent, fontWeight: 700, fontSize: 14, flexShrink: 0 } }, "\u00B7"),
                        React.createElement("input", { placeholder: `Step ${i + 1}`, value: s.text, onChange: e => updateSubtaskInDraft(s.id, e.target.value), style: { ...inp, flex: 1, padding: "6px 10px", fontSize: 12 } }),
                        React.createElement("button", { onClick: () => removeSubtaskFromDraft(s.id), style: { background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16, fontWeight: 700 } }, "\u00D7")))))),
                React.createElement("button", { onClick: addSubtaskToDraft, style: { padding: "6px 12px", borderRadius: 8, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 12 } }, "+ Add Subtask"),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: () => { setShowTaskForm(false); setEditingTaskId(null); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", color: C.muted, fontSize: 11, letterSpacing: 0.2 } }, "Cancel"),
                    React.createElement("button", { type: "button", onClick: saveTask, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.accent, color: C.text, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, boxShadow: "none" } }, editingTaskId ? "Save Changes" : "Add Task")),
                React.createElement("button", { type: "button", onClick: saveTaskAndExport, style: { width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, boxShadow: "none" } }, editingTaskId ? "Save + Send to Apple" : "Add Task + Send to Apple"))) : null,
            React.createElement("button", { onClick: () => setShowDoneTasks(v => !v), style: { width: "100%", marginTop: 14, padding: 10, borderRadius: 12, border: `1px solid ${showDoneTasks ? C.green : C.border}`, background: showDoneTasks ? C.green + "22" : C.bg2, color: showDoneTasks ? C.green : C.muted, cursor: "pointer", fontWeight: 900, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2 } }, showDoneTasks ? "Hide Done Tasks" : "Show Done Tasks"),
            renderTasksBackButton()
            ))));
    }

    // ── Shared tab content ─────────────────────────────────────────────────────
    function goSection(key) {
        setTab(key);
        if (key === "tasks")
            openTaskPage("overview");
        if (key === "notes")
            openNotesOverview();
        setSearchOpen(false);
        setSearchQuery("");
        setSearchReturnSnapshot(null);
    }
    function shouldShowMainBack() {
        if (tab === "today" || searchOpen)
            return false;
        if (tab === "tasks")
            return taskSubTab === "overview";
        if (tab === "notes")
            return noteView === "overview";
        if (tab === "calendar")
            return !showApptForm && !selectedApptId;
        if (tab === "meds")
            return !showMedForm;
        return true;
    }
    function renderBackupHealthPanel() {
        const imageCount = notes.reduce((total, n) => total + getImages(n).length, 0) + tasks.reduce((total, t) => total + getImages(t).length, 0) + appts.reduce((total, a) => total + getImages(a).length, 0);
        return React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 15, marginBottom: 10 }) },
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 } },
                React.createElement("div", { style: { fontSize: 14, color: C.text, fontWeight: 780 } }, "Backup & Storage"),
                React.createElement("div", { style: { color: backupHealth.color, fontSize: 11, fontWeight: 760, textAlign: "right" } }, backupHealth.label)),
            React.createElement("div", { style: { color: C.muted, fontSize: 11, lineHeight: 1.55 } }, `Last backup export: ${formatBackupExportTime(lastBackupExportAt)}`),
            React.createElement("div", { style: { color: C.muted, fontSize: 11, lineHeight: 1.55 } }, `Estimated Planner data: ${formatPlannerDataSize(backupDataBytes)}${imageCount ? ` · ${imageCount} stored image${imageCount === 1 ? "" : "s"}` : ""}`),
            React.createElement("div", { style: { color: C.dim, fontSize: 10, lineHeight: 1.45, marginTop: 6 } }, "Exports stay on this device until you save the downloaded file somewhere safe."),
            React.createElement("button", { onClick: exportBackup, style: { width: "100%", minHeight: 42, marginTop: 12, padding: "10px 12px", borderRadius: 12, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontFamily: "inherit", fontWeight: 850, fontSize: 12 } }, "Export Backup"));
    }
    function renderTopLevelBackButton() {
        if (!shouldShowMainBack())
            return null;
        return React.createElement("button", { onClick: () => goSection("today"), style: { border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontWeight: 760, fontSize: 13, fontFamily: "inherit", padding: "0 0 14px", display: "inline-flex", alignItems: "center", gap: 4 } }, "‹ Main");
    }
    function renderSearchBackButton() {
        if (!searchOpen) return null;
        return React.createElement("button", { onClick: closeSearch, style: { border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontWeight: 760, fontSize: 15, fontFamily: "inherit", padding: "0 0 14px", display: "inline-flex", alignItems: "center", gap: 4 } }, "‹ Back");
    }
    function renderMainNavCard({ keyName, title, subtitle, count, icon, color }) {
        const accent = color || C.accent;
        return React.createElement("button", { onClick: () => goSection(keyName), style: cardSurface({ minHeight: 112, padding: 16, borderRadius: 22, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${UI.border}`, background: `linear-gradient(145deg, ${accent}24, rgba(255,255,255,0.045))`, boxShadow: "none" }) },
            React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 } },
                React.createElement("div", { style: { width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.16)", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 } }, icon),
                count !== undefined && count !== null && React.createElement("div", { style: { color: C.text, fontSize: 30, lineHeight: 1, fontWeight: 820, letterSpacing: -1.1 } }, count)),
            React.createElement("div", null,
                React.createElement("div", { style: { color: C.text, fontSize: 22, fontWeight: 780, letterSpacing: -0.5, lineHeight: 1.05 } }, title),
                subtitle ? React.createElement("div", { style: { color: C.muted, fontSize: 11, marginTop: 5, fontWeight: 620, lineHeight: 1.3 } }, subtitle) : null));
    }
    function renderMainPage() {
        const calCount = todayAppts.length;
        const medCountText = todayMedDoses.length ? `${medsTakenToday}/${todayMedDoses.length}` : "0";
        return React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { color: C.muted, fontSize: 13, fontWeight: 700, marginBottom: 5 } }, "Main"),
                    React.createElement("div", { style: { color: C.text, fontSize: 34, fontWeight: 820, letterSpacing: -1.1, lineHeight: 1.05 } }, today.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }))),
                React.createElement("button", { onClick: () => { searchOpen ? closeSearch() : openSearch(); }, style: controlSurface({ width: 44, height: 44, borderRadius: 16, border: `1px solid ${searchOpen ? C.accent + "66" : UI.border}`, background: searchOpen ? C.accent + "22" : UI.controlBg, cursor: "pointer", color: searchOpen ? C.accent : C.muted, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }) }, "🔍")),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 0 } },
                renderMainNavCard({ keyName: "tasks", title: "Tasks", subtitle: "Lists & Today", count: taskOpenCount, icon: "✓", color: C.accent }),
                renderMainNavCard({ keyName: "calendar", title: "Calendar", subtitle: calCount ? "Today" : "No events today", count: calCount, icon: "□", color: C.red }),
                renderMainNavCard({ keyName: "meds", title: "Meds", subtitle: "Doses", count: medCountText, icon: "◉", color: C.green }),
                renderMainNavCard({ keyName: "notes", title: "Notes", subtitle: "Saved notes", count: notes.length, icon: "≡", color: C.amber }),
                React.createElement("div", { style: { gridColumn: "1 / -1" } }, renderMainNavCard({ keyName: "sync", title: "Sync", subtitle: pendingAppleCount ? "Pending Apple changes" : "Everything synced", count: pendingAppleCount, icon: "↗", color: pendingAppleCount ? C.amber : C.dim }))));
    }
    function renderNoteFolderManager() {
        return React.createElement("div", { style: cardSurface({ borderRadius: 16, padding: 14, marginBottom: 12 }) },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 } },
                React.createElement("div", { style: { color: C.text, fontSize: 14, fontWeight: 780 } }, "Note Categories"),
                React.createElement("button", { onClick: () => setShowFolderMgr(false), style: { border: "none", background: "transparent", color: C.muted, cursor: "pointer", fontSize: 18, fontWeight: 800 } }, "×")),
            React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", marginBottom: 12 } },
                React.createElement("input", { placeholder: "New category", value: folderDraft.name, onChange: e => setFolderDraft(d => ({ ...d, name: e.target.value })), onKeyDown: e => e.key === "Enter" && addFolder(), style: { ...inp, flex: 1, padding: "8px 10px", fontSize: 12 } }),
                React.createElement("button", { onClick: addFolder, style: { padding: "8px 12px", borderRadius: 10, border: "none", background: C.accent, color: C.text, fontWeight: 800, fontSize: 11, cursor: "pointer", fontFamily: "inherit" } }, "Add")),
            React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" } }, ACCENT_COLORS.slice(0, 8).map(c => React.createElement("button", { key: c, onClick: () => setFolderDraft(d => ({ ...d, color: c })), style: { width: 22, height: 22, borderRadius: 7, background: c, border: "none", cursor: "pointer", outline: folderDraft.color === c ? `2px solid ${C.text}` : "1px solid transparent", outlineOffset: 1 } }))),
            folders.map(f => React.createElement("div", { key: f.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: `1px solid ${C.border}` } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, minWidth: 0 } },
                    React.createElement("span", { style: { width: 10, height: 10, borderRadius: 5, background: f.color, flexShrink: 0 } }),
                    React.createElement("span", { style: { color: C.text, fontSize: 12, fontWeight: 680, overflow: "hidden", textOverflow: "ellipsis" } }, f.name),
                    React.createElement("span", { style: { color: C.dim, fontSize: 11 } }, notes.filter(n => n.folderId === f.id).length)),
                f.id !== "general" && React.createElement("button", { onClick: () => deleteFolder(f.id), style: { border: "none", background: C.red + "14", color: C.red, width: 30, height: 30, borderRadius: 10, cursor: "pointer", fontWeight: 900, fontSize: 14 } }, "×"))));
    }
    function renderNotesOverviewRow({ title, count, color, icon, onClick }) {
        return React.createElement("button", { onClick, style: cardSurface({ width: "100%", borderRadius: 16, padding: "14px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${color || C.accent}` }) },
            React.createElement("div", { style: { width: 34, height: 34, borderRadius: 12, background: (color || C.accent) + "22", color: color || C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, flexShrink: 0 } }, icon || "≡"),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } }, React.createElement("div", { style: { color: C.text, fontSize: 15, fontWeight: 760 } }, title)),
            React.createElement("div", { style: { color: C.muted, fontSize: 17, fontWeight: 800 } }, count));
    }
    function renderNoteCard(n, inAll) {
        var _a, _b;
        const folder = folders.find(f => f.id === n.folderId) || folders.find(f => f.id === "general") || DEFAULT_FOLDERS[0];
        const isOpen = activeNoteActionsId === n.id;
        const preview = (n.type || "descriptive") === "topic"
            ? (n.topics || []).filter(Boolean).slice(0, 2).map(t => "• " + t).join("\n")
            : noteShareTextFromContent(n.content);
        if (isOpen) {
            const stop = e => { e.stopPropagation(); e.preventDefault(); };
            return React.createElement("div", { key: n.id, style: cardSurface({ borderRadius: 16, padding: 12, marginBottom: 8, borderLeft: `3px solid ${folder.color || C.amber}` }) },
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 } },
                    React.createElement("button", { onClick: e => { stop(e); setActiveNoteActionsId(null); }, style: actionButtonSurface(C.muted, C.bg3) }, React.createElement(ActionIcon, { name: "return" })),
                    React.createElement("button", { onClick: e => { stop(e); setNotePinned(n.id, !n.pinned); setActiveNoteActionsId(null); }, title: n.pinned ? "Unpin" : "Pin", style: actionButtonSurface(n.pinned ? C.amber : C.muted, n.pinned ? C.amber + "18" : C.bg3) }, React.createElement(ActionIcon, { name: "pin" })),
                    React.createElement("button", { onClick: e => { stop(e); shareNote(n); setActiveNoteActionsId(null); }, title: "Share", style: actionButtonSurface(C.accent, C.accent + "18") }, "↥"),
                    React.createElement("button", { onClick: e => { stop(e); deleteNote(n.id); setActiveNoteActionsId(null); }, title: "Delete", style: actionButtonSurface(C.red, C.red + "14") }, React.createElement(ActionIcon, { name: "delete" }))));
        }
        return React.createElement("div", { key: n.id, onClick: () => openViewNote(n, { view: "list", folderId: selFolderId }), style: cardSurface({ borderRadius: 16, padding: "13px 12px 13px 14px", marginBottom: 8, borderLeft: `3px solid ${folder.color || C.amber}`, cursor: "pointer" }) },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { color: C.text, fontSize: 14, fontWeight: 760, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, normalizeNoteTitle(n.title)),
                    React.createElement("div", { style: { color: (_a = folder.color) !== null && _a !== void 0 ? _a : C.muted, fontSize: 10, fontWeight: 700, marginBottom: preview ? 5 : 0 } }, (n.type === "topic" ? "Topic" : "Text"), inAll ? ` · ${(_b = folder.name) !== null && _b !== void 0 ? _b : "General"}` : ""),
                    preview && React.createElement("div", { onClick: e => e.stopPropagation(), onPointerDown: e => e.stopPropagation(), onPointerUp: e => e.stopPropagation(), style: { color: C.muted, fontSize: 12, lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } }, renderLinkedText(preview))),
                getImages(n)[0] && React.createElement("img", { src: getImages(n)[0], alt: "", onClick: e => { e.stopPropagation(); openPlannerImage(getImages(n)[0]); }, style: { width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 } }),
                React.createElement("button", { onClick: e => { e.stopPropagation(); setActiveNoteActionsId(activeNoteActionsId === n.id ? null : n.id); }, style: { width: 42, height: 42, borderRadius: 14, border: `1px solid ${C.border}`, background: C.bg3, color: C.muted, cursor: "pointer", fontSize: 22, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, "⋯")));
    }
    function renderNoteDetailPage() {
        const n = notes.find(x => x.id === selectedNoteId);
        if (!n) return React.createElement("div", null, React.createElement("button", { onClick: returnFromNotePage, style: { border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontWeight: 760, fontSize: 13, fontFamily: "inherit", padding: "0 0 14px" } }, "‹ Notes"));
        const folder = folders.find(f => f.id === (noteDraft.folderId || n.folderId)) || folders.find(f => f.id === "general") || DEFAULT_FOLDERS[0];
        const topics = noteDraft.topics && noteDraft.topics.length ? noteDraft.topics : [""];
        return React.createElement("div", null,
            React.createElement("button", { onClick: returnFromNotePage, style: { border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontWeight: 760, fontSize: 13, fontFamily: "inherit", padding: "0 0 14px" } }, "‹ Notes"),
            React.createElement("input", { placeholder: "Untitled", value: noteDraft.title || "", onChange: e => updateOpenNote({ title: e.target.value }), style: { width: "100%", boxSizing: "border-box", border: "none", outline: "none", background: "transparent", color: C.text, fontFamily: "inherit", fontSize: 30, fontWeight: 820, letterSpacing: -0.8, marginBottom: 10 } }),
            React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, alignItems: "center" } },
                folders.map(f => React.createElement("button", { key: f.id, onClick: () => updateOpenNote({ folderId: f.id }), style: { padding: "5px 9px", borderRadius: 999, border: (noteDraft.folderId || n.folderId) === f.id ? `1px solid ${f.color}` : `1px solid ${C.border}`, background: (noteDraft.folderId || n.folderId) === f.id ? f.color + "22" : C.bg2, color: (noteDraft.folderId || n.folderId) === f.id ? f.color : C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 720 } }, f.name)),
                React.createElement("button", { onClick: () => { setNoteListMenuOpen(false); updateOpenNote({ type: (noteDraft.type || n.type) === "topic" ? "descriptive" : "topic" }); }, style: { padding: "5px 9px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.bg2, color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 720 } }, (noteDraft.type || n.type) === "topic" ? "Topic" : "Text")),
            renderNoteToolbar({
                onImages: insertInlineNoteImages,
                showList: (noteDraft.type || n.type) !== "topic",
                listMenuOpen: noteListMenuOpen,
                onToggleList: () => setNoteListMenuOpen(v => !v),
                onPickList: applyNoteListStyle
            }),
            (noteDraft.type || n.type) === "topic" ? React.createElement("div", { style: { marginBottom: 12 } },
                topics.map((topic, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 } },
                    React.createElement("span", { style: { color: folder.color || C.amber, fontSize: 18, fontWeight: 900 } }, "•"),
                    React.createElement("input", { placeholder: `Topic ${i + 1}`, value: topic, onChange: e => updateOpenNoteTopic(i, e.target.value), onKeyDown: e => { if (e.key === "Enter") { e.preventDefault(); addOpenNoteTopic(i); } if (e.key === "Backspace" && !topic && topics.length > 1) { e.preventDefault(); removeOpenNoteTopic(i); } }, style: { ...inp, flex: 1, border: "none", background: C.bg2, fontSize: 14 } }),
                    topics.length > 1 && React.createElement("button", { onClick: () => removeOpenNoteTopic(i), style: { border: "none", background: "transparent", color: C.red, cursor: "pointer", fontSize: 18, fontWeight: 900 } }, "×"))),
                React.createElement("button", { onClick: () => addOpenNoteTopic(topics.length - 1), style: { padding: "7px 10px", borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 } }, "+ Add Topic"),
                getUnpositionedNoteImages(noteDraft).length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, margin: "12px 0" } }, getUnpositionedNoteImages(noteDraft).map((url, i) => React.createElement("div", { key: i, style: { position: "relative" } },
                    React.createElement("img", { src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1.4", borderRadius: 12, objectFit: "cover", display: "block" } }),
                    React.createElement("button", { onClick: () => removeUnpositionedNoteImage(url), style: { position: "absolute", top: 6, right: 6, background: "#000000AA", border: "none", borderRadius: 7, width: 26, height: 26, cursor: "pointer", color: C.red, fontWeight: 900, fontSize: 15 } }, "×")))) )
                : React.createElement("div", { style: { marginBottom: 8, paddingBottom: 24 } },
                    parseNoteContentBlocks(noteDraft.content).filter((block, idx, all) => shouldRenderNoteTextBlock(block, all, idx)).map((block, i, arr) => block.type === "image" ? (React.createElement("div", { key: `img-${block.id}-${i}`, style: { position: "relative", margin: "10px 0 12px" } },
                        getNoteInlineImageUrl(noteDraft, block.id) ? React.createElement("img", { src: getNoteInlineImageUrl(noteDraft, block.id), alt: "", onClick: () => openPlannerImage(getNoteInlineImageUrl(noteDraft, block.id)), style: { width: "100%", maxHeight: 520, borderRadius: 14, objectFit: "cover", display: "block", cursor: "zoom-in", border: `1px solid ${C.border}` } }) : React.createElement("div", { style: { color: C.dim, fontSize: 12, padding: "8px 0" } }, "[Missing image]"),
                        React.createElement("button", { onClick: () => removeInlineNoteImage(block.id), style: { position: "absolute", top: 8, right: 8, background: "#000000AA", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: C.red, fontWeight: 900, fontSize: 16 } }, "×"))) :
                        ((activeNoteTextBlockIndex === i) || (!String(noteDraft.content || "").trim() && arr.length === 1)) ? React.createElement("textarea", { key: `edit-text-${i}`, autoFocus: activeNoteTextBlockIndex === i, placeholder: i === 0 ? "Start writing..." : "Continue writing...", value: block.text, onChange: e => { rememberNoteBodyCursor(block.start, e, i, block.end); replaceNoteContentRange(block.start, block.end, e.target.value); }, onInput: e => rememberNoteBodyCursor(block.start, e, i, block.end), onClick: e => rememberNoteBodyCursor(block.start, e, i, block.end), onKeyUp: e => rememberNoteBodyCursor(block.start, e, i, block.end), onKeyDown: e => handleDescriptiveNoteListEnter(block, i, e), onSelect: e => rememberNoteBodyCursor(block.start, e, i, block.end), onFocus: e => { setActiveNoteTextBlockIndex(i); rememberNoteBodyCursor(block.start, e, i, block.end); }, onBlur: () => { setActiveNoteTextBlockIndex(null); setNoteListMenuOpen(false); }, "data-note-body-block-index": i, "data-note-block-start": block.start, rows: 1, style: { width: "100%", boxSizing: "border-box", minHeight: estimateNoteTextHeight(noteTextHeightSource(block.text), arr.length === 1 ? 420 : (String(block.text || "").trim() ? 44 : 26)), height: estimateNoteTextHeight(noteTextHeightSource(block.text), arr.length === 1 ? 420 : (String(block.text || "").trim() ? 44 : 26)), overflow: "hidden", border: "none", outline: "none", background: "transparent", color: C.text, fontFamily: "inherit", fontSize: 16, lineHeight: 1.65, resize: "none", marginBottom: 0, display: "block" } }) : React.createElement("div", { key: `read-text-${i}`, onClick: () => { noteBodyCursorRef.current = { noteId: selectedNoteId || editingNoteId, pos: block.end }; setActiveNoteTextBlockIndex(i); }, style: { width: "100%", boxSizing: "border-box", minHeight: String(block.text || "").trim() ? 28 : 26, padding: "2px 0", color: C.text, fontFamily: "inherit", fontSize: 16, lineHeight: 1.65, cursor: "text" } }, renderLinkedText(block.text, {}, i === 0 ? "Start writing..." : ""))),
                    getUnpositionedNoteImages(noteDraft).length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, margin: "12px 0" } }, getUnpositionedNoteImages(noteDraft).map((url, i) => React.createElement("div", { key: i, style: { position: "relative" } },
                        React.createElement("img", { src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1.4", borderRadius: 12, objectFit: "cover", display: "block" } }),
                        React.createElement("button", { onClick: () => removeUnpositionedNoteImage(url), style: { position: "absolute", top: 6, right: 6, background: "#000000AA", border: "none", borderRadius: 7, width: 26, height: 26, cursor: "pointer", color: C.red, fontWeight: 900, fontSize: 15 } }, "×"))))));
    }
    function renderNotesTabContent() {
        const sorted = [...notes].sort((a, b) => noteSortTime(b) - noteSortTime(a));
        const inAll = selFolderId === null;
        const pageNotes = inAll ? sorted : sorted.filter(n => n.folderId === selFolderId);
        const folder = selFolderId ? folders.find(f => f.id === selFolderId) : null;
        if (noteView === "view") return renderNoteDetailPage();
        if (noteView === "list") {
            return React.createElement("div", null,
                React.createElement("button", { onClick: openNotesOverview, style: { border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontWeight: 760, fontSize: 13, fontFamily: "inherit", padding: "0 0 14px" } }, "‹ Notes"),
                React.createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 14 } },
                    React.createElement("div", null,
                        React.createElement("div", { style: { color: folder ? (folder.color || C.amber) : C.accent, fontSize: 30, fontWeight: 820, lineHeight: 1.05, letterSpacing: -0.7 } }, folder ? folder.name : "All Notes"),
                        React.createElement("div", { style: { color: C.muted, fontSize: 12, marginTop: 5 } }, pageNotes.length, " note", pageNotes.length === 1 ? "" : "s"))),
                pageNotes.filter(n => !!n.pinned).length > 0 && React.createElement("div", { style: { marginBottom: 14 } },
                    React.createElement(SectionHeader, { icon: "⌁", label: "PINNED", color: C.amber }),
                    pageNotes.filter(n => !!n.pinned).map(n => renderNoteCard(n, inAll))),
                pageNotes.filter(n => !n.pinned).length > 0 && React.createElement("div", null,
                    React.createElement(SectionHeader, { icon: "◷", label: "RECENT", color: C.muted }),
                    pageNotes.filter(n => !n.pinned).map(n => renderNoteCard(n, inAll))),
                pageNotes.length === 0 && React.createElement(EmptyState, { title: folder ? "No notes in this folder yet." : "No notes yet. Capture an idea before it disappears.", actionLabel: "New Note", onAction: () => openAddNote(selFolderId || generalFolderId()), icon: "≡" }));
        }
        return React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 14 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { color: C.text, fontSize: 30, fontWeight: 820, letterSpacing: -0.8, lineHeight: 1.05 } }, "Notes"),
                    React.createElement("div", { style: { color: C.muted, fontSize: 12, marginTop: 5 } }, "Categories and folders")),
                React.createElement("button", { onClick: () => setShowFolderMgr(v => !v), style: { width: 42, height: 42, borderRadius: 14, border: `1px solid ${C.border}`, background: C.bg2, color: C.muted, cursor: "pointer", fontSize: 20, fontWeight: 900 } }, "+")),
            showFolderMgr && renderNoteFolderManager(),
            renderNotesOverviewRow({ title: "All", count: notes.length, color: C.accent, icon: "≡", onClick: () => openNotesList(null) }),
            folders.map(f => renderNotesOverviewRow({ title: f.name, count: notes.filter(n => n.folderId === f.id).length, color: f.color || C.amber, icon: "□", onClick: () => openNotesList(f.id) })));
    }

    function openSearchTaskResult(task) {
        setTab("tasks");
        setSearchOpen(false);
        setSearchQuery("");
        setSearchFilter("all");
        openTaskPage("all");
        openEditTask(task);
    }
    function openSearchEventResult(appt) {
        setTab("calendar");
        setSearchOpen(false);
        setSearchQuery("");
        setSearchFilter("all");
        openViewAppt(appt);
    }
    function openSearchNoteResult(note) {
        setTab("notes");
        setSearchOpen(false);
        setSearchQuery("");
        setSearchFilter("all");
        openViewNote(note, { view: "list", folderId: note.folderId || null });
    }
    function renderSearchResults() {
        if (!searchOpen || !searchQuery.trim() || !searchResults) return null;
        const groups = {
            tasks: searchResults.tasks || [],
            events: searchResults.appts || [],
            notes: searchResults.notes || []
        };
        const filterOptions = [["all", "All"], ["tasks", "Tasks"], ["events", "Events"], ["notes", "Notes"]];
        const visibleTasks = searchFilter === "all" || searchFilter === "tasks" ? groups.tasks : [];
        const visibleEvents = searchFilter === "all" || searchFilter === "events" ? groups.events : [];
        const visibleNotes = searchFilter === "all" || searchFilter === "notes" ? groups.notes : [];
        const count = visibleTasks.length + visibleEvents.length + visibleNotes.length;
        return React.createElement("div", null,
            React.createElement("div", { style: controlSurface({ display: "flex", gap: 5, padding: 4, borderRadius: 15, marginBottom: 14, overflowX: "auto" }) },
                filterOptions.map(([value, label]) => React.createElement("button", { key: value, onClick: () => setSearchFilter(value), style: { minHeight: 34, padding: "7px 11px", borderRadius: 11, border: "none", background: searchFilter === value ? C.accent + "20" : "transparent", color: searchFilter === value ? C.accent : C.muted, cursor: "pointer", fontFamily: "inherit", fontWeight: 760, fontSize: 11, whiteSpace: "nowrap" } }, label))),
            count === 0 && React.createElement(EmptyState, { title: `No results for ‘${searchQuery.trim()}’.`, icon: "⌕" }),
            visibleTasks.length > 0 && React.createElement("div", { style: { marginBottom: 16 } },
                searchFilter === "all" && React.createElement(SectionHeader, { icon: "⊡", label: "TASKS", color: C.accent }),
                visibleTasks.map(t => {
                    const category = categories.find(c => c.id === t.categoryId);
                    const body = t.description || "";
                    const snippet = buildSearchSnippet(body, searchQuery);
                    const meta = [category && category.name, displayTaskTag(t.taskTag), t.dueDate ? formatBrDate(t.dueDate) : ""].filter(Boolean).join(" · ");
                    return React.createElement(SearchResultCard, { key: t.id, type: "Task", title: t.text || "Untitled task", snippet, meta, color: category ? category.color : C.accent, query: searchQuery, onClick: () => openSearchTaskResult(t) });
                })),
            visibleEvents.length > 0 && React.createElement("div", { style: { marginBottom: 16 } },
                searchFilter === "all" && React.createElement(SectionHeader, { icon: "□", label: "EVENTS", color: C.green }),
                visibleEvents.map(a => {
                    const snippet = buildSearchSnippet(a.description || "", searchQuery);
                    const meta = [a.date ? formatBrDate(a.date) : "", a.time || ""].filter(Boolean).join(" · ");
                    return React.createElement(SearchResultCard, { key: a.id, type: "Event", title: a.title || "Untitled event", snippet, meta, color: a.color || C.green, query: searchQuery, onClick: () => openSearchEventResult(a) });
                })),
            visibleNotes.length > 0 && React.createElement("div", null,
                searchFilter === "all" && React.createElement(SectionHeader, { icon: "≡", label: "NOTES", color: C.amber }),
                visibleNotes.map(n => {
                    const folder = folders.find(f => f.id === n.folderId);
                    const body = (n.type || "descriptive") === "topic" ? (n.topics || []).join("\n") : n.content || "";
                    const snippet = buildSearchSnippet(body, searchQuery);
                    return React.createElement(SearchResultCard, { key: n.id, type: "Note", title: normalizeNoteTitle(n.title), snippet, meta: (folder && folder.name) || "General", color: (folder && folder.color) || C.amber, query: searchQuery, onClick: () => openSearchNoteResult(n) });
                })));
    }

    const tabContent = (React.createElement(React.Fragment, null,
        renderStorageSaveWarning(),
        searchOpen && renderSearchResults(),
        !searchOpen && tab === "today" && renderMainPage(),
        !searchOpen && tab === "sync" && (React.createElement("div", null,
            React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 16, border: `1px solid ${pendingAppleCount ? C.amber + "32" : UI.border}`, marginBottom: 14, boxShadow: "none" }) },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 800, letterSpacing: 0.4, color: C.amber, marginBottom: 8 } }, "Sync & Backup"),
                React.createElement("div", { style: { fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 6 } }, pendingAppleCount ? `${pendingAppleCount} unsynced Apple change${pendingAppleCount === 1 ? "" : "s"}` : "Everything is synced"),
                React.createElement("button", { onClick: exportPendingAppleChanges, disabled: pendingAppleCount === 0, style: { width: "100%", padding: 12, borderRadius: 12, border: "none", background: pendingAppleCount ? C.amber : C.bg4, color: pendingAppleCount ? C.bg0 : C.dim, cursor: pendingAppleCount ? "pointer" : "not-allowed", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 8 } }, "Sync Pending Changes", pendingAppleCount ? ` (${pendingAppleCount})` : ""),
                React.createElement("button", { onClick: bulkExportPlannerToApple, style: { width: "100%", padding: 12, borderRadius: 12, border: "none", background: C.accent, color: C.text, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2 } }, "Full Apple Sync"),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                    React.createElement("button", { onClick: bulkExportTasksToApple, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2 } }, "Tasks Only"),
                    React.createElement("button", { onClick: bulkExportEventsToApple, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2 } }, "Events Only"))),
            React.createElement(SectionHeader, { icon: "↗", label: "PENDING CHANGES", color: pendingAppleCount ? C.amber : C.dim }),
            pendingAppleList.length ? pendingAppleList.map(ch => {
                const isOpen = activePendingChangeId === ch.plannerId;
                const baseStyle = { background: C.bg2, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${C.border}`, borderLeft: `2px solid ${ch.operation === "delete" ? C.red : C.amber}`, cursor: "pointer" };
                return isOpen
                    ? React.createElement("div", { key: ch.plannerId, onClick: () => setActivePendingChangeId(null), style: { ...baseStyle, minHeight: 62, display: "flex", alignItems: "center" } },
                        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" } },
                            React.createElement("button", { onClick: e => { e.stopPropagation(); setActivePendingChangeId(null); }, style: actionButtonSurface(C.red, C.red + "14") }, React.createElement(ActionIcon, { name: "return" })),
                            React.createElement("button", { onClick: e => { e.stopPropagation(); clearPendingAppleChange(ch.plannerId); }, style: { ...actionButtonSurface(C.red, C.red + "14"), width: 54 } }, React.createElement(ActionIcon, { name: "trash" }))))
                    : React.createElement("div", { key: ch.plannerId, onClick: () => setActivePendingChangeId(ch.plannerId), style: baseStyle },
                        React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 5 } }, (ch.snapshot && ch.snapshot.title) || ch.plannerId),
                        React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: 0.2 } },
                            React.createElement("span", { style: { color: ch.type === "event" ? C.green : C.accent } }, prettyLabel(ch.type || "")),
                            React.createElement("span", { style: { color: ch.operation === "delete" ? C.red : C.amber } }, prettyLabel(ch.operation || "upsert")),
                            React.createElement("span", null, prettyLabel(ch.reason || "changed"))));
            })
                : React.createElement(EmptyState, { title: "Everything is up to date.", description: "No pending Apple changes.", icon: "✓" }),
            React.createElement(SectionHeader, { icon: "▣", label: "BACKUP", color: C.green }),
            renderBackupHealthPanel(),
            React.createElement("div", { style: cardSurface({ borderRadius: 18, padding: 16 }) },
                React.createElement("input", { ref: importRef, type: "file", accept: "application/json", style: { display: "none" }, onChange: e => { var _a; const f = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]; if (f)
                            importBackupFile(f); if (e.target)
                            e.target.value = ""; } }),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: exportBackup, style: { flex: 1, padding: 11, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2 } }, "Export Backup"),
                    React.createElement("button", { onClick: () => { var _a; return (_a = importRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2 } }, "Import")),
                React.createElement("div", { style: { textAlign: "center", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.dim, fontWeight: 800, letterSpacing: 0.4 } }, "App Version ", APP_VERSION)))),
        !searchOpen && tab === "tasks" && renderTasksTabContent(),
        !searchOpen && tab === "calendar" && (React.createElement("div", null,
            React.createElement("div", { style: controlSurface({ display: "flex", gap: 4, marginBottom: 14, borderRadius: 16, padding: 4 }) }, [["grid", "Month"], ["week", "Week"], ["list", "List"]].map(([key, label]) => (React.createElement("button", { key: key, onClick: () => setCalView(key), style: { flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 9, letterSpacing: 0.2, fontFamily: "inherit", background: calView === key ? C.accent + "20" : "transparent", color: calView === key ? C.accent : C.muted, boxShadow: calView === key ? "none" : "none" } }, label)))),
            calView === "grid" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } },
                    React.createElement("button", { onClick: prevMonth, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u2039"),
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: C.text, letterSpacing: 0.4 } },
                        MONTHS[calMonth],
                        " ",
                        calYear),
                    React.createElement("button", { onClick: nextMonth, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u203A")),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 } }, DAYS_S.map((d, i) => React.createElement("div", { key: i, style: { textAlign: "center", fontSize: 9, fontWeight: 700, color: i === 0 || i === 6 ? C.muted : C.dim, letterSpacing: 0.2, padding: "4px 0" } }, d))),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 } },
                    Array.from({ length: firstDay }).map((_, i) => React.createElement("div", { key: "e" + i })),
                    Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                        const isSel = selDay === day;
                        return (React.createElement("button", { key: day, onClick: () => {
                            const picked = new Date(calYear, calMonth, day);
                            setSelDay(day);
                            setWeekStart(weekStartFromDate(picked));
                            setSelWeekDay(picked);
                            setCalView("week");
                        }, style: { aspectRatio: "1", borderRadius: 10, border: "none", background: isSel ? C.accent + "22" : isToday ? C.bg4 : C.bg2, color: isSel ? C.accent : isToday ? C.accent : C.text, fontWeight: isSel || isToday ? 800 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", outline: isToday && !isSel ? `1px solid ${C.accent}44` : "none", boxShadow: "none", position: "relative" } },
                            day,
                            apptsByDay[day] && !isSel && (React.createElement("div", { style: { position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 } }, (apptsByDay[day] || []).slice(0, 3).map((a, idx) => React.createElement("div", { key: idx, style: { width: 3, height: 3, borderRadius: "50%", background: a.color, boxShadow: "none" } }))))));
                    })),
                false && selDay && (React.createElement("div", { style: { marginTop: 16 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.accent, marginBottom: 10 } },
                        "// ",
                        MONTHS[calMonth],
                        " ",
                        selDay),
                    ((_a = apptsByDay[selDay]) !== null && _a !== void 0 ? _a : []).length === 0 ? React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "12px 0" } }, "No events scheduled.")
                        : React.createElement(DayTimeline, { date: new Date(calYear, calMonth, selDay), appts: (_b = apptsByDay[selDay]) !== null && _b !== void 0 ? _b : [], onDelete: deleteAppt, onEdit: openViewAppt, onRealEdit: openEditAppt, onExport: exportEventToApple }))),
                !selDay && (React.createElement("div", { style: { marginTop: 18 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 10 } }, "// UPCOMING"),
                    appts.filter(a => a.date && new Date(a.date + "T12:00:00") >= new Date(today.toDateString())).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5).map(a => React.createElement(ApptCard, { key: a.id, appt: a, onDelete: deleteAppt, onEdit: openEditAppt, onExport: exportEventToApple })),
                    appts.length === 0 && React.createElement(EmptyState, { title: "Nothing scheduled for this day.", actionLabel: "Add Event", onAction: openAddAppt, icon: "□" }))))),
            calView === "week" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
                    React.createElement("button", { onClick: () => { setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); setSelWeekDay(n); return n; }); }, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u2039"),
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: C.text, letterSpacing: 0.4 } },
                        weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" }),
                        " \u2013 ",
                        weekDays[6].toLocaleDateString([], { month: "short", day: "numeric" })),
                    React.createElement("button", { onClick: () => { setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); setSelWeekDay(n); return n; }); }, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u203A")),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 14, position: "sticky", top: 0, zIndex: 20, background: C.bg1, paddingBottom: 8 } }, weekDays.map((wd, i) => {
                    var _a;
                    const isToday = wd.toDateString() === today.toDateString();
                    const isSel = (selWeekDay === null || selWeekDay === void 0 ? void 0 : selWeekDay.toDateString()) === wd.toDateString();
                    const dayAppts = (_a = weekApptsByDay[wd.toDateString()]) !== null && _a !== void 0 ? _a : [];
                    return (React.createElement("button", { key: i, onClick: () => setSelWeekDay(wd), style: { borderRadius: 12, border: "none", background: isSel ? C.accent + "22" : isToday ? C.bg4 : C.bg2, cursor: "pointer", fontFamily: "inherit", padding: "8px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, outline: isToday && !isSel ? `1px solid ${C.accent}44` : "none", boxShadow: "none" } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, color: isSel ? C.bg0 : C.dim, letterSpacing: 0.2 } }, DAYS_L[i].slice(0, 3)),
                        React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: isSel ? C.accent : isToday ? C.accent : C.text } }, wd.getDate()),
                        React.createElement("div", { style: { display: "flex", gap: 2 } }, dayAppts.slice(0, 3).map((a, idx) => React.createElement("div", { key: idx, style: { width: 4, height: 4, borderRadius: "50%", background: isSel ? C.bg0 : a.color } })))));
                })),
                selWeekDay && (React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.accent, marginBottom: 10 } },
                        "// ",
                        DAYS_L[selWeekDay.getDay()],
                        " ",
                        selWeekDay.toLocaleDateString([], { month: "short", day: "numeric" })),
                    ((_c = weekApptsByDay[selWeekDay.toDateString()]) !== null && _c !== void 0 ? _c : []).length === 0
                        ? React.createElement(DayTimeline, { date: selWeekDay, appts: [], onDelete: deleteAppt, onEdit: openViewAppt, selectedApptId: selectedApptId, onBack: () => setSelectedApptId(null), onRealEdit: openEditAppt, onExport: exportEventToApple })
                        : React.createElement(DayTimeline, { date: selWeekDay, appts: (_d = weekApptsByDay[selWeekDay.toDateString()]) !== null && _d !== void 0 ? _d : [], onDelete: deleteAppt, onEdit: openViewAppt, selectedApptId: selectedApptId, onBack: () => setSelectedApptId(null), onRealEdit: openEditAppt, onExport: exportEventToApple }))),
                !selWeekDay && React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "12px 0", letterSpacing: 0.2 } }, "Tap a day to see its events."))),
            calView === "list" && (React.createElement("div", null,
                React.createElement("div", { style: { marginBottom: 14 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 8 } }, "// FILTER BY COLOR"),
                    React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                        ACCENT_COLORS.map(c => {
                            if (!appts.some(a => a.color === c))
                                return null;
                            const active = apptColorFilter.has(c);
                            return React.createElement("button", { key: c, onClick: () => toggleColorFilter(c), style: { width: 28, height: 28, borderRadius: 8, background: c, border: "none", cursor: "pointer", outline: active ? `2px solid white` : "2px solid transparent", outlineOffset: 2, opacity: active ? 1 : 0.3 } });
                        }),
                        apptColorFilter.size > 0 && React.createElement("button", { onClick: () => setApptColorFilter(new Set()), style: { padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 9, fontFamily: "inherit" } }, "CLEAR"))),
                filteredAppts.filter(a => (a.endDate || a.date || "") >= todayStr()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(a => React.createElement(ApptCard, { key: a.id, appt: a, onDelete: deleteAppt, onEdit: openEditAppt, onView: openViewAppt, onExport: exportEventToApple })),
                filteredAppts.filter(a => (a.endDate || a.date || "") >= todayStr()).length === 0 && React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: C.muted } },
                    React.createElement("div", { style: { fontSize: 24, marginBottom: 10 } }, "[ ]"),
                    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: 0.4 } }, "No Appointments")))),
            selectedApptId ? (() => {
                const a = appts.find(x => x.id === selectedApptId);
                if (!a)
                    return React.createElement("div", null);
                const d = new Date(a.date + "T12:00:00");
                return React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, borderLeft: `3px solid ${a.color}`, marginTop: 14 } },
                    React.createElement("button", { onClick: () => setSelectedApptId(null), style: { background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.2, marginBottom: 12, padding: 0 } }, "\u2190 BACK"),
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 8 } },
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { fontSize: 18, fontWeight: 800, color: a.color, lineHeight: 1.3, marginBottom: 5 } }, a.title),
                            React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 0.2, lineHeight: 1.6 } }, d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })),
                            a.categoryText && React.createElement("div", { style: { fontSize: 11, color: a.color, letterSpacing: 0.2, lineHeight: 1.6, fontWeight: 800 } }, "Category: ", a.categoryText),
                            (a.time || a.endTime) && React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 0.2, lineHeight: 1.6 } }, a.time || "No start", a.endTime ? ` \u2013 ${a.endTime}` : "")),
                        React.createElement("button", { onClick: () => openEditAppt(a), style: { padding: "7px 12px", borderRadius: 9, border: "none", background: C.accent, color: C.text, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2 } }, "Edit")),
                    React.createElement("button", { onClick: () => exportEventToApple(a), style: { width: "100%", padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, marginTop: 8 } }, "Send to Apple Calendar"),
                    getImages(a).length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, margin: "12px 0" } }, getImages(a).map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1", borderRadius: 10, objectFit: "cover", display: "block", cursor: "zoom-in" } }))),
                    React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.7, marginTop: 12 } }, a.description ? renderLinkedText(a.description) : "No description."));
            })() : showApptForm ? (React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, marginTop: 14 } },
                React.createElement("input", { autoFocus: true, placeholder: "Event title", value: apptDraft.title, onChange: e => setApptDraft(d => ({ ...d, title: e.target.value })), style: { ...inp, marginBottom: 8 } }),
                React.createElement("input", { placeholder: "Location (optional)", value: apptDraft.locationText || "", onChange: e => setApptDraft(d => ({ ...d, locationText: e.target.value })), style: { ...inp, marginBottom: 8 } }),
                React.createElement("textarea", { placeholder: "Description (optional)", value: apptDraft.description, onChange: e => setApptDraft(d => ({ ...d, description: e.target.value })), rows: 2, style: { ...inp, resize: "none", marginBottom: 8 } }),
                React.createElement(MultiImageUploadBtn, { value: apptDraft.imageUrls || getImages(apptDraft), onChange: urls => setApptDraft(d => ({ ...d, ...makeImageData(urls) })) }),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 8 } },
                    React.createElement("div", { style: { minWidth: 0 } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 4 } }, "Starts"),
                        React.createElement("input", { type: "date", value: apptDraft.date, onChange: e => { const nextDate = e.target.value; setApptDraft(d => ({ ...d, date: nextDate, endDate: apptEndDateManuallySet ? (d.endDate || nextDate) : nextDate })); }, style: { ...inp, width: "100%", minWidth: 0 } })),
                    React.createElement("div", { style: { minWidth: 0 } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 4 } }, "ENDS"),
                        React.createElement("input", { type: "date", value: apptDraft.endDate || apptDraft.date || "", onChange: e => { setApptEndDateManuallySet(true); setApptDraft(d => ({ ...d, endDate: e.target.value })); }, style: { ...inp, width: "100%", minWidth: 0 } }))),
                React.createElement("button", { onClick: () => setApptDraft(d => ({ ...d, allDay: !d.allDay, time: !d.allDay ? "" : d.time, endTime: !d.allDay ? "" : d.endTime })), style: { width: "100%", padding: 10, borderRadius: 10, border: apptDraft.allDay ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: apptDraft.allDay ? C.accent + "22" : C.bg3, color: apptDraft.allDay ? C.accent : C.muted, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 8 } }, apptDraft.allDay ? "All-day: Yes" : "All-day: No"),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 8, width: "100%", overflow: "hidden", opacity: apptDraft.allDay ? 0.35 : 1 } },
                    React.createElement("div", { style: { minWidth: 0, width: "100%" } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 4 } }, "START TIME"),
                        React.createElement("input", { type: "time", value: apptDraft.time, disabled: apptDraft.allDay, onChange: e => setApptDraft(d => ({ ...d, time: e.target.value, allDay: !e.target.value && !d.endTime })), style: { ...inp, width: "100%", minWidth: 0, maxWidth: "100%", padding: "10px 6px", textAlign: "center" } })),
                    React.createElement("div", { style: { minWidth: 0, width: "100%" } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 4 } }, "END TIME"),
                        React.createElement("input", { type: "time", value: apptDraft.endTime, disabled: apptDraft.allDay, onChange: e => setApptDraft(d => ({ ...d, endTime: e.target.value, allDay: !d.time && !e.target.value })), style: { ...inp, width: "100%", minWidth: 0, maxWidth: "100%", padding: "10px 6px", textAlign: "center" } }))),
                React.createElement("button", { onClick: () => setApptAlertOpen(v => !v), style: { width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg3, color: apptDraft.alertEnabled ? C.accent : C.muted, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: apptAlertOpen ? 8 : 10, textAlign: "left" } }, apptDraft.alertEnabled ? `ALERT ON: ${apptDraft.alertDate || "choose date"} ${apptDraft.alertTime || ""}` : "Alert Off  +"),
                apptAlertOpen && React.createElement("div", { style: { marginBottom: 10 } },
                    React.createElement("button", { onClick: () => setApptDraft(d => ({ ...d, alertEnabled: !d.alertEnabled, alertDate: d.alertEnabled ? "" : d.alertDate, alertTime: d.alertEnabled ? "" : d.alertTime })), style: { width: "100%", padding: 10, borderRadius: 10, border: apptDraft.alertEnabled ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: apptDraft.alertEnabled ? C.accent + "22" : C.bg3, color: apptDraft.alertEnabled ? C.accent : C.muted, cursor: "pointer", fontWeight: 900, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 8 } }, apptDraft.alertEnabled ? "Alert Enabled" : "Alert Disabled"),
                    apptDraft.alertEnabled && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto", gap: 8, alignItems: "center" } },
                        React.createElement("input", { type: "date", value: apptDraft.alertDate || "", onChange: e => setApptDraft(d => ({ ...d, alertDate: e.target.value })), style: { ...inp, minWidth: 0, fontSize: 12 } }),
                        React.createElement("input", { type: "time", value: apptDraft.alertTime || "", onChange: e => setApptDraft(d => ({ ...d, alertTime: e.target.value })), style: { ...inp, minWidth: 0, fontSize: 12, padding: "10px 6px", textAlign: "center" } }),
                        React.createElement("button", { onClick: () => setApptDraft(d => ({ ...d, alertDate: "", alertTime: "" })), style: { padding: "0 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap" } }, "Clear"))),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 6 } }, "Repeat"),
                React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10 } }, ["none", "daily", "weekly", "monthly"].map(r => (React.createElement("button", { key: r, onClick: () => setApptDraft(d => ({ ...d, recurrence: r })), style: { flex: 1, padding: "6px 0", borderRadius: 8, border: apptDraft.recurrence === r ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: apptDraft.recurrence === r ? C.accent + "22" : C.bg3, cursor: "pointer", fontWeight: 700, fontSize: 8, fontFamily: "inherit", color: apptDraft.recurrence === r ? C.accent : C.muted, letterSpacing: 0.5 } }, r === "none" ? "Once" : prettyLabel(r))))),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.muted, marginBottom: 6 } }, "Category"),
                React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 } },
                    eventCategories.map(cat => React.createElement("button", { key: cat.id, onClick: () => setApptDraft(d => ({ ...d, categoryId: cat.id, categoryText: capitalizeLabel(cat.name), color: cat.color })), style: { minWidth: 74, padding: "8px 10px", borderRadius: 8, background: cat.color + "22", border: apptDraft.categoryId === cat.id ? `1px solid ${cat.color}` : `1px solid ${C.border}`, cursor: "pointer", outline: apptDraft.categoryId === cat.id ? `2px solid ${cat.color}` : "2px solid transparent", outlineOffset: 1, opacity: apptDraft.categoryId === cat.id ? 1 : 0.65, color: cat.color, fontWeight: 900, fontSize: 9, fontFamily: "inherit", letterSpacing: 0.5 } }, cat.name)),
                    React.createElement("button", { onClick: () => setShowEventCatMgr(v => !v), style: { minWidth: 74, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 900, fontSize: 9, fontFamily: "inherit", letterSpacing: 0.5 } }, "+ CATEGORY")),
                showEventCatMgr && React.createElement("div", { style: { background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, marginBottom: 12 } },
                    React.createElement("input", { placeholder: "New event category", value: eventCatDraft.name, onChange: e => setEventCatDraft(d => ({ ...d, name: e.target.value })), style: { ...inp, marginBottom: 8 } }),
                    React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 } }, ACCENT_COLORS.map(c => React.createElement("button", { key: c, onClick: () => setEventCatDraft(d => ({ ...d, color: c })), style: { width: 24, height: 24, borderRadius: 6, background: c, border: "none", cursor: "pointer", outline: eventCatDraft.color === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: 2, opacity: eventCatDraft.color === c ? 1 : 0.45 } }))),
                    React.createElement("button", { onClick: addEventCategory, style: { width: "100%", padding: 9, borderRadius: 9, border: "none", background: C.accent, color: C.text, cursor: "pointer", fontWeight: 900, fontSize: 10, fontFamily: "inherit", letterSpacing: 0.2, marginBottom: 8 } }, "Add Category"),
                    eventCategories.map(cat => React.createElement("div", { key: cat.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "5px 0", borderTop: `1px solid ${C.border}` } },
                        React.createElement("span", { style: { color: cat.color, fontSize: 10, fontWeight: 800, letterSpacing: 0.2 } }, cat.name),
                        !DEFAULT_EVENT_CATEGORIES.some(d => d.id === cat.id) && React.createElement("button", { onClick: () => deleteEventCategory(cat.id), style: { background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 12, fontWeight: 900 } }, "×")))),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: () => { setShowApptForm(false); setEditingApptId(null); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", color: C.muted, fontSize: 11, letterSpacing: 0.2 } }, "Cancel"),
                    React.createElement("button", { type: "button", onClick: saveAppt, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, boxShadow: "none" } }, editingApptId ? "Save Changes" : "Add Event")),
                React.createElement("button", { type: "button", onClick: saveApptAndExport, style: { width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 0.2, boxShadow: "none" } }, editingApptId ? "Save + Send to Apple" : "Add Event + Send to Apple"))) : null)),
        !searchOpen && tab === "meds" && (React.createElement("div", null,
            React.createElement(SectionHeader, { icon: "💊", label: "MEDICATION TRACKER", color: C.green }),
            React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 800, letterSpacing: 0.4, color: C.green, marginBottom: 6 } }, "Today’s Doses"),
                React.createElement("div", { style: { fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: 0.2 } }, medsTakenToday, "/", todayMedDoses.length, " TAKEN"),
                null),
            showMedForm && React.createElement(MedicationForm, { draft: medDraft, setDraft: setMedDraft, onSave: saveMed, onCancel: () => { setShowMedForm(false); setEditingMedId(null); }, editing: editingMedId !== null }),
            meds.length ? meds.map(m => React.createElement(MedicationCard, { key: m.id, med: m, medLogs: medLogs, onToggleDose: toggleMedDose, onEdit: openEditMed, onDelete: deleteMed }))
                : React.createElement(EmptyState, { title: "No medications added.", actionLabel: "Add Medication", onAction: openAddMed, icon: "+" }))),
        !searchOpen && tab === "notes" && renderNotesTabContent()));
    // ── Focus banner (shared) ───────────────────────────────────────────────────
    const compactFocus = false;
    const focusBanner = (React.createElement("div", { style: cardSurface({ border: `1px solid ${C.accent}22`, borderLeft: compactFocus ? `2px solid ${C.accent}66` : `3px solid ${C.accent}`, borderRadius: compactFocus ? 14 : 18, padding: compactFocus ? "8px 10px" : "13px 14px", cursor: "pointer", position: "relative", overflow: "hidden", boxShadow: compactFocus ? "none" : UI.glowBlue }) , onClick: !editMot ? startEditMot : undefined },
        editMot ? (React.createElement("div", null,
            React.createElement("textarea", { ref: motRef, value: motDraft, onChange: e => setMotDraft(e.target.value), onClick: e => e.stopPropagation(), rows: compactFocus ? 1 : 2, style: { ...inp, resize: "none", marginBottom: 8, border: `1px solid ${C.accent}44`, fontSize: 11 } }),
            React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 8 } }, ACCENT_COLORS.concat([C.text]).map(c => React.createElement("button", { key: c, onClick: e => { e.stopPropagation(); setFocusColor(c); }, style: { width: 20, height: 20, borderRadius: 6, background: c, border: "none", cursor: "pointer", outline: focusColor === c ? `2px solid white` : "1px solid transparent", outlineOffset: 1 } }))),
            React.createElement("button", { onClick: e => { e.stopPropagation(); saveMot(); }, style: { background: C.accent, color: C.text, border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 700, fontSize: 10, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.1 } }, "Save"))) : (React.createElement("div", { style: { display: compactFocus ? "flex" : "block", alignItems: "center", gap: 8 } },
            compactFocus && React.createElement("span", { style: { color: C.accent, fontSize: 11, fontWeight: 760, flexShrink: 0 } }, "Focus"),
            !compactFocus && React.createElement("div", { style: { fontSize: 11, fontWeight: 760, letterSpacing: 0.1, color: C.accent, marginBottom: 5 } }, "Focus"),
            React.createElement("div", { style: { color: focusColor, fontSize: compactFocus ? 11 : 13, fontWeight: 600, lineHeight: 1.45, whiteSpace: compactFocus ? "nowrap" : "normal", overflow: "hidden", textOverflow: "ellipsis" } }, motivation)))));
    // ── DESKTOP / TABLET LAYOUT (≥640px) ───────────────────────────────────────
    if (isWide) {
        const content = searchOpen
            ? React.createElement(React.Fragment, null, renderSearchBackButton(), tabContent)
            : tab === "tasks"
                ? React.createElement(React.Fragment, null, renderTopLevelBackButton(), renderTasksTabContent())
                : React.createElement(React.Fragment, null, renderTopLevelBackButton(), tabContent);
        return (React.createElement("div", { onTouchStart: handleSwipeBackStart, onTouchMove: handleSwipeBackMove, onTouchEnd: handleSwipeBackEnd, onTouchCancel: handleSwipeBackEnd, style: { height: "100dvh", minHeight: "100dvh", width: "100%", background: UI.appBg, fontFamily: UI.font, overflow: "hidden", position: "relative", transform: swipeOffset ? `translateX(${swipeOffset}px)` : "none", transition: swipeOffset ? "none" : "transform 0.18s ease" } },
            React.createElement("div", { style: { height: 58, borderBottom: `1px solid ${UI.border}`, display: "flex", alignItems: "center", padding: "0 34px", gap: 12, background: UI.panelBg, flexShrink: 0 } },
                React.createElement("div", { style: { fontSize: 13, fontWeight: 780, color: C.text, letterSpacing: 0.1 } }, tab === "today" ? "Main" : tab === "tasks" ? "Tasks" : tab === "calendar" ? "Calendar" : tab === "meds" ? "Meds" : tab === "sync" ? "Sync" : "Notes"),
                React.createElement("div", { style: { flex: 1 } }),
                searchOpen && React.createElement("input", { ref: searchRef, "data-no-swipe-back": "true", placeholder: "Search tasks, notes, events...", value: searchQuery, onChange: e => setSearchQuery(e.target.value), style: { ...inp, width: 320, padding: "7px 14px", border: `1px solid ${C.accent}44` } }),
                React.createElement("button", { onClick: () => { searchOpen ? closeSearch() : openSearch(); }, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${searchOpen ? C.accent : C.border}`, background: searchOpen ? C.accent + "22" : C.bg2, cursor: "pointer", color: searchOpen ? C.accent : C.muted, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" } }, "🔍")),
            tab === "tasks" && taskProgressTotal > 0 && React.createElement("div", { style: { maxWidth: 760, margin: "16px auto 0", padding: "0 24px" } }, React.createElement("div", { style: cardSurface({ padding: "10px 14px", borderRadius: 16 }) },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.2 } },
                    React.createElement("span", null, taskProgressLabel),
                    React.createElement("span", { style: { color: taskProgressPct === 100 ? C.green : C.accent } }, taskProgressPct, "% — ", taskProgressDone, "/", taskProgressTotal)),
                React.createElement("div", { style: { height: 4, background: "rgba(255,255,255,0.10)", borderRadius: 4, overflow: "hidden" } },
                    React.createElement("div", { style: { height: "100%", borderRadius: 4, background: taskProgressPct === 100 ? C.green : C.accent, width: `${taskProgressPct}%`, transition: "width 0.5s cubic-bezier(.4,2,.6,1)" } })))),
            React.createElement("div", { style: { height: "calc(100dvh - 58px)", overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "24px 24px 96px", boxSizing: "border-box" } },
                React.createElement("div", { style: { maxWidth: 760, margin: "0 auto" } }, content)),
            tab !== "today" && !searchOpen && !(tab === "notes" && noteView === "view") && React.createElement("button", { onClick: primaryAction, style: { position: "absolute", bottom: 30, right: 30, width: 56, height: 56, borderRadius: "50%", background: tab === "sync" ? C.amber : C.accent, border: `1px solid rgba(255,255,255,0.16)`, cursor: "pointer", fontSize: 25, color: C.text, fontWeight: 900, boxShadow: "0 10px 24px rgba(0,0,0,0.22)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 } }, tab === "sync" ? "↗" : "+"),
            renderUndoToast(),
            lightboxImage && React.createElement("div", { onClick: () => setLightboxImage(null), style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 } },
                React.createElement("button", { onClick: () => setLightboxImage(null), style: { position: "absolute", top: 18, right: 18, width: 38, height: 38, borderRadius: 19, border: "none", background: C.bg2, color: C.text, fontSize: 22, fontWeight: 800, cursor: "pointer" } }, "×"),
                React.createElement("img", { src: lightboxImage, alt: "", onClick: e => e.stopPropagation(), style: { maxWidth: "100%", maxHeight: "86dvh", objectFit: "contain", borderRadius: 12 } }))));
    }
    // ── PHONE LAYOUT (<640px) ──────────────────────────────────────────────────
    const phoneContent = searchOpen
        ? React.createElement(React.Fragment, null, renderSearchBackButton(), tabContent)
        : tab === "tasks"
            ? React.createElement(React.Fragment, null, renderTopLevelBackButton(), renderTasksTabContent())
            : React.createElement(React.Fragment, null, renderTopLevelBackButton(), tabContent);
    return (React.createElement("div", { onTouchStart: handleSwipeBackStart, onTouchMove: handleSwipeBackMove, onTouchEnd: handleSwipeBackEnd, onTouchCancel: handleSwipeBackEnd, style: { height: "100%", minHeight: "100%", width: "100%", background: UI.appBg, display: "flex", flexDirection: "column", position: "relative", fontFamily: UI.font, overflow: "hidden", transform: swipeOffset ? `translateX(${swipeOffset}px)` : "none", transition: swipeOffset ? "none" : "transform 0.18s ease" } },
        tab !== "today" && React.createElement("div", { style: { margin: "8px 14px 0", display: "flex", justifyContent: "flex-end", alignItems: "center" } },
            React.createElement("button", { onClick: () => { searchOpen ? closeSearch() : openSearch(); }, style: controlSurface({ width: 44, height: 44, borderRadius: 16, border: `1px solid ${searchOpen ? C.accent + "66" : UI.border}`, background: searchOpen ? C.accent + "22" : UI.controlBg, cursor: "pointer", color: searchOpen ? C.accent : C.muted, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }) }, "🔍")),
        tab === "tasks" && taskProgressTotal > 0 && (React.createElement("div", { style: cardSurface({ margin: tab === "today" ? "10px 14px 0" : "10px 14px 0", padding: "10px 14px", borderRadius: 16 }) },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.4 } },
                React.createElement("span", null, taskProgressLabel),
                React.createElement("span", { style: { color: taskProgressPct === 100 ? C.green : C.accent } },
                    taskProgressPct,
                    "% — ",
                    taskProgressDone,
                    "/",
                    taskProgressTotal)),
            React.createElement("div", { style: { height: 4, background: "rgba(255,255,255,0.10)", borderRadius: 4, overflow: "hidden" } },
                React.createElement("div", { style: { height: "100%", borderRadius: 4, background: taskProgressPct === 100 ? C.green : C.accent, width: `${taskProgressPct}%`, transition: "width 0.5s cubic-bezier(.4,2,.6,1)", boxShadow: "none" } })))),
        searchOpen && (React.createElement("div", { style: { margin: "8px 16px 0" } },
            React.createElement("input", { ref: searchRef, "data-no-swipe-back": "true", placeholder: "Search tasks, notes, events...", value: searchQuery, onChange: e => setSearchQuery(e.target.value), style: { ...inp, border: `1px solid ${C.accent}66` } }))),
        React.createElement("div", { style: { flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: tab === "today" ? "20px 14px 34px" : "14px 14px 106px" } }, phoneContent),
        tab !== "today" && !searchOpen && !(tab === "notes" && noteView === "view") && React.createElement("button", { onClick: primaryAction, style: { position: "absolute", bottom: 30, right: 20, width: 52, height: 52, borderRadius: "50%", background: tab === "sync" ? C.amber : C.accent, border: `1px solid rgba(255,255,255,0.16)`, cursor: "pointer", fontSize: 24, color: C.text, fontWeight: 900, boxShadow: "0 10px 24px rgba(0,0,0,0.22)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 } }, tab === "sync" ? "↗" : "+"),
        renderUndoToast(),
        lightboxImage && React.createElement("div", { onClick: () => setLightboxImage(null), style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 } },
            React.createElement("button", { onClick: () => setLightboxImage(null), style: { position: "absolute", top: "calc(18px + env(safe-area-inset-top, 0px))", right: 18, width: 38, height: 38, borderRadius: 19, border: "none", background: C.bg2, color: C.text, fontSize: 22, fontWeight: 800, cursor: "pointer" } }, "×"),
            React.createElement("img", { src: lightboxImage, alt: "", onClick: e => e.stopPropagation(), style: { maxWidth: "100%", maxHeight: "86dvh", objectFit: "contain", borderRadius: 12 } }))));
}


ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
