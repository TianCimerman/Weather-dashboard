"use client";
import { useEffect, useState } from "react";

// If you already have this elsewhere, remove this and import it instead.
function humanReason(reason) {
  if (!reason) return "Unknown";
  return String(reason);
}

function isConnected(statusPayload) {
  if (!statusPayload || typeof statusPayload !== "object") return false;

  const heartbeat =
    statusPayload.heartbeat ??
    statusPayload.lastHeartbeat ??
    statusPayload.last_heartbeat ??
    statusPayload.lastSeen ??
    statusPayload.last_seen ??
    statusPayload.updatedAt ??
    statusPayload.updated_at;

  if (!heartbeat) {
    if (statusPayload.connected === false || statusPayload.online === false) {
      return false;
    }
    return true;
  }

  const parsedHeartbeat = new Date(heartbeat).getTime();
  if (Number.isNaN(parsedHeartbeat)) return true;
  const diff = Date.now() - parsedHeartbeat;
  return diff < 10000; // 10 seconds
}

export default function FeederDashboard() {
  const [status, setStatus] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextFeedingInfo, setNextFeedingInfo] = useState(null);
  const [feedingEnabled, setFeedingEnabled] = useState(true);
  const [scheduleLoadingId, setScheduleLoadingId] = useState(null);

  // Poll status every 3 seconds
  useEffect(() => {
    const loadStatus = () => {
      fetch("/api/feeder/status", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          setStatus(data);

          if (schedules.length === 0) {
            if (typeof data?.feedingEnabled === "boolean") {
              setFeedingEnabled(data.feedingEnabled);
            } else if (typeof data?.enabled === "boolean") {
              setFeedingEnabled(data.enabled);
            } else if (typeof data?.feeding_enabled === "boolean") {
              setFeedingEnabled(data.feeding_enabled);
            }
          }
        })
        .catch(() => setStatus(null));
    };

    loadStatus();
    const id = setInterval(loadStatus, 3000);
    return () => clearInterval(id);
  }, []);

  // Load schedules once (optional)
  useEffect(() => {
    fetch("/api/feeder/schedules", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        // Ensure data is an array
        const schedulesList = Array.isArray(data) ? data : (data.schedules && Array.isArray(data.schedules) ? data.schedules : []);
        setSchedules(schedulesList);
        if (schedulesList.length > 0) {
          setFeedingEnabled(schedulesList.some((s) => s.enabled !== false));
        }
      })
      .catch(() => setSchedules([]));
  }, []);

  useEffect(() => {
    if (schedules.length === 0) return;
    setFeedingEnabled(schedules.some((s) => s.enabled !== false));
  }, [schedules]);

  // Calculate next feeding time from schedules
  useEffect(() => {
    if (schedules.length === 0) return;

    const enabledSchedules = schedules.filter(
      (schedule) => schedule.enabled !== false
    );

    if (enabledSchedules.length === 0) {
      setNextFeedingInfo(null);
      return;
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    let nextSchedule = null;
    let minutesUntil = null;

    // Sort schedules by time
    const sortedSchedules = [...enabledSchedules].sort((a, b) => {
      const timeA = a.time ? a.time.split(":").map(Number) : [0, 0];
      const timeB = b.time ? b.time.split(":").map(Number) : [0, 0];
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

    // Find next feeding today
    for (const schedule of sortedSchedules) {
      if (!schedule.time) continue;
      const [hours, mins] = schedule.time.split(":").map(Number);
      const scheduleTimeInMinutes = hours * 60 + mins;

      if (scheduleTimeInMinutes > currentTimeInMinutes) {
        nextSchedule = schedule;
        minutesUntil = scheduleTimeInMinutes - currentTimeInMinutes;
        break;
      }
    }

    // If no feeding today, next is first one tomorrow
    if (!nextSchedule && sortedSchedules.length > 0) {
      nextSchedule = sortedSchedules[0];
      const [hours, mins] = nextSchedule.time.split(":").map(Number);
      const scheduleTimeInMinutes = hours * 60 + mins;
      minutesUntil = 24 * 60 - currentTimeInMinutes + scheduleTimeInMinutes;
    }

    setNextFeedingInfo(nextSchedule && minutesUntil ? { nextSchedule, minutesUntil } : null);
  }, [schedules]);



  // Clear message after 60 seconds
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), 60000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const connected = isConnected(status);

  const feedNow = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/feeder/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: 2000 }),
      });

      // If your API route threw an error, Next might return HTML (not JSON)
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { ok: false, error: text }; }

      if (!res.ok) {
        setMessage(`❌ ${data.message || data.error || data.reason || text}`);
        return;
      }

      if (!data.ok) {
        setMessage(`❌ ${data.message || humanReason(data.error || data.reason)}`);
      } else {
        setMessage("✅ Feeding started");
      }
    } catch (e) {
      setMessage(`❌ Cannot reach feeder API: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };



  const toggleFeeding = async (newState) => {
    setLoading(true);
    setMessage(null);

    try {
      // Send toggle request for each schedule
      const requests = schedules.map((schedule) =>
        fetch("/api/feeder/schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: schedule.id,
            updates: { enabled: newState },
          }),
        })
          .then((res) => res.text())
          .then((text) => {
            let data;
            try {
              data = JSON.parse(text);
            } catch {
              data = { ok: false, error: text };
            }
            return { schedule, res: data };
          })
      );

      const results = await Promise.all(requests);
      const failures = results.filter((r) => !r.res.ok);

      if (failures.length > 0) {
        const errorMsg = failures[0].res.message || failures[0].res.error || "Failed to toggle schedules";
        setMessage(`❌ ${errorMsg}`);
        return;
      }

      // Update all schedules in state
      setSchedules((prev) =>
        prev.map((schedule) => ({
          ...schedule,
          enabled: newState,
        }))
      );

      setFeedingEnabled(newState);
      setMessage(`✅ All schedules ${newState ? "enabled" : "disabled"}`);
    } catch (e) {
      setMessage(`❌ Cannot reach feeder API: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };


  const toggleSchedule = async (scheduleId, enabled) => {
    setScheduleLoadingId(scheduleId);
    setMessage(null);

    try {
      const res = await fetch("/api/feeder/schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scheduleId,
          updates: { enabled: !enabled },
        }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { ok: false, error: text }; }

      if (!res.ok || !data.ok) {
        const errorMsg = data.message || data.error || data.reason || text;
        setMessage(`❌ ${errorMsg}`);
        return;
      }

      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, enabled: !enabled }
            : schedule
        )
      );

      setMessage(`✅ Schedule ${!enabled ? "enabled" : "disabled"}`);
    } catch (e) {
      setMessage(`❌ Cannot reach feeder API: ${String(e)}`);
    } finally {
      setScheduleLoadingId(null);
    }
  };

  return (
    <div
      className="
        z-20
        border
        border-gray-300
        rounded-[32px]
        p-10
        h-[580px]
        hss:h-[550px]
        hss:p-7
        hss:w-[325px]
        bg-transparent
        shadow-[inset_0_0_0_3px_rgba(255,255,255,0.25)]
        flex
        flex-col
        items-center
        justify-center
        gap-6
      "
    >


      <div className="w-full px-0">
        <table className="w-full text-white border border-orange-400 rounded-lg bg-orange-600 bg-opacity-10 hss:h-[100px] hss:w-full">
          <tbody>   
            <tr className="border border-orange-400 rounded-lg p-2">
              <td className="text-center p-3 hss:text-sm">Last feed:</td>  
              <td className="text-center p-3 border border-orange-400 rounded-lg hss:text-sm">Feeds today</td>
              <td className="text-center p-3 hss:text-sm"> Next feed in</td>
            </tr>
            <tr className="border border-orange-400 rounded-lg p-2">
              <td className="text-center p-3">
                {status && status.lastFeedTime
                  ? new Date(status.lastFeedTime).toLocaleTimeString()
                  : "N/A"}
              </td>
              <td className="text-center p-3 border border-orange-400 rounded-lg hss:text-sm">
                {status && status.feedsToday != null
                  ? status.feedsToday
                  : "N/A"}
              </td>
              <td className="text-center p-3 hss:text-sm">
                {nextFeedingInfo
                  ? `${Math.floor(nextFeedingInfo.minutesUntil)} min (${nextFeedingInfo.nextSchedule.time})`
                  : "N/A"}
              </td>
            </tr>
          </tbody>
        </table>
       

        {message && (
          <div className="mt-3 rounded-lg border border-orange-400 bg-orange-600/10 px-4 py-2 text-center text-white hss:text-sm">
            {message}
          </div>
        )}

      </div>  
        <button
        onClick={feedNow}
        disabled={loading || !connected}
        className="bg-orange-500 px-10 py-4 text-white rounded-xl disabled:opacity-50 md:px-6 md:py-2 hss:text-sm"
      >
        {loading ? "Feeding..." : "Feed now"}
      </button>
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold flex items-center gap-2">
            <span className={`text-xl font-bold transition-colors hss:text-lg ${
              feedingEnabled ? "text-orange-500" : "text-gray-600"}`}>✓ 
            Feeding {feedingEnabled ? "Enabled" : "Disabled"}</span>
          </span>
        </div>
        <button
          onClick={() => toggleFeeding(!feedingEnabled)}
          disabled={loading || !connected}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors hss:h-6 hss:w-12 ${
            feedingEnabled ? "bg-orange-500 " : "bg-gray-600"
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform hss:h-5 hss:w-5 ${
              feedingEnabled ? "translate-x-7 hss:translate-x-5" : "translate-x-1"
            }`}
          />

        </button>
      </div>
        <div className="flex flex-col gap-2 w-5/6 md:w-full">
          {Array.isArray(schedules) && schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`bg-opacity-20 p-2 text-white flex items-center justify-between rounded-lg ${
                schedule.enabled !== false ? "bg-orange-600" : "bg-gray-600"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-semibold">
                  {schedule.time || "No time"}
                </span>
                <span className="text-sm opacity-80">
                  {schedule.id || "No ID"}
                </span>
              </div>
              <button
                onClick={() => toggleSchedule(schedule.id, schedule.enabled !== false)}
                disabled={scheduleLoadingId === schedule.id || !connected}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  schedule.enabled !== false ? "bg-orange-600" : "bg-gray-600"
                } disabled:opacity-50`}
                aria-label="Toggle schedule"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    schedule.enabled !== false ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
          {(!Array.isArray(schedules) || schedules.length === 0) && (
            <div className="text-gray-400">No schedules set</div>
          )}
        </div>
      </div>
    
  );
}
