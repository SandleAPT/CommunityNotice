(function () {
  const app = document.getElementById("app");
  const stateMeta = {
    done: { label: "완료", tone: "done" },
    current: { label: "현재", tone: "current" },
    next: { label: "다음", tone: "future" },
    later: { label: "이후", tone: "future" },
    goal: { label: "목표", tone: "future" },
  };
  const circled = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿";

  fetch("./data/community-status.json")
    .then((response) => {
      if (!response.ok) throw new Error("데이터 파일을 불러오지 못했습니다.");
      return response.json();
    })
    .then(renderPage)
    .catch((error) => {
      app.innerHTML = "";
      app.append(el("div", "load-error", [
        el("strong", "", "페이지 데이터를 불러오지 못했습니다."),
        el("div", "", "로컬 파일 더블클릭 대신 로컬 서버 또는 GitHub Pages에서 열어주세요."),
        el("div", "", error.message),
      ]));
    });

  function renderPage(data) {
    app.innerHTML = "";
    app.append(renderHero(data));
    app.append(renderSummaryCards(data.summaryCards || []));
    app.append(renderOverview(data));
    app.append(el("div", "page-break"));
    app.append(renderDetail(data));
  }

  function renderHero(data) {
    const currentIndex = data.stages.findIndex((stage) => stage.state === "current");
    const current = data.stages[currentIndex] || data.stages[0];
    return el("section", "hero", [
      el("div", "eyebrow", data.page.eyebrow),
      el("h1", "", data.page.heroTitle),
      el("p", "lead", data.page.heroLead),
      el("div", "chip-row", [
        el("span", "chip blue", [
          text("현재 위치: "),
          el("span", "inline-stage-pill", `${currentIndex + 1}단계`),
          text(` ${current.title}`),
        ]),
        el("span", "chip green", "이미 지나온 단계"),
        el("span", "chip amber", "미래 단계"),
      ]),
    ]);
  }

  function renderSummaryCards(cards) {
    return el("section", "grid grid-3 section", cards.map((card) => {
      const body = [
        el("div", "mini-title", card.label),
        el("div", "big", card.title),
        el("div", "desc", card.description),
      ];
      if (card.links) body.push(renderLinks(card.links));
      if (card.note) body.push(el("div", "proposal-note", card.note));
      return el("div", `card ${card.variant || ""}`, el("div", "card-body", body));
    }));
  }

  function renderOverview(data) {
    return el("section", "section card overview", [
      el("h2", "section-title", data.page.overviewTitle),
      el("p", "section-sub", data.page.overviewDescription),
      el("div", "step-list compact-flow", data.stages.map(renderOverviewStep)),
      renderCallout(data.callout),
    ]);
  }

  function renderOverviewStep(stage, index) {
    const meta = stateMeta[stage.state] || stateMeta.later;
    return el("div", `step ${meta.tone}`, [
      el("div", "num", `${index + 1}단계`),
      el("div", "step-card", [
        el("div", "step-line", [
          el("div", `pill ${meta.tone}`, meta.label),
          el("div", "step-title", stage.title),
        ]),
        el("div", "step-desc", stage.overviewText),
      ]),
    ]);
  }

  function renderCallout(callout) {
    if (!callout) return "";
    return el("div", "callout", [
      el("div", "section-title", callout.title),
      el("ul", "", (callout.items || []).map((item) => el("li", "", item))),
    ]);
  }

  function renderDetail(data) {
    let detailNo = 0;
    const stages = data.stages.map((stage, index) => renderStage(stage, index, () => ++detailNo));
    return el("section", "section", [
      el("h2", "section-title", data.page.detailTitle),
      el("p", "section-sub", data.page.detailDescription),
      ...stages,
      renderFooter(data.page.footerNote),
    ]);
  }

  function renderStage(stage, index, nextNo) {
    const meta = stateMeta[stage.state] || stateMeta.later;
    const details = el("details", `group status-${meta.tone}`, [
      el("summary", "", [
        el("div", "summary-left", [
          el("div", "summary-title", el("div", "stage-head", [
            el("span", "stage-pill-detail", `${index + 1}단계`),
            el("span", "stage-title-text", stage.detailTitle || stage.title),
          ])),
          el("div", "summary-desc", stage.detailSummary || ""),
        ]),
        el("div", "summary-badge", meta.label),
      ]),
      el("div", "timeline", (stage.items || []).map((item) => renderItem(item, nextNo))),
    ]);
    if (stage.open) details.open = true;
    return details;
  }

  function renderItem(item, nextNo) {
    const date = item.numbered ? `${circled[nextNo() - 1] || ""} ${item.date}` : item.date;
    const content = [el("div", "item-main", item.title)];
    if (item.detailLabel) content.push(el("div", "detail-label", item.detailLabel));
    if (item.lines && item.lines.length) content.push(el("div", "item-sub", lines(item.lines)));
    if (item.list && item.list.length) content.push(el("div", "item-sub", el("ul", "", item.list.map((entry) => el("li", "", entry)))));
    if (item.vote) content.push(renderVote(item.vote));
    if (item.labels) content.push(...item.labels.map((label) => el("span", `label-box lb-${label.color}`, label.text)));
    if (item.links && item.links.length) content.push(renderLinks(item.links, true));
    return el("div", "item", [el("div", "date", date), el("div", "", content)]);
  }

  function renderVote(vote) {
    const children = [
      el("div", "vote-summary", (vote.boxes || []).map((box) => el("div", "vote-box", [
        el("div", "vote-label", box.label),
        el("div", "vote-value", box.value),
      ]))),
    ];
    if (vote.note) children.push(el("div", "vote-note", vote.note));
    if (vote.result) children.push(el("span", "vote-result", vote.result));
    return children;
  }

  function renderLinks(links, small) {
    return el("div", "proposal-links", links.map((link) => {
      const a = el("a", `proposal-btn ${small ? "small" : ""}`, link.label);
      a.href = link.href;
      a.target = "_blank";
      return a;
    }));
  }

  function renderFooter(footer) {
    if (!footer) return "";
    return el("div", "footer-note", [
      el("strong", "", footer.title),
      el("div", "", lines(footer.lines || [])),
    ]);
  }

  function lines(values) {
    const fragment = document.createDocumentFragment();
    values.forEach((value, index) => {
      if (index > 0) fragment.append(document.createElement("br"));
      fragment.append(text(value));
    });
    return fragment;
  }

  function el(tag, className, children) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (Array.isArray(children)) children.flat().forEach((child) => append(node, child));
    else append(node, children);
    return node;
  }

  function append(parent, child) {
    if (child === undefined || child === null || child === "") return;
    parent.append(child.nodeType ? child : text(child));
  }

  function text(value) {
    return document.createTextNode(value);
  }
})();
