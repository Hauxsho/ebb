// Claude Usage Bar — background.js
// Reads lastActiveOrg cookie, fetches usage, stores it

async function fetchAndStoreUsage() {
  try {
    // Get org ID from Claude's cookie
    const cookie = await chrome.cookies.get({
      url: "https://claude.ai",
      name: "lastActiveOrg"
    });

    if (!cookie?.value) return;
    const orgId = cookie.value;

    const res = await fetch(`https://claude.ai/api/organizations/${orgId}/usage`, {
      credentials: "include"
    });

    if (!res.ok) return;
    const data = await res.json();

    if (data?.five_hour !== undefined || data?.seven_day !== undefined) {
      const usage = {
        fiveHourPct: data.five_hour?.utilization ?? null,
        fiveHourReset: data.five_hour?.resets_at || null,
        sevenDayPct: data.seven_day?.utilization ?? null,
        fetchedAt: Date.now(),
      };
      await chrome.storage.local.set({ claudeUsage: JSON.stringify(usage) });

      // Notify any open claude.ai tabs to update their bar
      const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: "USAGE_UPDATED", usage }).catch(() => { });
      }
    }
  } catch (_) { }
}

// Fetch on install and every 5 minutes
chrome.runtime.onInstalled.addListener(() => {
  fetchAndStoreUsage();
  chrome.alarms.create("fetchUsage", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchUsage") fetchAndStoreUsage();
});

// Also fetch when a Claude tab becomes active
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab.url?.includes("claude.ai")) fetchAndStoreUsage();
});

// Handle fetch request from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FETCH_USAGE") {
    fetchAndStoreUsage();
  }
});
