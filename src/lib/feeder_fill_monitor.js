import { FEEDER_FILL_MAX_CM, getFillMetrics } from "./feeder_fill";
import { sendFeederLowFillEmail } from "./email_alerts";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ALERT_STATE_FILE = path.join(process.cwd(), ".next", "feeder-alert-state.json");

if (!global.feederFillAlertStore) {
  global.feederFillAlertStore = {
    lastPercent: null,
    lastCheckedAt: null,
    lastAlertAt: null,
    lastDailyCheckDate: null,
    stateLoaded: false,
    schedulerStarted: false,
    schedulerTimerId: null,
  };
}

function getMonitorConfig() {
  return {
    feederUrl: process.env.PI_FEEDER_URL,
    thresholdPercent: Number(process.env.FEEDER_FILL_ALERT_THRESHOLD ?? 10),
    checkHour: Number(process.env.FEEDER_FILL_ALERT_HOUR ?? 17),
    checkMinute: Number(process.env.FEEDER_FILL_ALERT_MINUTE ?? 0),
    maxDistanceCm: Number(process.env.FEEDER_FILL_MAX_CM ?? FEEDER_FILL_MAX_CM),
  };
}

function formatConfigForLog(config) {
  return `feederUrl=${config.feederUrl ? "set" : "missing"} threshold=${config.thresholdPercent} check=${String(
    config.checkHour
  ).padStart(2, "0")}:${String(config.checkMinute).padStart(2, "0")} maxDistanceCm=${config.maxDistanceCm}`;
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextScheduledTime(now, hour, minute) {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function loadAlertState(store) {
  if (store.stateLoaded) return;

  try {
    const raw = readFileSync(ALERT_STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.lastDailyCheckDate === "string") {
      store.lastDailyCheckDate = parsed.lastDailyCheckDate;
    }
    if (typeof parsed.lastAlertAt === "string") {
      store.lastAlertAt = parsed.lastAlertAt;
    }
  } catch {}

  console.log(
    `[feeder-alert] state loaded lastDailyCheckDate=${store.lastDailyCheckDate ?? "null"} lastAlertAt=${store.lastAlertAt ?? "null"}`
  );

  store.stateLoaded = true;
}

function saveAlertState(store) {
  try {
    mkdirSync(path.dirname(ALERT_STATE_FILE), { recursive: true });
    writeFileSync(
      ALERT_STATE_FILE,
      JSON.stringify(
        {
          lastDailyCheckDate: store.lastDailyCheckDate,
          lastAlertAt: store.lastAlertAt,
        },
        null,
        2
      ),
      "utf8"
    );
  } catch (err) {
    console.error("[feeder-alert] failed to persist state:", err);
  }
}

export async function checkFeederFillAndAlert() {
  const config = getMonitorConfig();
  const store = global.feederFillAlertStore;
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  console.log(`[feeder-alert] check started now=${now.toISOString()} config=${formatConfigForLog(config)}`);

  loadAlertState(store);

  if (!config.feederUrl) {
    console.warn("[feeder-alert] check skipped: PI_FEEDER_URL is missing");
    return;
  }

  if (store.lastDailyCheckDate === todayKey) {
    console.log(
      `[feeder-alert] check skipped: already processed today (${todayKey}); lastAlertAt=${store.lastAlertAt ?? "null"}`
    );
    return;
  }

  try {
    const res = await fetch(`${config.feederUrl}/sensor/distance`, { cache: "no-store" });
    if (!res.ok) {
      console.error(`[feeder-alert] Failed to fetch feeder fill: ${res.status}`);
      return;
    }

    const data = await res.json();
    const payload = data?.result ?? data?.data ?? data ?? null;
    const metrics = getFillMetrics(payload, config.maxDistanceCm);

    console.log(
      `[feeder-alert] metrics distanceCm=${metrics.distanceCm ?? "null"} percent=${metrics.percent ?? "null"} measuredAt=${metrics.measuredAt ?? "null"}`
    );

    store.lastCheckedAt = new Date().toISOString();
    store.lastPercent = metrics.percent;

    if (metrics.percent == null) {
      console.warn("[feeder-alert] check ended: percent is null, marking day as processed");
      store.lastDailyCheckDate = todayKey;
      saveAlertState(store);
      return;
    }

    if (metrics.percent > config.thresholdPercent) {
      console.log(
        `[feeder-alert] check ended: percent ${metrics.percent}% is above threshold ${config.thresholdPercent}%`
      );
      store.lastDailyCheckDate = todayKey;
      saveAlertState(store);
      return;
    }

    if (metrics.percent <= config.thresholdPercent) {
      console.log(
        `[feeder-alert] threshold breached: percent ${metrics.percent}% <= ${config.thresholdPercent}%, attempting email`
      );
      const emailResult = await sendFeederLowFillEmail({
        thresholdPercent: config.thresholdPercent,
        currentPercent: metrics.percent,
        distanceCm: metrics.distanceCm,
        measuredAt: metrics.measuredAt,
      });

      console.log(`[feeder-alert] email result: ${JSON.stringify(emailResult)}`);

      store.lastDailyCheckDate = todayKey;
      if (!emailResult.ok) {
        console.warn("[feeder-alert] check ended: email not sent successfully, day marked processed");
        saveAlertState(store);
        return;
      }

      if (emailResult.ok) {
        store.lastAlertAt = new Date().toISOString();
        saveAlertState(store);
        console.log(`[feeder-alert] Daily low-fill email sent (${metrics.percent}%)`);
      }
    }
  } catch (err) {
    console.error("[feeder-alert] monitor error:", err);
  }
}

function scheduleNextDailyRun() {
  const store = global.feederFillAlertStore;
  const { checkHour, checkMinute } = getMonitorConfig();
  const now = new Date();
  const nextRun = getNextScheduledTime(now, checkHour, checkMinute);
  const delayMs = Math.max(1, nextRun.getTime() - now.getTime());

  store.schedulerTimerId = setTimeout(async () => {
    try {
      await checkFeederFillAndAlert();
    } finally {
      scheduleNextDailyRun();
    }
  }, delayMs);

  console.log(`[feeder-alert] Next daily check scheduled for ${nextRun.toLocaleString()}`);
}

export function startFeederDailyAlertScheduler() {
  const store = global.feederFillAlertStore;
  if (store.schedulerStarted) {
    console.log("[feeder-alert] scheduler start ignored: already started");
    return;
  }

  store.schedulerStarted = true;
  console.log("[feeder-alert] scheduler starting");
  scheduleNextDailyRun();
}
