(() => {
  "use strict";

  const config = {
    apiBaseUrl: (window.CHIBANA_GMAIL_API_BASE_URL || localStorage.getItem("chibana-gmail-api-base-url") || "").replace(/\/$/, ""),
    userId: localStorage.getItem("chibana-user-id") || "company-admin",
  };

  const $ = (id) => document.getElementById(id);
  const value = (id) => $(id)?.value?.trim?.() || "";

  function apiUrl(path) {
    if (!config.apiBaseUrl) throw new Error("Gmail API URLが未設定です。メール設定からAzure Functions URLを登録してください。");
    return `${config.apiBaseUrl}/api/gmail/${path}`;
  }

  function escapeHtml(text) {
    return String(text || "").replace(/[&<>"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;",
    })[char]);
  }

  function formatFileName() {
    const project = value("projectName") || "工事見積";
    const quote = value("quoteNo") || "見積";
    return `${project}_${quote}.pdf`.replace(/[\\/:*?"<>|]/g, "_");
  }

  function defaultSubject() {
    const project = value("projectName") || "工事";
    const quote = value("quoteNo");
    return `【株式会社知花工務店】${project} お見積書${quote ? `（${quote}）` : ""}`;
  }

  function defaultBody() {
    const client = value("clientName") || "ご担当者";
    const project = value("projectName") || "工事";
    const person = value("companyPerson") || "知花";
    return `${client}\n\nいつもお世話になっております。\n株式会社知花工務店の${person}です。\n\n${project}のお見積書をお送りします。\n添付ファイルをご確認くださいますようお願いいたします。\n\nご不明な点がございましたら、お申し付けください。\n\n株式会社知花工務店\nTEL: ${value("companyPhone") || "098-960-4712"}`;
  }

  function ensureUi() {
    if ($("gmailComposeModal")) return;

    const toolbar = document.querySelector(".topbar-actions");
    if (toolbar) {
      const settingsButton = document.createElement("button");
      settingsButton.type = "button";
      settingsButton.id = "gmailSettingsButton";
      settingsButton.className = "ghost";
      settingsButton.textContent = "メール設定";
      toolbar.prepend(settingsButton);

      const sendButton = document.createElement("button");
      sendButton.type = "button";
      sendButton.id = "gmailComposeButton";
      sendButton.textContent = "Gmail送信";
      toolbar.append(sendButton);
    }

    const previewActions = document.querySelector(".preview-actions");
    if (previewActions) {
      const previewSendButton = document.createElement("button");
      previewSendButton.type = "button";
      previewSendButton.id = "gmailPreviewSendButton";
      previewSendButton.textContent = "Gmail送信";
      previewSendButton.className = "primary";
      previewActions.append(previewSendButton);
    }

    document.body.insertAdjacentHTML("beforeend", `
      <section class="gmail-modal" id="gmailComposeModal" aria-hidden="true">
        <div class="gmail-dialog" role="dialog" aria-modal="true" aria-labelledby="gmailComposeTitle">
          <header class="gmail-dialog-header">
            <div>
              <strong id="gmailComposeTitle">見積書をGmailで送信</strong>
              <span id="gmailConnectionStatus">接続状態を確認中...</span>
            </div>
            <button type="button" class="ghost" id="gmailComposeCloseButton">閉じる</button>
          </header>
          <div class="gmail-form">
            <label>宛先<input id="gmailTo" type="email" multiple placeholder="example@company.jp"></label>
            <div class="gmail-two-columns">
              <label>CC<input id="gmailCc" type="text" placeholder="複数はカンマ区切り"></label>
              <label>BCC<input id="gmailBcc" type="text" placeholder="複数はカンマ区切り"></label>
            </div>
            <label>件名<input id="gmailSubject" type="text"></label>
            <label>本文<textarea id="gmailBody" rows="12"></textarea></label>
            <label>添付ファイル<input id="gmailAttachments" type="file" multiple></label>
            <p class="gmail-helper">見積PDFは「PDFを添付」から選択できます。現在の印刷画面をブラウザでPDF保存してから添付してください。</p>
            <div class="gmail-actions">
              <button type="button" class="ghost" id="gmailConnectButton">Gmailを接続</button>
              <button type="button" class="ghost" id="gmailHistoryButton">送信履歴</button>
              <button type="button" class="primary" id="gmailSendButton">送信</button>
            </div>
            <p id="gmailSendStatus" class="gmail-status"></p>
          </div>
        </div>
      </section>

      <section class="gmail-modal" id="gmailSettingsModal" aria-hidden="true">
        <div class="gmail-dialog gmail-dialog-small" role="dialog" aria-modal="true">
          <header class="gmail-dialog-header">
            <strong>Gmail・Azure設定</strong>
            <button type="button" class="ghost" id="gmailSettingsCloseButton">閉じる</button>
          </header>
          <div class="gmail-form">
            <label>Azure Functions URL<input id="gmailApiBaseUrl" type="url" placeholder="https://xxxx.azurewebsites.net"></label>
            <p class="gmail-helper">URLはこの端末のブラウザに保存されます。Google Client Secretは入力しません。</p>
            <button type="button" class="primary" id="gmailSaveSettingsButton">設定を保存</button>
          </div>
        </div>
      </section>

      <section class="gmail-modal" id="gmailHistoryModal" aria-hidden="true">
        <div class="gmail-dialog" role="dialog" aria-modal="true">
          <header class="gmail-dialog-header">
            <strong>Gmail送信履歴</strong>
            <button type="button" class="ghost" id="gmailHistoryCloseButton">閉じる</button>
          </header>
          <div id="gmailHistoryList" class="gmail-history-list"></div>
        </div>
      </section>
    `);
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("gmail-modal-open");
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    if (!["gmailComposeModal", "gmailSettingsModal", "gmailHistoryModal"].some((modalId) => $(modalId)?.getAttribute("aria-hidden") === "false")) {
      document.body.classList.remove("gmail-modal-open");
    }
  }

  async function request(path, options = {}) {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": config.userId,
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok === false) throw new Error(body.error || `通信に失敗しました（${response.status}）`);
    return body;
  }

  async function refreshStatus() {
    const status = $("gmailConnectionStatus");
    if (!config.apiBaseUrl) {
      if (status) status.textContent = "Azure Functions URLが未設定です";
      return false;
    }
    try {
      const result = await request("status", { method: "GET" });
      if (status) status.textContent = result.connected ? `接続済み: ${result.email || "Gmail"}` : "Gmail未接続";
      return result.connected;
    } catch (error) {
      if (status) status.textContent = `接続確認エラー: ${error.message}`;
      return false;
    }
  }

  function openCompose() {
    $("gmailSubject").value = defaultSubject();
    $("gmailBody").value = defaultBody();
    $("gmailSendStatus").textContent = "";
    openModal("gmailComposeModal");
    refreshStatus();
  }

  async function fileToAttachment(file) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("ファイルを読み込めませんでした"));
      reader.readAsDataURL(file);
    });
    return { fileName: file.name, mimeType: file.type || "application/octet-stream", base64 };
  }

  async function sendMail() {
    const button = $("gmailSendButton");
    const status = $("gmailSendStatus");
    button.disabled = true;
    status.textContent = "送信中...";
    try {
      const connected = await refreshStatus();
      if (!connected) throw new Error("先にGmailを接続してください");
      const files = Array.from($("gmailAttachments").files || []);
      const attachments = await Promise.all(files.map(fileToAttachment));
      const payload = {
        to: $("gmailTo").value,
        cc: $("gmailCc").value,
        bcc: $("gmailBcc").value,
        subject: $("gmailSubject").value,
        body: $("gmailBody").value,
        attachments,
        relatedProjectId: value("projectSelect"),
        relatedEstimateId: value("quoteNo"),
      };
      const result = await request("send", { method: "POST", body: JSON.stringify(payload) });
      status.textContent = `送信しました（メッセージID: ${result.messageId || "-"}）`;
      status.className = "gmail-status is-success";
    } catch (error) {
      status.textContent = `送信できませんでした: ${error.message}`;
      status.className = "gmail-status is-error";
    } finally {
      button.disabled = false;
    }
  }

  async function showHistory() {
    openModal("gmailHistoryModal");
    const list = $("gmailHistoryList");
    list.innerHTML = "<p>読み込み中...</p>";
    try {
      const result = await request("history?limit=100", { method: "GET" });
      if (!result.items?.length) {
        list.innerHTML = "<p>送信履歴はありません。</p>";
        return;
      }
      list.innerHTML = result.items.map((item) => `
        <article class="gmail-history-item">
          <div><strong>${escapeHtml(item.subject || "（件名なし）")}</strong><span>${escapeHtml(item.status === "sent" ? "送信済み" : "失敗")}</span></div>
          <p>宛先: ${escapeHtml(item.to)}</p>
          <p>${escapeHtml(item.sentAt ? new Date(item.sentAt).toLocaleString("ja-JP") : "")}</p>
          ${item.errorMessage ? `<p class="is-error">${escapeHtml(item.errorMessage)}</p>` : ""}
        </article>
      `).join("");
    } catch (error) {
      list.innerHTML = `<p class="is-error">${escapeHtml(error.message)}</p>`;
    }
  }

  function bindEvents() {
    $("gmailComposeButton")?.addEventListener("click", openCompose);
    $("gmailPreviewSendButton")?.addEventListener("click", openCompose);
    $("gmailComposeCloseButton")?.addEventListener("click", () => closeModal("gmailComposeModal"));
    $("gmailSettingsButton")?.addEventListener("click", () => {
      $("gmailApiBaseUrl").value = config.apiBaseUrl;
      openModal("gmailSettingsModal");
    });
    $("gmailSettingsCloseButton")?.addEventListener("click", () => closeModal("gmailSettingsModal"));
    $("gmailSaveSettingsButton")?.addEventListener("click", () => {
      const url = $("gmailApiBaseUrl").value.trim().replace(/\/$/, "");
      localStorage.setItem("chibana-gmail-api-base-url", url);
      config.apiBaseUrl = url;
      closeModal("gmailSettingsModal");
      refreshStatus();
    });
    $("gmailConnectButton")?.addEventListener("click", () => {
      try {
        window.location.href = apiUrl("connect");
      } catch (error) {
        $("gmailSendStatus").textContent = error.message;
      }
    });
    $("gmailSendButton")?.addEventListener("click", sendMail);
    $("gmailHistoryButton")?.addEventListener("click", showHistory);
    $("gmailHistoryCloseButton")?.addEventListener("click", () => closeModal("gmailHistoryModal"));
    document.querySelectorAll(".gmail-modal").forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal(modal.id);
      });
    });
  }

  function handleOAuthResult() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected" || params.get("gmail") === "compose") {
      history.replaceState(null, "", window.location.pathname + window.location.hash);
      setTimeout(openCompose, 100);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureUi();
    bindEvents();
    handleOAuthResult();
  });
})();
