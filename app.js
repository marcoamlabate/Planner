const { useState, useRef, useEffect, useMemo } = React;
const C = {
    bg0: "#0A0A0C", bg1: "#111115", bg2: "#18181F", bg3: "#22222C", bg4: "#2C2C38",
    border: "#2E2E3A", accent: "#00C2FF", accentD: "#0090CC",
    green: "#1EDF80", amber: "#F5A623", red: "#FF4444",
    text: "#E8E8F0", muted: "#6B6B80", dim: "#3A3A48",
};
const ACCENT_COLORS = ["#00C2FF", "#1EDF80", "#F5A623", "#FF4444", "#A78BFA", "#F97316", "#06B6D4", "#84CC16"];
const PRIORITY = {
    high: { label: "HIGH", icon: "▲", color: C.red, bg: "#FF44441A" },
    medium: { label: "MED", icon: "●", color: C.amber, bg: "#F5A6231A" },
    low: { label: "LOW", icon: "▼", color: C.green, bg: "#1EDF801A" },
};
const DAYS_S = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_L = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
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
    useEffect(() => { try {
        localStorage.setItem(key, JSON.stringify(val));
    }
    catch { } }, [key, val]);
    return [val, setVal];
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
    width: "100%", background: C.bg3, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "10px 14px", fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace", color: C.text, outline: "none", boxSizing: "border-box",
};
const DEFAULT_CATEGORIES = [
    { id: "personal", name: "Personal", color: "#A78BFA" },
    { id: "work", name: "Work", color: "#F97316" },
    { id: "college", name: "College", color: "#06B6D4" },
];
const DEFAULT_FOLDERS = [{ id: "general", name: "General", color: "#00C2FF" }];

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
function stripHeavyDetails(item) {
    return { ...item, description: "", imageUrl: "", imageUrls: [] };
}
function compactDoneTaskRecord(task) {
    if (!task || !task.done || (!task.description && getImages(task).length === 0))
        return task;
    return stripHeavyDetails(task);
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
function ImageUploadBtn({ value, onChange }) {
    const ref = useRef(null);
    return (React.createElement("div", { style: { marginBottom: 10 } },
        React.createElement("input", { ref: ref, type: "file", accept: "image/*", style: { display: "none" }, onChange: async (e) => { var _a; const f = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]; if (f)
                onChange(await readImageFile(f)); } }),
        value ? (React.createElement("div", { style: { position: "relative", display: "inline-block" } },
            React.createElement("img", { src: value, alt: "", onClick: () => openPlannerImage(value), style: { maxWidth: "100%", borderRadius: 10, maxHeight: 150, objectFit: "cover", display: "block" } }),
            React.createElement("button", { onClick: () => onChange(""), style: { position: "absolute", top: 4, right: 4, background: "#00000088", border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 14 } }, "\u00D7"))) : (React.createElement("button", { onClick: () => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { padding: "7px 12px", borderRadius: 8, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.muted, fontSize: 10, fontFamily: "inherit", fontWeight: 700, letterSpacing: 1 } }, "+ ADD IMAGE"))));
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
        React.createElement("button", { onClick: () => { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { padding: "7px 12px", borderRadius: 8, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.muted, fontSize: 10, fontFamily: "inherit", fontWeight: 700, letterSpacing: 1 } }, images.length ? "+ ADD MORE IMAGES" : "+ ADD IMAGES")));
}
function CatPill({ label, active, color, onClick }) {
    return React.createElement("button", { onClick: onClick, style: { padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", background: active ? color : C.bg3, color: active ? C.bg0 : color, fontWeight: 700, fontSize: 9, fontFamily: "inherit", letterSpacing: 1 } }, label);
}
function SectionHeader({ icon, label, color }) {
    return (React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 9, fontWeight: 700, letterSpacing: 3, color, marginBottom: 8 } },
        React.createElement("span", null, icon),
        React.createElement("span", null, label),
        React.createElement("div", { style: { flex: 1, height: 1, background: color + "33" } })));
}
function openPlannerImage(url) {
    if (url)
        window.dispatchEvent(new CustomEvent("planner-lightbox", { detail: url }));
}

function EventViewPanel({ a, onBack, onEdit, onExport }) {
    if (!a)
        return React.createElement("div", null);
    const d = new Date(a.date + "T12:00:00");
    return React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, borderLeft: `3px solid ${a.color}`, marginTop: 10, marginBottom: 12, boxShadow: `0 0 18px ${a.color}22` } },
        React.createElement("button", { onClick: onBack, style: { background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1, marginBottom: 12, padding: 0 } }, "← BACK"),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 8 } },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 18, fontWeight: 800, color: a.color, lineHeight: 1.3, marginBottom: 5 } }, a.title),
                React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 1, lineHeight: 1.6 } }, d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })),
                (a.time || a.endTime) && React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 1, lineHeight: 1.6 } }, a.time || "No start", a.endTime ? ` – ${a.endTime}` : "")),
            React.createElement("button", { onClick: () => onEdit(a), style: { padding: "7px 12px", borderRadius: 9, border: "none", background: C.accent, color: C.bg0, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 1 } }, "EDIT")),
        React.createElement("button", { onClick: () => exportEventToApple(a), style: { width: "100%", padding: 10, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, marginTop: 8 } }, "SEND TO APPLE CALENDAR"),
                    getImages(a).length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, margin: "12px 0" } }, getImages(a).map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1", borderRadius: 10, objectFit: "cover", display: "block", cursor: "zoom-in" } }))),
        React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 12 } }, a.description || "No description."));
}

