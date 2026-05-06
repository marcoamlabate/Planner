(function () {
  const version = "v15-storage-date-cleanup";

  function replaceOnce(src, from, to, label) {
    if (!src.includes(from)) {
      console.warn("[Planner " + version + "] Patch skipped: " + label);
      return src;
    }
    return src.replace(from, to);
  }

  function patchApp(src) {
    src = replaceOnce(src,
`function todayStr() { return new Date().toISOString().split("T")[0]; }`,
`function todayStr() { return new Date().toISOString().split("T")[0]; }
function formatBrDate(dateStr) {
    if (!dateStr || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr))
        return dateStr || "";
    const [y, m, d] = dateStr.split("-");
    return d + "/" + m + "/" + y;
}`,
      "Brazilian task date format helper");

    src = replaceOnce(src,
`function readImageFile(file) {
    return new Promise(r => { const fr = new FileReader(); fr.onload = e => { var _a, _b; return r((_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result) !== null && _b !== void 0 ? _b : ""); }; fr.readAsDataURL(file); });
}`,
`function readImageFileRaw(file) {
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
}`,
      "image compression");

    src = replaceOnce(src,
`function makeImageData(images) {
    const clean = (images || []).filter(Boolean);
    return { imageUrls: clean, imageUrl: clean[0] || "" };
}
function ImageUploadBtn`,
`function makeImageData(images) {
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
function ImageUploadBtn`,
      "storage cleanup helpers");

    src = replaceOnce(src,
`                        task.dueDate),`,
`                        formatBrDate(task.dueDate)),`,
      "task card date display");

    src = replaceOnce(src,
`    const tasks = rawTasks.map(t => ({ dueDate: "", recurrence: "none", subtasks: [], imageUrls: [], ...t, imageUrls: getImages(t) }));`,
`    const tasks = rawTasks.map(t => ({ dueDate: "", recurrence: "none", subtasks: [], imageUrls: [], ...t, imageUrls: getImages(t) }));
    useEffect(() => { setTasks(p => compactStoredRecords(p, compactDoneTaskRecord)); }, [rawTasks]);`,
      "completed task storage cleanup");

    src = replaceOnce(src,
`    const appts = rawAppts.map(a => ({ endTime: "", recurrence: "none", imageUrls: [], ...a, imageUrls: getImages(a) }));`,
`    const appts = rawAppts.map(a => ({ endTime: "", recurrence: "none", imageUrls: [], ...a, imageUrls: getImages(a) }));
    useEffect(() => { setAppts(p => compactStoredRecords(p, compactPastApptRecord)); }, [rawAppts]);`,
      "past event storage cleanup");

    src = replaceOnce(src,
`            return { ...t, done: !t.done };`,
`            const next = { ...t, done: !t.done };
            return next.done ? compactDoneTaskRecord(next) : next;`,
      "clean task when marked done");

    src = replaceOnce(src,
`            motivation, tasks, categories, appts, notes, folders, reviews`,
`            motivation, focusColor, tasks, categories, appts, notes, folders, reviews`,
      "backup focus color export");

    src = replaceOnce(src,
`            if (data.motivation)
                setMotivation(data.motivation);
            if (Array.isArray(data.tasks))`,
`            if (data.motivation)
                setMotivation(data.motivation);
            if (data.focusColor)
                setFocusColor(data.focusColor);
            if (Array.isArray(data.tasks))`,
      "backup focus color import");

    return src + "\n//# sourceURL=planner-app-v15.js\n";
  }

  fetch("./app.js")
    .then(response => {
      if (!response.ok)
        throw new Error("Could not load app.js");
      return response.text();
    })
    .then(source => {
      const script = document.createElement("script");
      script.text = patchApp(source);
      document.body.appendChild(script);
    })
    .catch(error => {
      console.error("[Planner " + version + "]", error);
      const el = document.getElementById("boot-error");
      if (el) {
        el.style.display = "block";
        el.textContent = "App failed to start: " + (error && error.message ? error.message : "Unknown error");
      }
    });
})();
