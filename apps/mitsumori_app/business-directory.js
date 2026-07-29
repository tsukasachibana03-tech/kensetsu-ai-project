(() => {
  "use strict";
  const keys = { customer: "chibana-customers-v1", vendor: "chibana-vendors-v1" };
  const labels = { customer: "顧客", vendor: "業者" };
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[char]);
  const read = (kind) => {
    try { return JSON.parse(localStorage.getItem(keys[kind])) || []; } catch { return []; }
  };
  const write = (kind, items) => localStorage.setItem(keys[kind], JSON.stringify(items));

  function ensureUi() {
    document.body.insertAdjacentHTML("beforeend", `
      <section class="directory-modal" id="businessDirectoryModal" aria-hidden="true">
        <div class="directory-dialog" role="dialog" aria-modal="true" aria-labelledby="directoryTitle">
          <header><div><strong id="directoryTitle">台帳管理</strong><span id="directoryCount"></span></div><button type="button" class="ghost" id="directoryCloseButton">閉じる</button></header>
          <div class="directory-layout">
            <form id="directoryForm" class="directory-form">
              <input id="directoryId" type="hidden">
              <label>会社名・氏名<input id="directoryName" required></label>
              <label>担当者<input id="directoryContact"></label>
              <label>メール<input id="directoryEmail" type="email"></label>
              <label>電話番号<input id="directoryPhone" type="tel"></label>
              <label id="directoryTradeLabel">業種・工種<input id="directoryTrade"></label>
              <label>住所<textarea id="directoryAddress" rows="3"></textarea></label>
              <label>備考<textarea id="directoryNotes" rows="3"></textarea></label>
              <div class="directory-actions"><button type="button" class="ghost" id="directoryClearButton">新規入力</button><button type="submit" class="primary">保存</button></div>
            </form>
            <div><input id="directorySearch" class="directory-search" placeholder="会社名・担当者・メールで検索"><div id="directoryList" class="directory-list"></div></div>
          </div>
        </div>
      </section>
    `);
  }

  let activeKind = "customer";
  function clearForm() {
    ["directoryId", "directoryName", "directoryContact", "directoryEmail", "directoryPhone", "directoryTrade", "directoryAddress", "directoryNotes"].forEach((id) => { $(id).value = ""; });
  }
  function render() {
    const query = $("directorySearch").value.trim().toLowerCase();
    const items = read(activeKind).filter((item) => [item.name, item.contact, item.email, item.phone, item.trade].join(" ").toLowerCase().includes(query));
    $("directoryCount").textContent = `${items.length}件`;
    $("directoryList").innerHTML = items.length ? items.map((item) => `
      <article class="directory-item" data-id="${escapeHtml(item.id)}">
        <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.contact || item.trade || "")}</span></div>
        <p>${escapeHtml(item.email || "メール未登録")}　${escapeHtml(item.phone || "")}</p>
        <div class="directory-item-actions">
          <button type="button" data-action="apply">見積へ反映</button>
          <button type="button" class="ghost" data-action="edit">編集</button>
          <button type="button" class="ghost danger-button" data-action="delete">削除</button>
        </div>
      </article>`).join("") : `<p class="directory-empty">${labels[activeKind]}はまだ登録されていません。</p>`;
  }
  function open(kind) {
    activeKind = kind;
    $("directoryTitle").textContent = `${labels[kind]}管理`;
    $("directoryTradeLabel").hidden = kind === "customer";
    clearForm();
    render();
    $("businessDirectoryModal").setAttribute("aria-hidden", "false");
  }
  function close() { $("businessDirectoryModal").setAttribute("aria-hidden", "true"); }
  function findItem(id) { return read(activeKind).find((item) => item.id === id); }
  function edit(item) {
    if (!item) return;
    Object.entries({ directoryId: item.id, directoryName: item.name, directoryContact: item.contact, directoryEmail: item.email, directoryPhone: item.phone, directoryTrade: item.trade, directoryAddress: item.address, directoryNotes: item.notes }).forEach(([id, value]) => { $(id).value = value || ""; });
  }
  function apply(item) {
    if (!item) return;
    if (activeKind === "customer") {
      $("clientName").value = item.name;
      $("clientName").dispatchEvent(new Event("input", { bubbles: true }));
    }
    const gmailTo = $("gmailTo");
    if (gmailTo && item.email) gmailTo.value = item.email;
    localStorage.setItem(`chibana-selected-${activeKind}`, item.id);
    close();
  }
  function bind() {
    $("customerDirectoryButton").addEventListener("click", () => open("customer"));
    $("vendorDirectoryButton").addEventListener("click", () => open("vendor"));
    $("directoryCloseButton").addEventListener("click", close);
    $("directoryClearButton").addEventListener("click", clearForm);
    $("directorySearch").addEventListener("input", render);
    $("directoryForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const id = $("directoryId").value || crypto.randomUUID();
      const next = { id, name: $("directoryName").value.trim(), contact: $("directoryContact").value.trim(), email: $("directoryEmail").value.trim(), phone: $("directoryPhone").value.trim(), trade: $("directoryTrade").value.trim(), address: $("directoryAddress").value.trim(), notes: $("directoryNotes").value.trim(), updatedAt: new Date().toISOString() };
      const items = read(activeKind), index = items.findIndex((item) => item.id === id);
      if (index >= 0) items[index] = next; else items.push(next);
      write(activeKind, items); clearForm(); render();
    });
    $("directoryList").addEventListener("click", (event) => {
      const button = event.target.closest("button"), article = event.target.closest(".directory-item");
      if (!button || !article) return;
      const item = findItem(article.dataset.id);
      if (button.dataset.action === "apply") apply(item);
      if (button.dataset.action === "edit") edit(item);
      if (button.dataset.action === "delete" && confirm(`${item?.name || labels[activeKind]}を削除しますか？`)) { write(activeKind, read(activeKind).filter((entry) => entry.id !== article.dataset.id)); render(); }
    });
    $("businessDirectoryModal").addEventListener("click", (event) => { if (event.target === $("businessDirectoryModal")) close(); });
  }
  document.addEventListener("DOMContentLoaded", () => { ensureUi(); bind(); });
})();
