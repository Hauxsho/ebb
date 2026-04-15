// Ebb — content.js
// Shows Claude usage inline in the chat toolbar
(function () {
  "use strict";

  let usageData = null;
  let injected = false;
  let retryTimer = null;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "USAGE_UPDATED" && msg.usage) {
      usageData = msg.usage;
      renderBar();
    }
  });

  function formatReset(dateStr) {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - Date.now();
    if (diff <= 0) return "resetting…";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function buildBar() {
    const bar = document.createElement("div");
    bar.id = "ebb-bar";
    bar.className = "ebb-loading";
    bar.title = "Ebb — Claude usage";
    bar.innerHTML = `
    <span class="ebb-segments">
      <span class="ebb-segment">
        <span class="ebb-label">5h</span>
        <span class="ebb-track ebb-track-5h"><span class="ebb-fill ebb-fill-5h" style="width:0%"></span></span>
        <span class="ebb-pct" id="ebb-pct-5h">—</span>
      </span>
      <span class="ebb-dot"></span>
      <span class="ebb-segment">
        <span class="ebb-label">7d</span>
        <span class="ebb-track ebb-track-7d"><span class="ebb-fill ebb-fill-7d" style="width:0%"></span></span>
        <span class="ebb-pct" id="ebb-pct-7d">—</span>
      </span>
      <span class="ebb-dot"></span>
      <span class="ebb-reset" id="ebb-reset"></span>
    </span>
  `;
    return bar;
  }

  function renderBar() {
    const bar = document.getElementById("ebb-bar");
    if (!bar) return;

    bar.classList.remove("ebb-loading", "ebb-warn", "ebb-danger");

    if (!usageData) {
      bar.classList.add("ebb-loading");
      return;
    }

    const { fiveHourPct, fiveHourReset, sevenDayPct } = usageData;

    const p5 = fiveHourPct !== null ? Math.round(fiveHourPct) : null;
    const p7 = sevenDayPct !== null ? Math.round(sevenDayPct) : null;

    if (p5 !== null) {
      bar.querySelector(".ebb-fill-5h").style.width = p5 + "%";
      bar.querySelector("#ebb-pct-5h").textContent = p5 + "%";
    }
    if (p7 !== null) {
      bar.querySelector(".ebb-fill-7d").style.width = p7 + "%";
      bar.querySelector("#ebb-pct-7d").textContent = p7 + "%";
    }

    const resetStr = formatReset(fiveHourReset);
    bar.querySelector("#ebb-reset").textContent = resetStr ? "↺ " + resetStr : "";

    if (p5 !== null) {
      if (p5 >= 90) bar.classList.add("ebb-danger");
      else if (p5 >= 70) bar.classList.add("ebb-warn");
    }
  }

  function inject() {
    if (injected && document.getElementById("ebb-bar")) return;

    const anchor = document.querySelector('div.relative.flex.gap-2.w-full.items-center');
    if (!anchor) {
      if (!retryTimer) retryTimer = setInterval(inject, 800);
      return;
    }

    clearInterval(retryTimer);
    retryTimer = null;

    const bar = buildBar();
    const first = anchor.firstChild;
    if (first?.nextSibling) anchor.insertBefore(bar, first.nextSibling);
    else anchor.appendChild(bar);

    injected = true;

    chrome.storage.local.get("claudeUsage", ({ claudeUsage }) => {
      if (claudeUsage) {
        try { usageData = JSON.parse(claudeUsage); } catch (_) { }
      }
      // Small delay to ensure bar is fully in DOM before rendering
      setTimeout(() => renderBar(), 100);
      chrome.runtime.sendMessage({ type: "FETCH_USAGE" }).catch(() => { });
    });
  }

  new MutationObserver(() => {
    if (!document.getElementById("ebb-bar")) { injected = false; inject(); }
  }).observe(document.body, { childList: true, subtree: true });

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", inject)
    : inject();

  setInterval(() => { if (usageData) renderBar(); }, 60000);
})();
