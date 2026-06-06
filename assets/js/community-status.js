(function () {
  const app = document.getElementById("app");

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
    app.append(renderHero(data.hero));
    app.append(renderSummaryCards(data.summaryCards));
    app.append(renderOverview(data.overview));
    app.append(el("div", "page-break"));
    app.append(renderDetail(data.detail));
  }

  function renderHero(hero) {
    const chips = hero.chips.map((chip) => {
      const children = [];
      chip.parts.forEach((part) => {
        if (part.stage) children.push(el("span", "inline-stage-pill", part.stage));
        if (part.text) children.push(text(part.text));
      });
      return el("span", `chip ${chip.color}`, children);
    });

    return el("section", "hero", [
      el("div", "eyebrow", hero.eyebrow),
      el("h1", "", hero.title),
      el("p", "lead", hero.lead),
      el("div", "chip-row", chips),
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

  function renderOverview(overview) {
    const section = el("section", "section card overview", [
      el("h2", "section-title", overview.title),
      el("p", "section-sub", overview.description),
      el("div", "step-list", overview.steps.map(renderOverviewStep)),
      renderCallout(overview.callout),
    ]);
    return section;
  }

  function renderOverviewStep(step) {
    return el("div", `step ${step.status}`, [
      el("div", "num", `${step.number}단계`),
      el("div", "step-card", [
        el("div", `pill ${step.status}`, step.badge),
        el("div", "step-title", step.title),
        el("div", "step-desc", step.description),
      ]),
    ]);
  }

  function renderCallout(callout) {
    return el("div", "callout", [
      el("div", "section-title", callout.title),
      el("ul", "", callout.items.map((item) => el("li", "", item))),
    ]);
  }

  function renderDetail(detail) {
    return el("section", "section", [
      el("h2", "section-title", detail.title),
      el("p", "section-sub", detail.description),
      ...detail.stages.map(renderStage),
      renderFooter(detail.footerNote),
    ]);
  }

  function renderStage(stage) {
    const details = el("details", `group status-${stage.status}`, [
      el("summary", "", [
        el("div", "summary-left", [
          el("div", "summary-title", el("div", "stage-head", [
            el("span", "stage-pill-detail", `${stage.number}단계`),
            el("span", "stage-title-text", stage.title),
          ])),
          el("div", "summary-desc", stage.description),
        ]),
        el("div", "summary-badge", stage.badge),
      ]),
      el("div", "timeline", stage.items.map(renderItem)),
    ]);
    if (stage.open) details.open = true;
    return details;
  }

  function renderItem(item) {
    const content = [el("div", "item-main", item.title)];
    if (item.detailLabel) content.push(el("div", "detail-label", item.detailLabel));
    if (item.lines) content.push(el("div", "item-sub", lines(item.lines)));
    if (item.list) content.push(el("div", "item-sub", el("ul", "", item.list.map((entry) => el("li", "", entry)))));
    if (item.vote) content.push(renderVote(item.vote));
    if (item.labels) content.push(...item.labels.map((label) => el("span", `label-box lb-${label.color}`, label.text)));
    if (item.links) content.push(renderLinks(item.links, true));
    return el("div", "item", [el("div", "date", item.date), el("div", "", content)]);
  }

  function renderVote(vote) {
    const children = [
      el("div", "vote-summary", vote.boxes.map((box) => el("div", "vote-box", [
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
    return el("div", "footer-note", [
      el("strong", "", footer.title),
      el("div", "", lines(footer.lines)),
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
    if (child === undefined || child === null) return;
    parent.append(child.nodeType ? child : text(child));
  }

  function text(value) {
    return document.createTextNode(value);
  }
})();