function TaskCard({ task, categories, onToggle, onDelete, onEdit, onToggleSubtask, onAddSubtask, onExport }) {
    var _a, _b;
    const [expanded, setExpanded] = useState(false);
    const [newSub, setNewSub] = useState("");
    const p = PRIORITY[task.priority];
    const cat = categories.find(c => c.id === task.categoryId);
    const subs = (_a = task.subtasks) !== null && _a !== void 0 ? _a : [];
    const subDone = subs.filter(s => s.done).length;
    const isOverdue = !task.done && task.dueDate && task.dueDate < todayStr();
    const isToday = !task.done && isTodayStr(task.dueDate);
    const recurLabel = { daily: "↺ DAILY", weekly: "↺ WEEKLY", monthly: "↺ MONTHLY" };
    const taskImages = getImages(task);
    const hasExtra = !!(task.description || taskImages.length || subs.length);
    return (React.createElement("div", { style: { background: C.bg2, borderRadius: 12, padding: "12px 14px", marginBottom: 6, border: `1px solid ${C.border}`, borderLeft: task.done ? `2px solid ${C.dim}` : isOverdue ? `2px solid ${C.red}` : `2px solid ${p.color}`, opacity: task.done ? 0.45 : 1, transition: "opacity 0.3s" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            React.createElement("button", { onClick: () => onToggle(task.id), style: { width: 22, height: 22, borderRadius: 6, border: task.done ? "none" : `1px solid ${isOverdue ? C.red : p.color}66`, background: task.done ? C.green : "transparent", cursor: "pointer", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg0, fontWeight: 800, boxShadow: task.done ? `0 0 8px ${C.green}55` : "none" } }, task.done ? "✓" : ""),
            React.createElement("div", { style: { flex: 1, cursor: "pointer" }, onClick: () => hasExtra && setExpanded(!expanded) },
                React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none", letterSpacing: 0.3 } }, task.text),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 3, alignItems: "center", flexWrap: "wrap" } },
                    !task.done && React.createElement("span", { style: { fontSize: 9, fontWeight: 700, color: isOverdue ? C.red : isToday ? C.green : p.color, letterSpacing: 2 } }, isOverdue ? "⚠ OVERDUE" : isToday ? "● TODAY" : `${p.icon} ${p.label}`),
                    cat && React.createElement("span", { style: { fontSize: 9, fontWeight: 700, color: cat.color, background: cat.color + "18", padding: "1px 6px", borderRadius: 10, letterSpacing: 1 } }, cat.name),
                    task.dueDate && !task.done && React.createElement("span", { style: { fontSize: 9, color: isOverdue ? C.red : isToday ? C.green : C.muted, letterSpacing: 1 } },
                        "\uD83D\uDCC5 ",
                        formatBrDate(task.dueDate)),
                    ((_b = task.recurrence) !== null && _b !== void 0 ? _b : "none") !== "none" && !task.done && React.createElement("span", { style: { fontSize: 9, color: C.accent, fontWeight: 700, letterSpacing: 1 } }, recurLabel[task.recurrence]),
                    subs.length > 0 && React.createElement("span", { style: { fontSize: 9, color: subDone === subs.length ? C.green : C.muted, letterSpacing: 1 } },
                        "\u2611 ",
                        subDone,
                        "/",
                        subs.length),
                    hasExtra && React.createElement("span", { style: { fontSize: 9, color: C.dim } }, expanded ? "▲" : "▼"))),
            React.createElement("div", { style: { display: "flex", gap: 4, flexShrink: 0 } },
                onExport && React.createElement("button", { onClick: () => onExport(task), title: "Send to Apple Reminders", style: { background: C.bg3, border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: C.green, fontWeight: 900, fontSize: 12 } }, "↗"),
                React.createElement("button", { onClick: () => onEdit(task), style: { background: C.bg3, border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 11 } }, "\u270E"),
                React.createElement("button", { onClick: () => onDelete(task.id), style: { background: "#FF44441A", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 13 } }, "\u00D7"))),
        expanded && (React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` } },
            task.description && React.createElement("div", { style: { fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 8 } }, task.description),
            taskImages.length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 } }, taskImages.map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1", borderRadius: 8, objectFit: "cover", display: "block", cursor: "zoom-in" } }))),
            subs.length > 0 && (React.createElement("div", { style: { marginBottom: 8 } }, subs.map(s => (React.createElement("div", { key: s.id, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 } },
                React.createElement("button", { onClick: () => onToggleSubtask(task.id, s.id), style: { width: 18, height: 18, borderRadius: 4, border: s.done ? "none" : `1px solid ${C.dim}`, background: s.done ? C.green : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.bg0, fontWeight: 700, fontSize: 10 } }, s.done ? "✓" : ""),
                React.createElement("span", { style: { fontSize: 12, color: s.done ? C.dim : C.muted, textDecoration: s.done ? "line-through" : "none" } }, s.text)))))),
            React.createElement("div", { style: { display: "flex", gap: 6 } },
                React.createElement("input", { placeholder: "Add subtask...", value: newSub, onChange: e => setNewSub(e.target.value), onKeyDown: e => { if (e.key === "Enter" && newSub.trim()) {
                        onAddSubtask(task.id, newSub.trim());
                        setNewSub("");
                    } }, style: { ...inp, flex: 1, padding: "6px 10px", fontSize: 11 } }),
                React.createElement("button", { onClick: () => { if (newSub.trim()) {
                        onAddSubtask(task.id, newSub.trim());
                        setNewSub("");
                    } }, style: { padding: "6px 10px", borderRadius: 8, border: "none", background: C.accent, color: C.bg0, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" } }, "+"))))));
}
function ApptCard({ appt, onDelete, onEdit, onExport }) {
    const [expanded, setExpanded] = useState(false);
    const d = new Date(appt.date + "T12:00:00");
    const apptImages = getImages(appt);
    const hasExtra = !!(appt.description || apptImages.length);
    const recurLabel = { daily: "↺ DAILY", weekly: "↺ WEEKLY", monthly: "↺ MONTHLY" };
    return (React.createElement("div", { style: { background: C.bg2, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${C.border}`, borderLeft: `2px solid ${appt.color}` } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
            React.createElement("div", { style: { background: appt.color + "18", borderRadius: 8, padding: "6px 8px", textAlign: "center", minWidth: 38, flexShrink: 0, cursor: hasExtra ? "pointer" : "default" }, onClick: () => hasExtra && setExpanded(!expanded) },
                React.createElement("div", { style: { fontSize: 8, fontWeight: 700, color: appt.color, letterSpacing: 1 } }, MONTHS[d.getMonth()]),
                React.createElement("div", { style: { fontSize: 20, fontWeight: 900, color: appt.color, lineHeight: 1.1 } }, d.getDate())),
            React.createElement("div", { style: { flex: 1, cursor: hasExtra ? "pointer" : "default" }, onClick: () => hasExtra && setExpanded(!expanded) },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: C.text } }, appt.title),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap", alignItems: "center" } },
                    appt.time && React.createElement("span", { style: { fontSize: 10, color: C.muted, letterSpacing: 1 } }, appt.time + (appt.endTime ? `–${appt.endTime}` : "")),
                    appt.recurrence !== "none" && React.createElement("span", { style: { fontSize: 9, color: appt.color, fontWeight: 700, letterSpacing: 1 } }, recurLabel[appt.recurrence]),
                    hasExtra && React.createElement("span", { style: { fontSize: 9, color: C.dim } }, expanded ? "▲ less" : "▼ more"))),
            React.createElement("div", { style: { display: "flex", gap: 4, flexShrink: 0 } },
                onExport && React.createElement("button", { onClick: () => onExport(appt), title: "Send to Apple Calendar", style: { background: C.bg3, border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: C.green, fontWeight: 900, fontSize: 12 } }, "↗"),
                React.createElement("button", { onClick: () => onEdit(appt), style: { background: C.bg3, border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 11 } }, "\u270E"),
                React.createElement("button", { onClick: () => onDelete(appt.id), style: { background: "#FF44441A", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 13 } }, "\u00D7"))),
        expanded && hasExtra && (React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` } },
            appt.description && React.createElement("div", { style: { fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: apptImages.length ? 8 : 0 } }, appt.description),
            apptImages.length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: appt.description ? 8 : 0 } }, apptImages.map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1", borderRadius: 8, objectFit: "cover", display: "block", cursor: "zoom-in" } })))))));
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
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 4 } }, "// DAY TIMELINE"),
                React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: 1.5 } }, date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }).toUpperCase())),
            React.createElement("div", { style: { fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1 } }, sorted.length, " EVENT", sorted.length === 1 ? "" : "S")),
        noTime.length > 0 && React.createElement("div", { style: { marginBottom: 10 } },
            React.createElement("div", { style: { fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: 2, marginBottom: 6 } }, "NO TIME"),
            noTime.map(a => React.createElement(React.Fragment, { key: a.id }, React.createElement(ApptCard, { appt: a, onDelete: onDelete, onEdit: onEdit, onExport: onExport }), selectedApptId === a.id && React.createElement(EventViewPanel, { a: a, onBack: onBack, onEdit: onRealEdit || onEdit, onExport: onExport })))),
        timed.length === 0 ? React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "12px 0" } }, noTime.length ? "" : "No timed events.")
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
                        React.createElement("div", { onClick: () => onEdit(a), style: { position: "absolute", top, left: 12 + slightOffset, right: 0, minHeight: height, borderRadius: 10, background: a.color + "33", border: `1px solid ${a.color}55`, borderLeft: `4px solid ${a.color}`, boxShadow: `0 0 16px ${a.color}22`, padding: "9px 10px", cursor: "pointer", overflow: "hidden" } },
                            React.createElement("button", { onClick: e => { e.stopPropagation(); onDelete(a.id); }, style: { position: "absolute", right: 7, top: 6, background: "transparent", border: "none", color: a.color, fontWeight: 900, fontSize: 13, cursor: "pointer" } }, "\u00d7"),
                            React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: a.color, lineHeight: 1.25, paddingRight: 18 } }, a.title),
                            React.createElement("div", { style: { fontSize: 10, color: a.color, marginTop: 3, fontWeight: 700, letterSpacing: 0.5 } }, a.time, a.endTime ? ` \u2013 ${a.endTime}` : ""),
                            a.description && height > 64 && React.createElement("div", { style: { fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } }, a.description)),
                        selectedApptId === a.id && React.createElement("div", { style: { position: "absolute", top: top + height + 8, left: 0, right: 0, zIndex: 30 } },
                            React.createElement(EventViewPanel, { a: a, onBack: onBack, onEdit: onRealEdit || onEdit, onExport: onExport })));
                }))));
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
        React.createElement("div", { style: { width: "100%", background: C.bg2, borderRadius: "24px 24px 0 0", padding: "20px 16px 36px", border: `1px solid ${C.border}` }, onClick: e => e.stopPropagation() },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent } }, "// QUICK CAPTURE"),
                React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", fontWeight: 700 } }, "\u00D7")),
            React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 12, background: C.bg3, borderRadius: 10, padding: 3 } }, [["task", "⊡ TASK"], ["note", "≡ NOTE"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setType(k), style: { flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, fontFamily: "inherit", background: type === k ? C.accent : "transparent", color: type === k ? C.bg0 : C.muted } }, l)))),
            React.createElement("input", { ref: ref, placeholder: type === "task" ? "What needs doing?" : "Note title...", value: text, onChange: e => setText(e.target.value), onKeyDown: e => e.key === "Enter" && save(), style: { ...inp, marginBottom: 10 } }),
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" } }, type === "task"
                ? categories.map(c => React.createElement(CatPill, { key: c.id, label: c.name.toUpperCase(), active: catId === c.id, color: c.color, onClick: () => setCatId(c.id) }))
                : folders.map(f => React.createElement(CatPill, { key: f.id, label: f.name.toUpperCase(), active: folderId === f.id, color: f.color, onClick: () => setFolderId(f.id) }))),
            React.createElement("button", { onClick: save, style: { width: "100%", padding: 12, borderRadius: 12, border: "none", background: C.accent, color: C.bg0, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, boxShadow: `0 0 20px ${C.accent}55` } }, "CAPTURE"))));
}
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
    var _a, _b, _c, _d;
    const windowWidth = useWindowWidth();
    const isWide = windowWidth >= 640;
    const [tab, setTab] = useState("tasks");
    const [motivation, setMotivation] = useLocalState("adhd3_mot", "don’t interact with your mind, command it");
    const [focusColor, setFocusColor] = useLocalState("adhd3_focus_color", C.text);
    const [editMot, setEditMot] = useState(false);
    const [motDraft, setMotDraft] = useState("");
    const motRef = useRef(null);
    const today = new Date();
    useEffect(() => { if (motivation === "Lock in. Every task done is a win.") setMotivation("don’t interact with your mind, command it"); }, []);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef(null);
    const [showCapture, setShowCapture] = useState(false);
    const importRef = useRef(null);
    const [reviewDraft, setReviewDraft] = useState({ done: "", move: "", tomorrow: "" });
    const [reviews, setReviews] = useLocalState("adhd3_reviews", []);
    const [rawTasks, setTasks] = useLocalState("adhd3_tasks", []);
    const tasks = rawTasks.map(t => ({ dueDate: "", recurrence: "none", subtasks: [], imageUrls: [], ...t, imageUrls: getImages(t) }));
    useEffect(() => { setTasks(p => compactStoredRecords(p, compactDoneTaskRecord)); }, [rawTasks]);
    const [categories, setCategories] = useLocalState("adhd3_cats", DEFAULT_CATEGORIES);
    const [taskCatFilter, setTaskCatFilter] = useState("all");
    const [taskViewFilter, setTaskViewFilter] = useState("all");
    const [taskSort, setTaskSort] = useState("priority");
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [showCatMgr, setShowCatMgr] = useState(false);
    const [catDraft, setCatDraft] = useState({ name: "", color: ACCENT_COLORS[4] });
    const emptyTask = () => { var _a, _b; return ({ text: "", description: "", priority: "medium", categoryId: (_b = (_a = categories[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "personal", imageUrl: "", imageUrls: [], dueDate: "", recurrence: "none", subtasks: [] }); };
    const [taskDraft, setTaskDraft] = useState(emptyTask);
    const [rawAppts, setAppts] = useLocalState("adhd3_appts", []);
    const appts = rawAppts.map(a => ({ endTime: "", recurrence: "none", imageUrls: [], ...a, imageUrls: getImages(a) }));
    useEffect(() => { setAppts(p => compactStoredRecords(p, compactPastApptRecord)); }, [rawAppts]);
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
    const emptyAppt = () => ({ title: "", date: "", time: "", endTime: "", color: C.accent, description: "", imageUrl: "", imageUrls: [], recurrence: "none" });
    const [apptDraft, setApptDraft] = useState(emptyAppt);
    const [notes, setNotes] = useLocalState("adhd3_notes", []);
    const [folders, setFolders] = useLocalState("adhd3_folders", DEFAULT_FOLDERS);
    const [selFolderId, setSelFolderId] = useState(null);
    const [noteView, setNoteView] = useState("list");
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [showFolderMgr, setShowFolderMgr] = useState(false);
    const [folderDraft, setFolderDraft] = useState({ name: "", color: ACCENT_COLORS[0] });
    const emptyNote = () => { var _a, _b; return ({ title: "", type: "descriptive", content: "", topics: [""], folderId: (_b = (_a = folders[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "general", imageUrl: "", imageUrls: [] }); };
    const [noteDraft, setNoteDraft] = useState(emptyNote);
    function startEditMot() { setMotDraft(motivation); setEditMot(true); setTimeout(() => { var _a; return (_a = motRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 50); }
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
            tasks: tasks.filter(t => { var _a; return t.text.toLowerCase().includes(q) || ((_a = t.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q)); }),
            appts: appts.filter(a => { var _a; return a.title.toLowerCase().includes(q) || ((_a = a.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q)); }),
            notes: notes.filter(n => { var _a, _b; return n.title.toLowerCase().includes(q) || ((_a = n.content) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q)) || ((_b = n.topics) === null || _b === void 0 ? void 0 : _b.some(t => t.toLowerCase().includes(q))); }),
        };
    }, [searchQuery, rawTasks, rawAppts, notes]);
    function openAddTask() { setTaskDraft(emptyTask()); setEditingTaskId(null); setShowTaskForm(true); }
    function openEditTask(t) {
        var _a, _b, _c;
        setTaskDraft({ text: t.text, description: t.description, priority: t.priority, categoryId: t.categoryId, imageUrl: getImages(t)[0] || "", imageUrls: getImages(t), dueDate: (_a = t.dueDate) !== null && _a !== void 0 ? _a : "", recurrence: (_b = t.recurrence) !== null && _b !== void 0 ? _b : "none", subtasks: (_c = t.subtasks) !== null && _c !== void 0 ? _c : [] });
        setEditingTaskId(t.id);
        setShowTaskForm(true);
    }
    function saveTask() {
        if (!taskDraft.text.trim())
            return null;
        const saved = editingTaskId !== null ? { id: editingTaskId, done: false, ...taskDraft } : { id: Date.now(), done: false, ...taskDraft };
        if (editingTaskId !== null)
            setTasks((p) => p.map(t => t.id === editingTaskId ? { ...t, ...taskDraft } : t));
        else
            setTasks((p) => [...p, saved]);
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
        setTasks((p) => p.map(t => {
            var _a;
            if (t.id !== id)
                return t;
            const recurrence = (_a = t.recurrence) !== null && _a !== void 0 ? _a : "none";
            if (!t.done && recurrence !== "none" && t.dueDate) {
                return { ...t, dueDate: nextDueDate(t.dueDate, recurrence), done: false };
            }
            const next = { ...t, done: !t.done };
            return next.done ? compactDoneTaskRecord(next) : next;
        }));
    }
    function deleteTask(id) { setTasks((p) => p.filter(t => t.id !== id)); }
    function toggleSubtask(taskId, subId) {
        setTasks((p) => p.map(t => { var _a; return t.id === taskId ? { ...t, subtasks: ((_a = t.subtasks) !== null && _a !== void 0 ? _a : []).map((s) => s.id === subId ? { ...s, done: !s.done } : s) } : t; }));
    }
    function addSubtask(taskId, text) {
        setTasks((p) => p.map(t => { var _a; return t.id === taskId ? { ...t, subtasks: [...((_a = t.subtasks) !== null && _a !== void 0 ? _a : []), { id: Date.now(), text, done: false }] } : t; }));
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
        setCategories(p => p.filter(c => c.id !== id));
        setTasks((p) => p.map(t => { var _a, _b; return t.categoryId === id ? { ...t, categoryId: (_b = (_a = categories[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "personal" } : t; }));
    }
    function quickAddTask(text, categoryId) {
        setTasks((p) => [...p, { id: Date.now(), text, description: "", priority: "medium", done: false, categoryId, imageUrl: "", imageUrls: [], dueDate: "", recurrence: "none", subtasks: [] }]);
    }
    function openAddAppt() {
        const draft = emptyAppt();
        let selected = null;
        if (selWeekDay)
            selected = selWeekDay;
        else if (selDay)
            selected = new Date(calYear, calMonth, selDay);
        if (selected)
            draft.date = dateToLocalStr(selected);
        setApptDraft(draft);
        setSelectedApptId(null);
        setEditingApptId(null);
        setShowApptForm(true);
    }
    function openEditAppt(a) {
        var _a;
        setApptDraft({ title: a.title, date: a.date, time: a.time, endTime: a.endTime || "", color: a.color, description: a.description, imageUrl: getImages(a)[0] || "", imageUrls: getImages(a), recurrence: (_a = a.recurrence) !== null && _a !== void 0 ? _a : "none" });
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
        const saved = editingApptId !== null ? { id: editingApptId, ...apptDraft } : { id: Date.now(), ...apptDraft };
        if (editingApptId !== null)
            setAppts((p) => p.map(a => a.id === editingApptId ? { ...a, ...apptDraft } : a));
        else
            setAppts((p) => [...p, saved]);
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
    function deleteAppt(id) { setAppts((p) => p.filter(a => a.id !== id)); }
    function toggleColorFilter(c) { setApptColorFilter(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; }); }
    const filteredAppts = apptColorFilter.size === 0 ? appts : appts.filter(a => apptColorFilter.has(a.color));

    function plannerId(type, id) {
        return "planner-" + type + "-" + id;
    }
    function plannerTaskPayload(t) {
        const cat = categories.find(c => c.id === t.categoryId);
        const dueDate = t.dueDate || "";
        const dueDateTime = dueDate ? `${dueDate}T09:00:00` : "";
        const dueDateText = dueDate ? shortcutFriendlyDateTime(dueDate, "09:00") : "";
        const notes = [
            t.description || "",
            cat ? "Category: " + cat.name : "",
            t.priority ? "Priority: " + String(t.priority).charAt(0).toUpperCase() + String(t.priority).slice(1).toLowerCase() : "",
            dueDate ? "Planner Due Date: " + dueDate : "",
            dueDateText ? "Planner Due Date Text: " + dueDateText : "",
            "Planner ID: " + plannerId("task", t.id)
        ].filter(Boolean).join("\n\n");
        return {
            type: "task",
            plannerId: plannerId("task", t.id),
            title: t.text || "Untitled task",
            notes,
            dueDate,
            dueDateTime,
            dueDateText,
            priority: t.priority || "medium",
            completed: !!t.done
        };
    }
    function plannerEventPayload(a) {
        const startTime = a.time || "";
        const endTime = a.endTime || "";
        const fallbackEnd = startTime ? minutesToTime((timeToMinutes(startTime) ?? 0) + 60) : "";
        const cleanEndTime = endTime || fallbackEnd;
        const startDateTime = a.date && startTime ? `${a.date}T${startTime}:00` : "";
        const endDateTime = a.date && cleanEndTime ? `${a.date}T${cleanEndTime}:00` : "";
        const startDateText = a.date && startTime ? shortcutFriendlyDateTime(a.date, startTime) : "";
        const endDateText = a.date && cleanEndTime ? shortcutFriendlyDateTime(a.date, cleanEndTime) : "";
        const notes = [
            a.description || "",
            a.recurrence && a.recurrence !== "none" ? "Recurrence: " + a.recurrence : "",
            startDateTime ? "Planner Start: " + startDateTime : "",
            endDateTime ? "Planner End: " + endDateTime : "",
            startDateText ? "Planner Start Text: " + startDateText : "",
            endDateText ? "Planner End Text: " + endDateText : "",
            "Planner ID: " + plannerId("event", a.id)
        ].filter(Boolean).join("\n\n");
        return {
            type: "event",
            plannerId: plannerId("event", a.id),
            title: a.title || "Untitled event",
            notes,
            date: a.date || "",
            startTime,
            endTime: cleanEndTime,
            startDateTime,
            endDateTime,
            startDateText,
            endDateText,
            recurrence: a.recurrence || "none"
        };
    }
    async function runPlannerShortcut(items) {
        const cleanItems = (Array.isArray(items) ? items : [items]).filter(Boolean);
        if (!cleanItems.length) {
            alert("Nothing to export.");
            return;
        }
        const payload = JSON.stringify({
            source: "ADHD Planner",
            exportVersion: 1,
            exportedAt: new Date().toISOString(),
            items: cleanItems
        });
        const name = encodeURIComponent("Planner Import");
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(payload);
                window.location.href = "shortcuts://run-shortcut?name=" + name + "&input=clipboard";
                return;
            }
        }
        catch (err) {
            console.warn("[Planner] Clipboard export failed, falling back to URL text.", err);
        }
        if (payload.length > 6500) {
            alert("This bulk export is too large for URL export. Try exporting fewer items, or allow clipboard access and try again.");
            return;
        }
        window.location.href = "shortcuts://run-shortcut?name=" + name + "&input=text&text=" + encodeURIComponent(payload);
    }
    function exportTaskToApple(t) {
        runPlannerShortcut(plannerTaskPayload(t));
    }
    function exportEventToApple(a) {
        runPlannerShortcut(plannerEventPayload(a));
    }
    function bulkExportTasksToApple() {
        runPlannerShortcut(tasks.filter(t => !t.done).map(plannerTaskPayload));
    }
    function bulkExportEventsToApple() {
        runPlannerShortcut(appts.filter(a => a.date && (a.date >= todayStr() || ((a.recurrence || "none") !== "none"))).map(plannerEventPayload));
    }
    function bulkExportPlannerToApple() {
        const openTasks = tasks.filter(t => !t.done).map(plannerTaskPayload);
        const upcomingEvents = appts.filter(a => a.date && (a.date >= todayStr() || ((a.recurrence || "none") !== "none"))).map(plannerEventPayload);
        runPlannerShortcut([...openTasks, ...upcomingEvents]);
    }

    function openAddNote() { setNoteDraft(emptyNote()); setEditingNoteId(null); setSelectedNoteId(null); setNoteView("edit"); }
    function openEditNote(n) {
        setNoteDraft({ title: n.title, type: n.type, content: n.content, topics: n.topics.length ? n.topics : [""], folderId: n.folderId, imageUrl: getImages(n)[0] || "", imageUrls: getImages(n) });
        setEditingNoteId(n.id);
        setNoteView("edit");
    }
    function openViewNote(n) {
        setSelectedNoteId(n.id);
        setNoteView("view");
    }
    function saveNote() {
        if (!noteDraft.title.trim())
            return;
        const now = Date.now();
        const rec = { ...noteDraft, topics: noteDraft.topics.filter(t => t.trim()) };
        if (editingNoteId !== null)
            setNotes(p => p.map(n => n.id === editingNoteId ? { ...n, ...rec } : n));
        else
            setNotes(p => [...p, { id: now, createdAt: now, ...rec }]);
        setNoteView("list");
        setEditingNoteId(null);
    }
    function deleteNote(id) { setNotes(p => p.filter(n => n.id !== id)); }
    function addFolder() {
        if (!folderDraft.name.trim())
            return;
        setFolders(p => [...p, { id: Date.now().toString(), name: folderDraft.name.trim(), color: folderDraft.color }]);
        setFolderDraft({ name: "", color: ACCENT_COLORS[0] });
    }
    function deleteFolder(id) {
        var _a, _b;
        const remaining = folders.filter(f => f.id !== id);
        const fallback = (_b = (_a = remaining[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "general";
        setFolders(p => p.filter(f => f.id !== id));
        setNotes(p => p.map(n => n.folderId === id ? { ...n, folderId: fallback } : n));
    }
    function quickAddNote(title, folderId) {
        const now = Date.now();
        setNotes(p => [...p, { id: now, createdAt: now, title, type: "descriptive", content: "", topics: [], folderId, imageUrl: "" }]);
    }
    function exportBackup() {
        const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            motivation, focusColor, tasks, categories, appts, notes, folders, reviews
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `adhd-planner-backup-${todayStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    async function importBackupFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.motivation)
                setMotivation(data.motivation);
            if (data.focusColor)
                setFocusColor(data.focusColor);
            if (Array.isArray(data.tasks))
                setTasks(data.tasks);
            if (Array.isArray(data.categories))
                setCategories(data.categories);
            if (Array.isArray(data.appts))
                setAppts(data.appts);
            if (Array.isArray(data.notes))
                setNotes(data.notes);
            if (Array.isArray(data.folders))
                setFolders(data.folders);
            if (Array.isArray(data.reviews))
                setReviews(data.reviews);
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
    const baseRelevantTasks = taskCatFilter === "all" ? tasks : tasks.filter(t => t.categoryId === taskCatFilter);
    const relevantTasks = [...baseRelevantTasks]
        .filter(t => taskViewFilter === "all" ? true
        : taskViewFilter === "today" ? !t.done && isTodayStr(t.dueDate)
            : taskViewFilter === "overdue" ? !t.done && t.dueDate && t.dueDate < todayStr()
                : taskViewFilter === "nodate" ? !t.done && !t.dueDate
                    : taskViewFilter === "high" ? !t.done && t.priority === "high"
                        : true)
        .sort((a, b) => {
        var _a, _b, _c, _d;
        if (taskSort === "due")
            return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
        if (taskSort === "category")
            return (((_a = categories.find(c => c.id === a.categoryId)) === null || _a === void 0 ? void 0 : _a.name) || "").localeCompare(((_b = categories.find(c => c.id === b.categoryId)) === null || _b === void 0 ? void 0 : _b.name) || "");
        const rank = { high: 0, medium: 1, low: 2 };
        return ((_c = rank[a.priority]) !== null && _c !== void 0 ? _c : 9) - ((_d = rank[b.priority]) !== null && _d !== void 0 ? _d : 9);
    });
    const todayTasks = [...tasks].filter(t => !t.done).sort((a, b) => {
        const ad = a.dueDate || "9999-99-99";
        const bd = b.dueDate || "9999-99-99";
        if (ad !== bd)
            return ad.localeCompare(bd);
        const rank = { high: 0, medium: 1, low: 2 };
        return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    });
    const todayAppts = appts.filter(a => occursOn(a, todayStr())).sort((a, b) => (timeToMinutes(a.time) ?? 9999) - (timeToMinutes(b.time) ?? 9999));
    const overdueTasks = relevantTasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr());
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const visibleNotes = (selFolderId ? notes.filter(n => n.folderId === selFolderId) : notes).sort((a, b) => b.createdAt - a.createdAt);
    // ── Shared tab content ─────────────────────────────────────────────────────
    const tabContent = (React.createElement(React.Fragment, null,
        searchOpen && searchQuery.trim() && searchResults && (React.createElement("div", null,
            searchResults.tasks.length === 0 && searchResults.appts.length === 0 && searchResults.notes.length === 0 && (React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: C.muted } },
                React.createElement("div", { style: { fontSize: 24, marginBottom: 8 } }, "\u2205"),
                React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: 2 } }, "NO RESULTS"))),
            searchResults.tasks.length > 0 && (React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement(SectionHeader, { icon: "\u22A1", label: "TASKS", color: C.accent }),
                searchResults.tasks.map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple })))),
            searchResults.appts.length > 0 && (React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement(SectionHeader, { icon: "\uD83D\uDCC5", label: "APPOINTMENTS", color: C.green }),
                searchResults.appts.map(a => React.createElement(ApptCard, { key: a.id, appt: a, onDelete: deleteAppt, onEdit: openViewAppt, onExport: exportEventToApple })))),
            searchResults.notes.length > 0 && (React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement(SectionHeader, { icon: "\u2261", label: "NOTES", color: C.amber }),
                searchResults.notes.map(n => {
                    var _a, _b, _c;
                    const folder = folders.find(f => f.id === n.folderId);
                    return (React.createElement("div", { key: n.id, onClick: () => { setTab("notes"); setNoteView("list"); setSearchOpen(false); setSearchQuery(""); openEditNote(n); }, style: { background: C.bg2, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${C.border}`, borderLeft: `2px solid ${(_a = folder === null || folder === void 0 ? void 0 : folder.color) !== null && _a !== void 0 ? _a : C.amber}`, cursor: "pointer" } },
                        React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: C.text } }, n.title),
                        React.createElement("div", { style: { fontSize: 9, color: (_b = folder === null || folder === void 0 ? void 0 : folder.color) !== null && _b !== void 0 ? _b : C.muted, fontWeight: 700, letterSpacing: 1, marginTop: 3 } }, (_c = folder === null || folder === void 0 ? void 0 : folder.name) !== null && _c !== void 0 ? _c : "General"),
                        n.content && React.createElement("div", { style: { fontSize: 11, color: C.muted, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } }, n.content)));
                }))))),
        !searchOpen && tab === "today" && (React.createElement("div", null,
            React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, marginBottom: 14 } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 8 } }, "// TODAY"),
                React.createElement("div", { style: { color: C.text, fontSize: 18, fontWeight: 800, letterSpacing: 2 } }, today.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).toUpperCase()),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" } },
                    React.createElement(CatPill, { label: `${todayTasks.length} OPEN TASKS`, active: true, color: todayTasks.length ? C.accent : C.dim, onClick: () => { setTab("tasks"); setTaskViewFilter("all"); } }),
                    React.createElement(CatPill, { label: `${todayAppts.length} EVENTS`, active: true, color: todayAppts.length ? C.green : C.dim, onClick: () => setTab("calendar") }),
                    React.createElement(CatPill, { label: `${tasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr()).length} OVERDUE`, active: true, color: tasks.some(t => !t.done && t.dueDate && t.dueDate < todayStr()) ? C.red : C.dim, onClick: () => { setTab("tasks"); setTaskViewFilter("overdue"); } }))),
            React.createElement(SectionHeader, { icon: "\u22A1", label: "TODAY'S TASKS", color: C.accent }),
            todayTasks.length ? todayTasks.map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple }))
                : React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "8px 0 16px" } }, "No open tasks."),
            React.createElement(SectionHeader, { icon: "\uD83D\uDCC5", label: "TODAY'S EVENTS", color: C.green }),
            todayAppts.length ? todayAppts.map(a => React.createElement(ApptCard, { key: a.id, appt: a, onDelete: deleteAppt, onEdit: openViewAppt, onExport: exportEventToApple }))
                : React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "8px 0 16px" } }, "No events today."),
            React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.green, marginBottom: 10 } }, "// BACKUP"),
                React.createElement("input", { ref: importRef, type: "file", accept: "application/json", style: { display: "none" }, onChange: e => { var _a; const f = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]; if (f)
                        importBackupFile(f); if (e.target)
                        e.target.value = ""; } }),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: exportBackup, style: { flex: 1, padding: 10, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 800, fontSize: 11, fontFamily: "inherit", letterSpacing: 1 } }, "EXPORT"),
                    React.createElement("button", { onClick: () => { var _a; return (_a = importRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontWeight: 800, fontSize: 11, fontFamily: "inherit", letterSpacing: 1 } }, "IMPORT")),
                React.createElement("button", { onClick: bulkExportPlannerToApple, style: { width: "100%", marginTop: 10, padding: 11, borderRadius: 10, border: "none", background: C.accent, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 1 } }, "SYNC TASKS + EVENTS TO APPLE"),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                    React.createElement("button", { onClick: bulkExportTasksToApple, style: { flex: 1, padding: 9, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 1 } }, "TASKS"),
                    React.createElement("button", { onClick: bulkExportEventsToApple, style: { flex: 1, padding: 9, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 1 } }, "EVENTS"))))),
        !searchOpen && tab === "tasks" && (React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" } },
                React.createElement(CatPill, { label: "ALL", active: taskCatFilter === "all", color: C.accent, onClick: () => setTaskCatFilter("all") }),
                categories.map(cat => React.createElement(CatPill, { key: cat.id, label: cat.name.toUpperCase(), active: taskCatFilter === cat.id, color: cat.color, onClick: () => setTaskCatFilter(cat.id) })),
                React.createElement("button", { onClick: () => setShowCatMgr(!showCatMgr), style: { padding: "4px 8px", borderRadius: 20, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.dim, fontWeight: 700, fontSize: 9, fontFamily: "inherit" } }, "\u2699")),
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" } },
                [["all", "ALL"], ["today", "TODAY"], ["overdue", "OVERDUE"], ["nodate", "NO DATE"], ["high", "HIGH"]].map(([key, label]) => (React.createElement("button", { key: key, onClick: () => setTaskViewFilter(key), style: { padding: "5px 9px", borderRadius: 10, border: taskViewFilter === key ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: taskViewFilter === key ? C.accent + "22" : C.bg2, color: taskViewFilter === key ? C.accent : C.muted, fontWeight: 700, fontSize: 9, fontFamily: "inherit", letterSpacing: 1 } }, label))),
                React.createElement("select", { value: taskSort, onChange: e => setTaskSort(e.target.value), style: { ...inp, width: "auto", padding: "5px 8px", fontSize: 9, color: C.muted } },
                    React.createElement("option", { value: "priority" }, "SORT: PRIORITY"),
                    React.createElement("option", { value: "due" }, "SORT: DUE DATE"),
                    React.createElement("option", { value: "category" }, "SORT: CATEGORY"))),
            showCatMgr && (React.createElement("div", { style: { background: C.bg2, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 10 } }, "// CATEGORIES"),
                categories.map(cat => (React.createElement("div", { key: cat.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                        React.createElement("div", { style: { width: 10, height: 10, borderRadius: "50%", background: cat.color } }),
                        React.createElement("span", { style: { fontSize: 12, color: C.text } }, cat.name)),
                    React.createElement("button", { onClick: () => deleteCategory(cat.id), style: { background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16, fontWeight: 700, opacity: ["personal", "work", "college"].includes(cat.id) ? 0.2 : 1, pointerEvents: ["personal", "work", "college"].includes(cat.id) ? "none" : "auto" } }, "\u00D7")))),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 10, alignItems: "center" } },
                    React.createElement("input", { placeholder: "New category", value: catDraft.name, onChange: e => setCatDraft(d => ({ ...d, name: e.target.value })), onKeyDown: e => e.key === "Enter" && addCategory(), style: { ...inp, flex: 1, padding: "7px 10px", fontSize: 12 } }),
                    React.createElement("div", { style: { display: "flex", gap: 3 } }, ACCENT_COLORS.slice(0, 5).map(c => React.createElement("button", { key: c, onClick: () => setCatDraft(d => ({ ...d, color: c })), style: { width: 18, height: 18, borderRadius: 4, background: c, border: "none", cursor: "pointer", outline: catDraft.color === c ? `2px solid white` : "none", outlineOffset: 1 } }))),
                    React.createElement("button", { onClick: addCategory, style: { padding: "7px 10px", borderRadius: 8, border: "none", background: C.accent, color: C.bg0, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" } }, "+")))),
            overdueTasks.length > 0 && (React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement(SectionHeader, { icon: "\u26A0", label: "OVERDUE", color: C.red }),
                overdueTasks.map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple })))),
            ["high", "medium", "low"].map(pri => {
                const list = relevantTasks.filter(t => t.priority === pri && !t.done && !(t.dueDate && t.dueDate < todayStr()));
                if (!list.length)
                    return null;
                const p = PRIORITY[pri];
                return (React.createElement("div", { key: pri, style: { marginBottom: 16 } },
                    React.createElement(SectionHeader, { icon: p.icon, label: `${p.label} PRIORITY`, color: p.color }),
                    list.map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple }))));
            }),
            relevantTasks.filter(t => t.done).length > 0 && (React.createElement("div", { style: { marginBottom: 16 } },
                React.createElement(SectionHeader, { icon: "\u2713", label: "DONE", color: C.dim }),
                relevantTasks.filter(t => t.done).map(t => React.createElement(TaskCard, { key: t.id, task: t, categories: categories, onToggle: toggleTask, onDelete: deleteTask, onEdit: openEditTask, onToggleSubtask: toggleSubtask, onAddSubtask: addSubtask, onExport: exportTaskToApple })))),
            relevantTasks.filter(t => !t.done).length === 0 && !overdueTasks.length && (React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: C.muted } },
                React.createElement("div", { style: { fontSize: 36, marginBottom: 12 } }, "[ ]"),
                React.createElement("div", { style: { fontSize: 12, fontWeight: 700, letterSpacing: 2 } }, "NO TASKS YET"))),
            showTaskForm ? (React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, marginTop: 8 } },
                React.createElement("input", { autoFocus: true, placeholder: "What needs to get done?", value: taskDraft.text, onChange: e => setTaskDraft(d => ({ ...d, text: e.target.value })), onKeyDown: e => e.key === "Enter" && saveTask(), style: { ...inp, marginBottom: 8 } }),
                React.createElement("textarea", { placeholder: "Description (optional)", value: taskDraft.description, onChange: e => setTaskDraft(d => ({ ...d, description: e.target.value })), rows: 2, style: { ...inp, resize: "none", marginBottom: 8 } }),
                React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 8 } },
                    React.createElement("input", { type: "date", value: taskDraft.dueDate, onChange: e => setTaskDraft(d => ({ ...d, dueDate: e.target.value })), style: { ...inp, flex: 1, fontSize: 12 } }),
                    React.createElement("button", { onClick: () => setTaskDraft(d => ({ ...d, dueDate: "" })), style: { padding: "0 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 11, fontFamily: "inherit", whiteSpace: "nowrap" } }, "No date")),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 6 } }, "REPEAT"),
                React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10 } }, ["none", "daily", "weekly", "monthly"].map(r => (React.createElement("button", { key: r, onClick: () => setTaskDraft(d => ({ ...d, recurrence: r })), style: { flex: 1, padding: "6px 0", borderRadius: 8, border: taskDraft.recurrence === r ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: taskDraft.recurrence === r ? C.accent + "22" : C.bg3, cursor: "pointer", fontWeight: 700, fontSize: 8, fontFamily: "inherit", color: taskDraft.recurrence === r ? C.accent : C.muted, letterSpacing: 0.5 } }, r === "none" ? "ONCE" : r.toUpperCase())))),
                React.createElement(MultiImageUploadBtn, { value: taskDraft.imageUrls || getImages(taskDraft), onChange: urls => setTaskDraft(d => ({ ...d, ...makeImageData(urls) })) }),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 6 } }, "PRIORITY"),
                React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } }, Object.entries(PRIORITY).map(([k, p]) => (React.createElement("button", { key: k, onClick: () => setTaskDraft(d => ({ ...d, priority: k })), style: { flex: 1, padding: "6px 0", borderRadius: 8, cursor: "pointer", border: taskDraft.priority === k ? `1px solid ${p.color}` : `1px solid ${C.border}`, background: taskDraft.priority === k ? p.bg : C.bg3, fontWeight: 700, fontSize: 10, fontFamily: "inherit", color: taskDraft.priority === k ? p.color : C.muted, letterSpacing: 1 } },
                    p.icon,
                    " ",
                    p.label)))),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 6 } }, "CATEGORY"),
                React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" } }, categories.map(cat => React.createElement("button", { key: cat.id, onClick: () => setTaskDraft(d => ({ ...d, categoryId: cat.id })), style: { padding: "5px 10px", borderRadius: 20, border: taskDraft.categoryId === cat.id ? `1px solid ${cat.color}` : `1px solid ${C.border}`, background: taskDraft.categoryId === cat.id ? cat.color + "22" : "transparent", cursor: "pointer", fontWeight: 700, fontSize: 9, fontFamily: "inherit", color: taskDraft.categoryId === cat.id ? cat.color : C.muted, letterSpacing: 1 } }, cat.name.toUpperCase()))),
                taskDraft.subtasks.length > 0 && (React.createElement("div", { style: { marginBottom: 10 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 6 } }, "SUBTASKS"),
                    taskDraft.subtasks.map((s, i) => (React.createElement("div", { key: s.id, style: { display: "flex", gap: 6, marginBottom: 6, alignItems: "center" } },
                        React.createElement("span", { style: { color: C.accent, fontWeight: 700, fontSize: 14, flexShrink: 0 } }, "\u00B7"),
                        React.createElement("input", { placeholder: `Step ${i + 1}`, value: s.text, onChange: e => updateSubtaskInDraft(s.id, e.target.value), style: { ...inp, flex: 1, padding: "6px 10px", fontSize: 12 } }),
                        React.createElement("button", { onClick: () => removeSubtaskFromDraft(s.id), style: { background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16, fontWeight: 700 } }, "\u00D7")))))),
                React.createElement("button", { onClick: addSubtaskToDraft, style: { padding: "6px 12px", borderRadius: 8, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 10, fontFamily: "inherit", letterSpacing: 1, marginBottom: 12 } }, "+ ADD SUBTASK"),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: () => { setShowTaskForm(false); setEditingTaskId(null); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", color: C.muted, fontSize: 11, letterSpacing: 1 } }, "CANCEL"),
                    React.createElement("button", { onClick: saveTask, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.accent, color: C.bg0, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, boxShadow: `0 0 16px ${C.accent}44` } }, editingTaskId ? "SAVE CHANGES" : "+ ADD TASK")),
                React.createElement("button", { onClick: saveTaskAndExport, style: { width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, boxShadow: `0 0 16px ${C.green}44` } }, editingTaskId ? "SAVE + SEND TO APPLE" : "+ ADD TASK + SEND TO APPLE"))) : null)),
        !searchOpen && tab === "calendar" && (React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 14, background: C.bg2, borderRadius: 10, padding: 3, border: `1px solid ${C.border}` } }, [["grid", "⊞ MONTH"], ["week", "≡ WEEK"], ["list", "↓ LIST"]].map(([key, label]) => (React.createElement("button", { key: key, onClick: () => setCalView(key), style: { flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 9, letterSpacing: 1, fontFamily: "inherit", background: calView === key ? C.accent : "transparent", color: calView === key ? C.bg0 : C.muted, boxShadow: calView === key ? `0 0 10px ${C.accent}55` : "none" } }, label)))),
            calView === "grid" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } },
                    React.createElement("button", { onClick: prevMonth, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u2039"),
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: C.text, letterSpacing: 3 } },
                        MONTHS[calMonth],
                        " ",
                        calYear),
                    React.createElement("button", { onClick: nextMonth, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u203A")),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 } }, DAYS_S.map((d, i) => React.createElement("div", { key: i, style: { textAlign: "center", fontSize: 9, fontWeight: 700, color: i === 0 || i === 6 ? C.muted : C.dim, letterSpacing: 1, padding: "4px 0" } }, d))),
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
                        }, style: { aspectRatio: "1", borderRadius: 10, border: "none", background: isSel ? C.accent : isToday ? C.bg4 : C.bg2, color: isSel ? C.bg0 : isToday ? C.accent : C.text, fontWeight: isSel || isToday ? 800 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", outline: isToday && !isSel ? `1px solid ${C.accent}66` : "none", boxShadow: isSel ? `0 0 14px ${C.accent}66` : "none", position: "relative" } },
                            day,
                            apptsByDay[day] && !isSel && (React.createElement("div", { style: { position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 } }, (apptsByDay[day] || []).slice(0, 3).map((a, idx) => React.createElement("div", { key: idx, style: { width: 3, height: 3, borderRadius: "50%", background: a.color, boxShadow: `0 0 4px ${a.color}` } }))))));
                    })),
                false && selDay && (React.createElement("div", { style: { marginTop: 16 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 10 } },
                        "// ",
                        MONTHS[calMonth],
                        " ",
                        selDay),
                    ((_a = apptsByDay[selDay]) !== null && _a !== void 0 ? _a : []).length === 0 ? React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "12px 0" } }, "No events scheduled.")
                        : React.createElement(DayTimeline, { date: new Date(calYear, calMonth, selDay), appts: (_b = apptsByDay[selDay]) !== null && _b !== void 0 ? _b : [], onDelete: deleteAppt, onEdit: openViewAppt, onExport: exportEventToApple }))),
                !selDay && (React.createElement("div", { style: { marginTop: 18 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.muted, marginBottom: 10 } }, "// UPCOMING"),
                    appts.filter(a => a.date && new Date(a.date + "T12:00:00") >= new Date(today.toDateString())).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5).map(a => React.createElement(ApptCard, { key: a.id, appt: a, onDelete: deleteAppt, onEdit: openViewAppt, onExport: exportEventToApple })),
                    appts.length === 0 && React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "12px 0" } }, "No appointments added."))))),
            calView === "week" && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
                    React.createElement("button", { onClick: () => { setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); setSelWeekDay(n); return n; }); }, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u2039"),
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: C.text, letterSpacing: 2 } },
                        weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" }),
                        " \u2013 ",
                        weekDays[6].toLocaleDateString([], { month: "short", day: "numeric" })),
                    React.createElement("button", { onClick: () => { setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); setSelWeekDay(n); return n; }); }, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", fontSize: 16, color: C.text } }, "\u203A")),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 14, position: "sticky", top: 0, zIndex: 20, background: C.bg1, paddingBottom: 8 } }, weekDays.map((wd, i) => {
                    var _a;
                    const isToday = wd.toDateString() === today.toDateString();
                    const isSel = (selWeekDay === null || selWeekDay === void 0 ? void 0 : selWeekDay.toDateString()) === wd.toDateString();
                    const dayAppts = (_a = weekApptsByDay[wd.toDateString()]) !== null && _a !== void 0 ? _a : [];
                    return (React.createElement("button", { key: i, onClick: () => setSelWeekDay(wd), style: { borderRadius: 12, border: "none", background: isSel ? C.accent : isToday ? C.bg4 : C.bg2, cursor: "pointer", fontFamily: "inherit", padding: "8px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, outline: isToday && !isSel ? `1px solid ${C.accent}66` : "none", boxShadow: isSel ? `0 0 12px ${C.accent}66` : "none" } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, color: isSel ? C.bg0 : C.dim, letterSpacing: 1 } }, DAYS_L[i].slice(0, 3)),
                        React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: isSel ? C.bg0 : isToday ? C.accent : C.text } }, wd.getDate()),
                        React.createElement("div", { style: { display: "flex", gap: 2 } }, dayAppts.slice(0, 3).map((a, idx) => React.createElement("div", { key: idx, style: { width: 4, height: 4, borderRadius: "50%", background: isSel ? C.bg0 : a.color } })))));
                })),
                selWeekDay && (React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 10 } },
                        "// ",
                        DAYS_L[selWeekDay.getDay()],
                        " ",
                        selWeekDay.toLocaleDateString([], { month: "short", day: "numeric" })),
                    ((_c = weekApptsByDay[selWeekDay.toDateString()]) !== null && _c !== void 0 ? _c : []).length === 0
                        ? React.createElement(DayTimeline, { date: selWeekDay, appts: [], onDelete: deleteAppt, onEdit: openViewAppt, selectedApptId: selectedApptId, onBack: () => setSelectedApptId(null), onRealEdit: openEditAppt, onExport: exportEventToApple })
                        : React.createElement(DayTimeline, { date: selWeekDay, appts: (_d = weekApptsByDay[selWeekDay.toDateString()]) !== null && _d !== void 0 ? _d : [], onDelete: deleteAppt, onEdit: openViewAppt, selectedApptId: selectedApptId, onBack: () => setSelectedApptId(null), onRealEdit: openEditAppt, onExport: exportEventToApple }))),
                !selWeekDay && React.createElement("div", { style: { fontSize: 11, color: C.muted, padding: "12px 0", letterSpacing: 1 } }, "Tap a day to see its events."))),
            calView === "list" && (React.createElement("div", null,
                React.createElement("div", { style: { marginBottom: 14 } },
                    React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.muted, marginBottom: 8 } }, "// FILTER BY COLOR"),
                    React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } },
                        ACCENT_COLORS.map(c => {
                            if (!appts.some(a => a.color === c))
                                return null;
                            const active = apptColorFilter.has(c);
                            return React.createElement("button", { key: c, onClick: () => toggleColorFilter(c), style: { width: 28, height: 28, borderRadius: 8, background: c, border: "none", cursor: "pointer", outline: active ? `2px solid white` : "2px solid transparent", outlineOffset: 2, opacity: active ? 1 : 0.3 } });
                        }),
                        apptColorFilter.size > 0 && React.createElement("button", { onClick: () => setApptColorFilter(new Set()), style: { padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 9, fontFamily: "inherit" } }, "CLEAR"))),
                filteredAppts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(a => React.createElement(ApptCard, { key: a.id, appt: a, onDelete: deleteAppt, onEdit: openViewAppt, onExport: exportEventToApple })),
                filteredAppts.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: C.muted } },
                    React.createElement("div", { style: { fontSize: 28, marginBottom: 10 } }, "[ ]"),
                    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: 2 } }, "NO APPOINTMENTS")))),
            selectedApptId ? (() => {
                const a = appts.find(x => x.id === selectedApptId);
                if (!a)
                    return React.createElement("div", null);
                const d = new Date(a.date + "T12:00:00");
                return React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, borderLeft: `3px solid ${a.color}`, marginTop: 14 } },
                    React.createElement("button", { onClick: () => setSelectedApptId(null), style: { background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1, marginBottom: 12, padding: 0 } }, "\u2190 BACK"),
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 8 } },
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { fontSize: 18, fontWeight: 800, color: a.color, lineHeight: 1.3, marginBottom: 5 } }, a.title),
                            React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 1, lineHeight: 1.6 } }, d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })),
                            (a.time || a.endTime) && React.createElement("div", { style: { fontSize: 11, color: C.muted, letterSpacing: 1, lineHeight: 1.6 } }, a.time || "No start", a.endTime ? ` \u2013 ${a.endTime}` : "")),
                        React.createElement("button", { onClick: () => openEditAppt(a), style: { padding: "7px 12px", borderRadius: 9, border: "none", background: C.accent, color: C.bg0, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 1 } }, "EDIT")),
                    React.createElement("button", { onClick: () => exportEventToApple(a), style: { width: "100%", padding: 10, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, marginTop: 8 } }, "SEND TO APPLE CALENDAR"),
                    getImages(a).length > 0 && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, margin: "12px 0" } }, getImages(a).map((url, i) => React.createElement("img", { key: i, src: url, alt: "", onClick: () => openPlannerImage(url), style: { width: "100%", aspectRatio: "1", borderRadius: 10, objectFit: "cover", display: "block", cursor: "zoom-in" } }))),
                    React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 12 } }, a.description || "No description."));
            })() : showApptForm ? (React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, marginTop: 14 } },
                React.createElement("input", { autoFocus: true, placeholder: "Event title", value: apptDraft.title, onChange: e => setApptDraft(d => ({ ...d, title: e.target.value })), style: { ...inp, marginBottom: 8 } }),
                React.createElement("textarea", { placeholder: "Description (optional)", value: apptDraft.description, onChange: e => setApptDraft(d => ({ ...d, description: e.target.value })), rows: 2, style: { ...inp, resize: "none", marginBottom: 8 } }),
                React.createElement(MultiImageUploadBtn, { value: apptDraft.imageUrls || getImages(apptDraft), onChange: urls => setApptDraft(d => ({ ...d, ...makeImageData(urls) })) }),
                React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 8 } },
                    React.createElement("input", { type: "date", value: apptDraft.date, onChange: e => setApptDraft(d => ({ ...d, date: e.target.value })), style: { ...inp, flex: 1 } })),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8, marginBottom: 8, width: "100%", overflow: "hidden" } },
                    React.createElement("div", { style: { minWidth: 0, width: "100%" } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 4 } }, "START"),
                        React.createElement("input", { type: "time", value: apptDraft.time, onChange: e => setApptDraft(d => ({ ...d, time: e.target.value })), style: { ...inp, width: "100%", minWidth: 0, maxWidth: "100%", padding: "10px 6px", textAlign: "center" } })),
                    React.createElement("div", { style: { minWidth: 0, width: "100%" } },
                        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 4 } }, "END"),
                        React.createElement("input", { type: "time", value: apptDraft.endTime, onChange: e => setApptDraft(d => ({ ...d, endTime: e.target.value })), style: { ...inp, width: "100%", minWidth: 0, maxWidth: "100%", padding: "10px 6px", textAlign: "center" } }))),
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 6 } }, "REPEAT"),
                React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10 } }, ["none", "daily", "weekly", "monthly"].map(r => (React.createElement("button", { key: r, onClick: () => setApptDraft(d => ({ ...d, recurrence: r })), style: { flex: 1, padding: "6px 0", borderRadius: 8, border: apptDraft.recurrence === r ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: apptDraft.recurrence === r ? C.accent + "22" : C.bg3, cursor: "pointer", fontWeight: 700, fontSize: 8, fontFamily: "inherit", color: apptDraft.recurrence === r ? C.accent : C.muted, letterSpacing: 0.5 } }, r === "none" ? "ONCE" : r.toUpperCase())))),
                React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 } }, ACCENT_COLORS.map(c => React.createElement("button", { key: c, onClick: () => setApptDraft(d => ({ ...d, color: c })), style: { width: 26, height: 26, borderRadius: 6, background: c, border: "none", cursor: "pointer", outline: apptDraft.color === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: 2, opacity: apptDraft.color === c ? 1 : 0.4 } }))),
                React.createElement("div", { style: { display: "flex", gap: 8 } },
                    React.createElement("button", { onClick: () => { setShowApptForm(false); setEditingApptId(null); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", color: C.muted, fontSize: 11, letterSpacing: 1 } }, "CANCEL"),
                    React.createElement("button", { onClick: saveAppt, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.green, color: C.bg0, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, boxShadow: `0 0 16px ${C.green}44` } }, editingApptId ? "SAVE CHANGES" : "+ ADD EVENT")),
                React.createElement("button", { onClick: saveApptAndExport, style: { width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "none", background: C.accent, color: C.bg0, cursor: "pointer", fontWeight: 900, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, boxShadow: `0 0 16px ${C.accent}44` } }, editingApptId ? "SAVE + SEND TO APPLE" : "+ ADD EVENT + SEND TO APPLE"))) : null)),
        !searchOpen && tab === "notes" && (React.createElement("div", null, noteView === "view" ? (() => {
            const n = notes.find(x => x.id === selectedNoteId);
            const folder = n ? folders.find(f => f.id === n.folderId) : null;
            if (!n) return React.createElement("div", null, React.createElement("button", { onClick: () => setNoteView("list"), style: { background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1, marginBottom: 14, padding: 0 } }, "\u2190 BACK"));
            return React.createElement("div", null,
                React.createElement("button", { onClick: () => { setNoteView("list"); setSelectedNoteId(null); }, style: { background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1, marginBottom: 14, padding: 0 } }, "\u2190 BACK"),
                React.createElement("div", { style: { background: C.bg2, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, borderLeft: `3px solid ${(folder && folder.color) || C.accent}` } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 8 } },
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 4 } }, n.title),
                            React.createElement("div", { style: { fontSize: 9, color: (folder && folder.color) || C.muted, fontWeight: 700, letterSpacing: 1 } }, n.type === "topic" ? "\u25c8 TOPIC" : "\u2261 TEXT", " \u00b7 ", (folder && folder.name) || "General")),
                        React.createElement("button", { onClick: () => openEditNote(n), style: { padding: "7px 12px", borderRadius: 9, border: "none", background: C.accent, color: C.bg0, cursor: "pointer", fontWeight: 800, fontSize: 10, fontFamily: "inherit", letterSpacing: 1 } }, "EDIT")),
                    getImages(n)[0] && React.createElement("img", { src: getImages(n)[0], alt: "", onClick: () => openPlannerImage(getImages(n)[0]), style: { maxWidth: "100%", borderRadius: 10, maxHeight: 190, objectFit: "cover", display: "block", margin: "10px 0" } }),
                    n.type === "descriptive" ? React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 14 } }, n.content || "No content.")
                        : React.createElement("div", { style: { marginTop: 14 } }, (n.topics || []).length ? n.topics.map((t, i) => React.createElement("div", { key: i, style: { fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 6 } }, "\u2022 ", t)) : React.createElement("div", { style: { fontSize: 13, color: C.muted } }, "No topics."))));
        })() : noteView === "list" ? (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" } },
                React.createElement(CatPill, { label: "ALL", active: selFolderId === null, color: C.accent, onClick: () => setSelFolderId(null) }),
                folders.map(f => React.createElement(CatPill, { key: f.id, label: f.name.toUpperCase(), active: selFolderId === f.id, color: f.color, onClick: () => setSelFolderId(selFolderId === f.id ? null : f.id) })),
                React.createElement("button", { onClick: () => setShowFolderMgr(!showFolderMgr), style: { padding: "4px 8px", borderRadius: 20, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.dim, fontWeight: 700, fontSize: 9, fontFamily: "inherit" } }, "\u2699")),
            showFolderMgr && (React.createElement("div", { style: { background: C.bg2, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 10 } }, "// FOLDERS"),
                folders.map(f => (React.createElement("div", { key: f.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                        React.createElement("div", { style: { width: 10, height: 10, borderRadius: "50%", background: f.color } }),
                        React.createElement("span", { style: { fontSize: 12, color: C.text } }, f.name)),
                    React.createElement("button", { onClick: () => deleteFolder(f.id), style: { background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16, fontWeight: 700, opacity: f.id === "general" ? 0.2 : 1, pointerEvents: f.id === "general" ? "none" : "auto" } }, "\u00D7")))),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 10, alignItems: "center" } },
                    React.createElement("input", { placeholder: "New folder", value: folderDraft.name, onChange: e => setFolderDraft(d => ({ ...d, name: e.target.value })), onKeyDown: e => e.key === "Enter" && addFolder(), style: { ...inp, flex: 1, padding: "7px 10px", fontSize: 12 } }),
                    React.createElement("div", { style: { display: "flex", gap: 3 } }, ACCENT_COLORS.slice(0, 5).map(c => React.createElement("button", { key: c, onClick: () => setFolderDraft(d => ({ ...d, color: c })), style: { width: 18, height: 18, borderRadius: 4, background: c, border: "none", cursor: "pointer", outline: folderDraft.color === c ? `2px solid white` : "none", outlineOffset: 1 } }))),
                    React.createElement("button", { onClick: addFolder, style: { padding: "7px 10px", borderRadius: 8, border: "none", background: C.accent, color: C.bg0, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" } }, "+")))),
            visibleNotes.map(n => {
                var _a, _b, _c;
                const folder = folders.find(f => f.id === n.folderId);
                return (React.createElement("div", { key: n.id, onClick: () => openViewNote(n), style: { background: C.bg2, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${C.border}`, borderLeft: `2px solid ${(_a = folder === null || folder === void 0 ? void 0 : folder.color) !== null && _a !== void 0 ? _a : C.accent}`, cursor: "pointer" } },
                    React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } },
                        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                            React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 4 } }, n.title),
                            React.createElement("div", { style: { fontSize: 9, color: (_b = folder === null || folder === void 0 ? void 0 : folder.color) !== null && _b !== void 0 ? _b : C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 6 } },
                                n.type === "topic" ? "◈ TOPIC" : "≡ TEXT",
                                " \u00B7 ", (_c = folder === null || folder === void 0 ? void 0 : folder.name) !== null && _c !== void 0 ? _c : "General"),
                            n.type === "descriptive" && n.content && React.createElement("div", { style: { fontSize: 11, color: C.muted, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } }, n.content),
                            n.type === "topic" && n.topics.length > 0 && React.createElement("div", { style: { fontSize: 11, color: C.muted } },
                                n.topics.slice(0, 2).map((t, i) => React.createElement("div", { key: i, style: { marginBottom: 2 } },
                                    "\u00B7 ",
                                    t)),
                                n.topics.length > 2 && React.createElement("div", { style: { color: C.dim } },
                                    "+",
                                    n.topics.length - 2,
                                    " more"))),
                        React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 } },
                            getImages(n)[0] && React.createElement("img", { src: getImages(n)[0], alt: "", onClick: () => openPlannerImage(getImages(n)[0]), style: { width: 46, height: 46, borderRadius: 8, objectFit: "cover" } }),
                            React.createElement("button", { onClick: e => { e.stopPropagation(); deleteNote(n.id); }, style: { background: "#FF44441A", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 13 } }, "\u00D7")))));
            }),
            visibleNotes.length === 0 && React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: C.muted } },
                React.createElement("div", { style: { fontSize: 32, marginBottom: 10 } }, "\u2261"),
                React.createElement("div", { style: { fontSize: 12, fontWeight: 700, letterSpacing: 2 } }, "NO NOTES YET")))) : (React.createElement("div", null,
            React.createElement("button", { onClick: () => { setNoteView("list"); setEditingNoteId(null); }, style: { background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1, marginBottom: 14, padding: 0 } }, "\u2190 BACK"),
            React.createElement("input", { placeholder: "Note title", value: noteDraft.title, onChange: e => setNoteDraft(d => ({ ...d, title: e.target.value })), style: { ...inp, marginBottom: 10, fontSize: 15, fontWeight: 700 } }),
            React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 10, background: C.bg2, borderRadius: 10, padding: 3, border: `1px solid ${C.border}` } }, [["descriptive", "≡ DESCRIPTIVE"], ["topic", "◈ TOPICS"]].map(([key, label]) => (React.createElement("button", { key: key, onClick: () => setNoteDraft(d => ({ ...d, type: key })), style: { flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 10, letterSpacing: 1, fontFamily: "inherit", background: noteDraft.type === key ? C.amber : "transparent", color: noteDraft.type === key ? C.bg0 : C.muted } }, label)))),
            React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 6 } }, "FOLDER"),
            React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" } }, folders.map(f => React.createElement("button", { key: f.id, onClick: () => setNoteDraft(d => ({ ...d, folderId: f.id })), style: { padding: "5px 10px", borderRadius: 20, border: noteDraft.folderId === f.id ? `1px solid ${f.color}` : `1px solid ${C.border}`, background: noteDraft.folderId === f.id ? f.color + "22" : "transparent", cursor: "pointer", fontWeight: 700, fontSize: 9, fontFamily: "inherit", color: noteDraft.folderId === f.id ? f.color : C.muted, letterSpacing: 1 } }, f.name.toUpperCase()))),
            noteDraft.type === "descriptive" ? (React.createElement("textarea", { placeholder: "Write your note here...", value: noteDraft.content, onChange: e => setNoteDraft(d => ({ ...d, content: e.target.value })), rows: 8, style: { ...inp, resize: "none", marginBottom: 10, lineHeight: 1.7 } })) : (React.createElement("div", { style: { marginBottom: 10 } },
                React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.muted, marginBottom: 8 } }, "Press Enter to add \u00B7 Backspace on empty to remove"),
                noteDraft.topics.map((topic, i) => (React.createElement("div", { key: i, style: { display: "flex", gap: 6, marginBottom: 6, alignItems: "center" } },
                    React.createElement("span", { style: { color: C.amber, fontWeight: 700, fontSize: 16, flexShrink: 0, lineHeight: 1 } }, "\u00B7"),
                    React.createElement("input", { placeholder: `Topic ${i + 1}`, value: topic, onChange: e => { const t = [...noteDraft.topics]; t[i] = e.target.value; setNoteDraft(d => ({ ...d, topics: t })); }, onKeyDown: e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const t = [...noteDraft.topics];
                                t.splice(i + 1, 0, "");
                                setNoteDraft(d => ({ ...d, topics: t }));
                            }
                            if (e.key === "Backspace" && !topic && noteDraft.topics.length > 1) {
                                e.preventDefault();
                                setNoteDraft(d => ({ ...d, topics: d.topics.filter((_, idx) => idx !== i) }));
                            }
                        }, style: { ...inp, flex: 1, padding: "7px 10px", fontSize: 13 } }),
                    noteDraft.topics.length > 1 && React.createElement("button", { onClick: () => setNoteDraft(d => ({ ...d, topics: d.topics.filter((_, idx) => idx !== i) })), style: { background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 18, fontWeight: 700, lineHeight: 1 } }, "\u00D7")))),
                React.createElement("button", { onClick: () => setNoteDraft(d => ({ ...d, topics: [...d.topics, ""] })), style: { padding: "6px 12px", borderRadius: 8, border: `1px dashed ${C.dim}`, background: "transparent", cursor: "pointer", color: C.muted, fontWeight: 700, fontSize: 10, fontFamily: "inherit", letterSpacing: 1, marginTop: 4 } }, "+ ADD TOPIC"))),
            React.createElement(MultiImageUploadBtn, { value: noteDraft.imageUrls || getImages(noteDraft), onChange: urls => setNoteDraft(d => ({ ...d, ...makeImageData(urls) })) }),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 6 } },
                React.createElement("button", { onClick: () => { setNoteView("list"); setEditingNoteId(null); }, style: { flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", color: C.muted, fontSize: 11, letterSpacing: 1 } }, "CANCEL"),
                React.createElement("button", { onClick: saveNote, style: { flex: 2, padding: 10, borderRadius: 10, border: "none", background: C.amber, color: C.bg0, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, boxShadow: `0 0 16px ${C.amber}44` } }, "SAVE NOTE"))))))));
    // ── Focus banner (shared) ───────────────────────────────────────────────────
    const focusBanner = (React.createElement("div", { style: { background: C.bg2, border: `1px solid ${C.accent}33`, borderLeft: `3px solid ${C.accent}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer", position: "relative", overflow: "hidden" }, onClick: !editMot ? startEditMot : undefined },
        React.createElement("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.accent}88, transparent)` } }),
        React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 4 } }, "// FOCUS MODE"),
        editMot ? (React.createElement("div", null,
            React.createElement("textarea", { ref: motRef, value: motDraft, onChange: e => setMotDraft(e.target.value), onClick: e => e.stopPropagation(), rows: 2, style: { ...inp, resize: "none", marginBottom: 8, border: `1px solid ${C.accent}66`, fontSize: 11 } }),
                React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 8 } }, ACCENT_COLORS.concat([C.text]).map(c => React.createElement("button", { key: c, onClick: e => { e.stopPropagation(); setFocusColor(c); }, style: { width: 20, height: 20, borderRadius: 6, background: c, border: "none", cursor: "pointer", outline: focusColor === c ? `2px solid white` : "1px solid transparent", outlineOffset: 1 } }))),
            React.createElement("button", { onClick: e => { e.stopPropagation(); saveMot(); }, style: { background: C.accent, color: C.bg0, border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 700, fontSize: 10, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 } }, "SAVE"))) : (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { color: focusColor, fontSize: 12, fontWeight: 600, lineHeight: 1.5 } }, motivation),
            React.createElement("div", { style: { fontSize: 8, color: C.muted, marginTop: 4, letterSpacing: 1 } }, isWide ? "CLICK TO EDIT" : "TAP TO EDIT")))));
    // ── DESKTOP / TABLET LAYOUT (≥640px) ───────────────────────────────────────
    if (isWide) {
        return (React.createElement("div", { style: { display: "flex", height: "100vh", background: C.bg0, fontFamily: "'IBM Plex Mono','Courier New',monospace", overflow: "hidden" } },
            React.createElement("div", { style: { width: 260, background: C.bg1, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "20px 16px", overflowY: "auto", flexShrink: 0 } },
                React.createElement("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 4, color: C.accent, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.border}` } }, "// ADHD PLANNER"),
                React.createElement("div", { style: { marginBottom: 14 } }, focusBanner),
                total > 0 && (React.createElement("div", { style: { padding: "8px 12px", background: C.bg2, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 20 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 5, letterSpacing: 2 } },
                        React.createElement("span", null, "TASKS"),
                        React.createElement("span", { style: { color: pct === 100 ? C.green : C.accent } },
                            pct,
                            "% \u2014 ",
                            done,
                            "/",
                            total)),
                    React.createElement("div", { style: { height: 3, background: C.bg4, borderRadius: 3, overflow: "hidden" } },
                        React.createElement("div", { style: { height: "100%", borderRadius: 3, background: pct === 100 ? C.green : `linear-gradient(90deg, ${C.accent}, ${C.accentD})`, width: `${pct}%`, transition: "width 0.5s", boxShadow: `0 0 6px ${C.accent}88` } })))),
                React.createElement("div", { style: { fontSize: 8, fontWeight: 700, letterSpacing: 3, color: C.dim, marginBottom: 8 } }, "NAVIGATE"),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, [["today", "◉", "TODAY"], ["tasks", "⊡", "TASKS"], ["calendar", "📅", "CALENDAR"], ["notes", "≡", "NOTES"]].map(([key, icon, label]) => (React.createElement("button", { key: key, onClick: () => { setTab(key); setSearchOpen(false); setSearchQuery(""); }, style: { padding: "11px 14px", background: tab === key ? C.accent + "22" : "transparent", border: tab === key ? `1px solid ${C.accent}44` : `1px solid transparent`, borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 11, letterSpacing: 1.5, color: tab === key ? C.accent : C.muted, textAlign: "left", fontFamily: "inherit", display: "flex", gap: 10, alignItems: "center", transition: "all 0.15s" } },
                    React.createElement("span", null, icon),
                    React.createElement("span", null, label))))),
                React.createElement("div", { style: { flex: 1 } }),
                React.createElement("button", { onClick: () => { tab === "calendar" ? openAddAppt() : tab === "notes" ? openAddNote() : openAddTask(); }, style: { width: "100%", padding: "11px 0", borderRadius: 12, border: "none", background: C.accent, color: C.bg0, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1.5, boxShadow: `0 0 20px ${C.accent}44`, marginTop: 24 } }, "+ ADD")),
            React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } },
                React.createElement("div", { style: { height: 52, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 32px", gap: 12, flexShrink: 0, background: C.bg1 } },
                    React.createElement("div", { style: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.text } }, tab === "today" ? "◉ TODAY" : tab === "tasks" ? "⊡ TASKS" : tab === "calendar" ? "📅 CALENDAR" : "≡ NOTES"),
                    React.createElement("div", { style: { flex: 1 } }),
                    searchOpen && (React.createElement("input", { ref: searchRef, placeholder: "Search tasks, notes, events...", value: searchQuery, onChange: e => setSearchQuery(e.target.value), style: { ...inp, width: 300, padding: "7px 14px", border: `1px solid ${C.accent}66` } })),
                    React.createElement("button", { onClick: () => { setSearchOpen(!searchOpen); setSearchQuery(""); }, style: { width: 36, height: 36, borderRadius: 10, border: `1px solid ${searchOpen ? C.accent : C.border}`, background: searchOpen ? C.accent + "22" : C.bg2, cursor: "pointer", color: searchOpen ? C.accent : C.muted, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" } }, "\uD83D\uDD0D")),
                React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "28px 40px 40px", background: C.bg0 } }, tabContent))));
    }
    // ── PHONE LAYOUT (<640px) ──────────────────────────────────────────────────
    return (React.createElement("div", { style: { height: "100%", minHeight: 0, width: "100%", background: C.bg1, display: "flex", flexDirection: "column", position: "relative", fontFamily: "'IBM Plex Mono','Courier New',monospace", overflow: "hidden" } },
        React.createElement("div", { style: { margin: "8px 16px 0", background: C.bg2, border: `1px solid ${C.accent}33`, borderLeft: `3px solid ${C.accent}`, borderRadius: 14, padding: "12px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }, onClick: !editMot ? startEditMot : undefined },
            React.createElement("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${C.accent}88, transparent)` } }),
            React.createElement("div", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.accent, textTransform: "uppercase", marginBottom: 4 } }, "// FOCUS MODE"),
            editMot ? (React.createElement("div", null,
                React.createElement("textarea", { ref: motRef, value: motDraft, onChange: e => setMotDraft(e.target.value), onClick: e => e.stopPropagation(), rows: 2, style: { ...inp, resize: "none", marginBottom: 8, border: `1px solid ${C.accent}66` } }),
                React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 8 } }, ACCENT_COLORS.concat([C.text]).map(c => React.createElement("button", { key: c, onClick: e => { e.stopPropagation(); setFocusColor(c); }, style: { width: 20, height: 20, borderRadius: 6, background: c, border: "none", cursor: "pointer", outline: focusColor === c ? `2px solid white` : "1px solid transparent", outlineOffset: 1 } }))),
                React.createElement("button", { onClick: e => { e.stopPropagation(); saveMot(); }, style: { background: C.accent, color: C.bg0, border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 } }, "SAVE"))) : (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { color: focusColor, fontSize: 13, fontWeight: 600, lineHeight: 1.5 } }, motivation),
                React.createElement("div", { style: { fontSize: 9, color: C.muted, marginTop: 4, letterSpacing: 1 } }, "TAP TO EDIT")))),
        tab === "tasks" && total > 0 && (React.createElement("div", { style: { margin: "8px 16px 0", padding: "8px 14px", background: C.bg2, borderRadius: 12, border: `1px solid ${C.border}` } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 2 } },
                React.createElement("span", null, "TASKS"),
                React.createElement("span", { style: { color: pct === 100 ? C.green : C.accent } },
                    pct,
                    "% \u2014 ",
                    done,
                    "/",
                    total)),
            React.createElement("div", { style: { height: 4, background: C.bg4, borderRadius: 4, overflow: "hidden" } },
                React.createElement("div", { style: { height: "100%", borderRadius: 4, background: pct === 100 ? C.green : `linear-gradient(90deg, ${C.accent}, ${C.accentD})`, width: `${pct}%`, transition: "width 0.5s cubic-bezier(.4,2,.6,1)", boxShadow: `0 0 8px ${C.accent}88` } })))),
        React.createElement("div", { style: { margin: "8px 16px 0", display: "flex", gap: 8, alignItems: "center" } },
            React.createElement("div", { style: { flex: 1, display: "flex", background: C.bg2, borderRadius: 12, padding: 4, gap: 4, border: `1px solid ${C.border}` } }, [["today", "TODAY"], ["tasks", "TASKS"], ["calendar", "CAL"], ["notes", "NOTES"]].map(([key, label]) => (React.createElement("button", { key: key, onClick: () => { setTab(key); setSearchOpen(false); setSearchQuery(""); }, style: { flex: 1, padding: "8px 0", background: tab === key && !searchOpen ? C.accent : "transparent", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 9, letterSpacing: 1, color: tab === key && !searchOpen ? C.bg0 : C.muted, transition: "all 0.2s", fontFamily: "inherit", boxShadow: tab === key && !searchOpen ? `0 0 16px ${C.accent}66` : "none" } }, label)))),
            React.createElement("button", { onClick: () => { setSearchOpen(!searchOpen); setSearchQuery(""); }, style: { width: 38, height: 38, borderRadius: 12, border: `1px solid ${searchOpen ? C.accent : C.border}`, background: searchOpen ? C.accent + "22" : C.bg2, cursor: "pointer", color: searchOpen ? C.accent : C.muted, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, "\uD83D\uDD0D")),
        searchOpen && (React.createElement("div", { style: { margin: "8px 16px 0" } },
            React.createElement("input", { ref: searchRef, placeholder: "Search tasks, notes, events...", value: searchQuery, onChange: e => setSearchQuery(e.target.value), style: { ...inp, border: `1px solid ${C.accent}66` } }))),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "12px 16px 100px" } }, tabContent),
        React.createElement("button", { onClick: () => { tab === "calendar" ? openAddAppt() : tab === "notes" ? openAddNote() : openAddTask(); }, style: { position: "absolute", bottom: 28, right: 20, width: 50, height: 50, borderRadius: "50%", background: C.accent, border: "none", cursor: "pointer", fontSize: 26, color: C.bg0, fontWeight: 700, boxShadow: `0 0 24px ${C.accent}88`, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 } }, "+"),
        lightboxImage && React.createElement("div", { onClick: () => setLightboxImage(null), style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 } },
            React.createElement("button", { onClick: () => setLightboxImage(null), style: { position: "absolute", top: "calc(18px + env(safe-area-inset-top, 0px))", right: 18, width: 38, height: 38, borderRadius: 19, border: "none", background: C.bg2, color: C.text, fontSize: 22, fontWeight: 800, cursor: "pointer" } }, "\u00d7"),
            React.createElement("img", { src: lightboxImage, alt: "", onClick: e => e.stopPropagation(), style: { maxWidth: "100%", maxHeight: "86dvh", objectFit: "contain", borderRadius: 12 } }))));
}


ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
