(function () {
  const labels = { done: "완료", current: "현재", next: "다음", later: "이후", goal: "목표" };
  const stateClass = { done: "done", current: "current", next: "next", later: "later", goal: "goal" };
  const els = {
    stageList: document.getElementById("stageList"),
    empty: document.getElementById("empty"),
    editor: document.getElementById("editor"),
    state: document.getElementById("state"),
    period: document.getElementById("period"),
    title: document.getElementById("title"),
    overviewText: document.getElementById("overviewText"),
    detailTitle: document.getElementById("detailTitle"),
    detailSummary: document.getElementById("detailSummary"),
    previewBadge: document.getElementById("previewBadge"),
    previewTitle: document.getElementById("previewTitle"),
    previewText: document.getElementById("previewText"),
    downloadJson: document.getElementById("downloadJson"),
    copyJson: document.getElementById("copyJson"),
    toast: document.getElementById("toast"),
  };
  let data = null;
  let selected = 0;

  fetch("./data/community-status.json")
    .then((response) => {
      if (!response.ok) throw new Error("community-status.json 로드 실패");
      return response.json();
    })
    .then((json) => {
      data = normalize(json);
      selected = 0;
      render();
      selectStage(0);
    })
    .catch((error) => {
      els.stageList.textContent = error.message;
    });

  ["state", "period", "title", "overviewText", "detailTitle", "detailSummary"].forEach((id) => {
    els[id].addEventListener("input", updateSelected);
  });
  els.downloadJson.addEventListener("click", downloadJson);
  els.copyJson.addEventListener("click", copyJson);

  function render() {
    els.stageList.innerHTML = "";
    data.stages.forEach((stage, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `stage-btn ${index === selected ? "active" : ""}`;
      button.innerHTML = `
        <span class="stage-no">${index + 1}단계</span>
        <span class="stage-name"></span>
        <span class="badge ${stateClass[stage.state] || "later"}">${labels[stage.state] || stage.state}</span>
      `;
      button.querySelector(".stage-name").textContent = stage.title;
      button.addEventListener("click", () => selectStage(index));
      els.stageList.append(button);
    });
  }

  function normalize(json) {
    if (Array.isArray(json.stages)) return json;
    const detailByNo = new Map((json.detail?.stages || []).map((stage) => [stage.number, stage]));
    const stages = (json.overview?.steps || []).map((step) => {
      const detail = detailByNo.get(step.number) || {};
      return {
        id: `stage-${step.number}`,
        state: step.status === "current" ? "current" : step.status === "done" ? "done" : step.badge === "다음" ? "next" : step.badge === "목표" ? "goal" : "later",
        title: step.title || "",
        overviewText: step.description || "",
        detailTitle: (detail.title || step.title || "").replace(/^현재:\s*/, ""),
        detailSummary: detail.description || "",
        period: detail.badge || step.badge || "",
        open: detail.open !== false,
        items: detail.items || [],
      };
    });
    return {
      schemaVersion: 2,
      meta: { title: "커뮤니티 센터 오픈 진행상황 안내" },
      page: {
        eyebrow: json.hero?.eyebrow || "",
        heroTitle: json.hero?.title || "",
        heroLead: json.hero?.lead || "",
        overviewTitle: json.overview?.title || "",
        overviewDescription: json.overview?.description || "",
        detailTitle: json.detail?.title || "",
        detailDescription: json.detail?.description || "",
        footerNote: json.detail?.footerNote || {},
      },
      summaryCards: json.summaryCards || [],
      callout: json.overview?.callout || {},
      stages,
    };
  }

  function selectStage(index) {
    selected = index;
    const stage = data.stages[selected];
    els.empty.hidden = true;
    els.editor.hidden = false;
    els.state.value = stage.state || "later";
    els.period.value = stage.period || "";
    els.title.value = stage.title || "";
    els.overviewText.value = stage.overviewText || "";
    els.detailTitle.value = stage.detailTitle || stage.title || "";
    els.detailSummary.value = stage.detailSummary || "";
    updatePreview();
    render();
  }

  function updateSelected() {
    const stage = data.stages[selected];
    stage.state = els.state.value;
    stage.period = els.period.value;
    stage.title = els.title.value;
    stage.overviewText = els.overviewText.value;
    stage.detailTitle = els.detailTitle.value;
    stage.detailSummary = els.detailSummary.value;
    updatePreview();
    render();
  }

  function updatePreview() {
    const state = els.state.value;
    els.previewBadge.className = `badge ${stateClass[state] || "later"}`;
    els.previewBadge.textContent = labels[state] || state;
    els.previewTitle.textContent = els.title.value;
    els.previewText.textContent = els.overviewText.value;
  }

  function serialize() {
    return JSON.stringify(data, null, 2);
  }

  function downloadJson() {
    const blob = new Blob([serialize()], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "community-status.json";
    link.click();
    URL.revokeObjectURL(link.href);
    show("community-status.json 다운로드 완료");
  }

  async function copyJson() {
    await navigator.clipboard.writeText(serialize());
    show("JSON 복사 완료");
  }

  function show(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    setTimeout(() => els.toast.classList.remove("show"), 1800);
  }
})();
