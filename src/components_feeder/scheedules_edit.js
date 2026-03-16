"use client";
import { useEffect, useState } from "react";

export default function SchedulesEdit() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const toSeconds = (durationValue) => {
    const duration = Number(durationValue);
    if (!Number.isFinite(duration)) return 2;
    if (duration > 100) return duration / 1000;
    return duration;
  };

  const toMilliseconds = (durationSeconds) => {
    const seconds = Number(durationSeconds);
    if (!Number.isFinite(seconds)) return 2000;
    return Math.round(seconds * 1000);
  };

  const normalizeApiMessage = (rawMessage) => {
    const messageText = String(rawMessage || "");
    if (/between\s*1000\s*and\s*5000\s*ms/i.test(messageText)) {
      return "Duration must be between 1 and 5 seconds on the feeder service";
    }
    return messageText;
  };
  
  // Form states
  const [formMode, setFormMode] = useState(null); // "add", "edit", or null
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    time: "",
    duration: "2",
    enabled: true,
  });

  // Load schedules on mount
  useEffect(() => {
    loadSchedules();
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const loadSchedules = async () => {
    try {
      const res = await fetch("/api/feeder/schedules", { cache: "no-store" });
      const text = await res.text();
      let data;
      try { 
        data = JSON.parse(text); 
      } catch { 
        console.error("Failed to parse response:", text);
        setMessage(`❌ Invalid response from server: ${text}`);
        setSchedules([]);
        return;
      }
      
      // Handle the response
      if (!res.ok) {
        setMessage(`❌ ${data.error || data.message || "Failed to load schedules"}`);
        setSchedules([]);
        return;
      }
      
      const schedulesList = Array.isArray(data) ? data : (data.schedules && Array.isArray(data.schedules) ? data.schedules : []);
      
      // Sort schedules by time (HH:MM format)
      schedulesList.sort((a, b) => {
        const timeA = a.time || "00:00";
        const timeB = b.time || "00:00";
        return timeA.localeCompare(timeB);
      });
      
      setSchedules(schedulesList);
      console.log("Loaded schedules:", schedulesList);
    } catch (e) {
      console.error("Error loading schedules:", e);
      setMessage(`❌ Failed to load schedules: ${String(e)}`);
      setSchedules([]);
    }
  };

  const validateForm = () => {
    // Validate time format HH:MM
    if (!/^\d{2}:\d{2}$/.test(formData.time)) {
      setMessage("❌ Time must be in HH:MM format (e.g., 07:30)");
      return false;
    }

    // Validate duration 1-50 seconds
    const duration = Number(formData.duration);
    if (formData.duration === "" || !Number.isFinite(duration) || duration < 1 || duration > 50) {
      setMessage("❌ Duration must be between 1 and 50 seconds");
      return false;
    }

    // Validate ID
    if (!formData.id || formData.id.trim() === "") {
      setMessage("❌ ID cannot be empty");
      return false;
    }

    // Check for duplicate IDs (when adding, or when editing with different ID)
    if (formMode === "add") {
      if (schedules.some(s => s.id === formData.id)) {
        setMessage("❌ ID already exists");
        return false;
      }
    } else if (formMode === "edit" && formData.id !== editingId) {
      if (schedules.some(s => s.id === formData.id)) {
        setMessage("❌ ID already exists");
        return false;
      }
    }

    return true;
  };

  const handleAddClick = () => {
    setFormMode("add");
    setEditingId(null);
    setFormData({ id: "", time: "", duration: "2", enabled: true });
    setMessage(null);
  };

  const handleEditClick = (schedule) => {
    setFormMode("edit");
    setEditingId(schedule.id);
    setFormData({
      id: schedule.id,
      time: schedule.time,
      duration: String(toSeconds(schedule.duration)),
      enabled: schedule.enabled !== false,
    });
    setMessage(null);
  };

  const handleCancel = () => {
    setFormMode(null);
    setEditingId(null);
    setFormData({ id: "", time: "", duration: "2", enabled: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let endpoint = "/api/feeder/schedules";
      let method = "POST";
      let body = {
        ...formData,
        duration: toMilliseconds(formData.duration),
      };

      if (formMode === "edit") {
        endpoint = `/api/feeder/schedules`;
        method = "PUT";
        body = {
          id: editingId,
          updates: {
            time: formData.time,
            duration: toMilliseconds(formData.duration),
            enabled: formData.enabled,
          },
        };
      }

      console.log(`Sending ${method} to ${endpoint}:`, body);

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      console.log(`Response (${res.status}):`, text);
      
      let data;
      try { data = JSON.parse(text); } catch { data = { ok: false, message: text }; }

      if (!res.ok || !data.ok) {
        setMessage(`❌ ${data.message || data.error || "Operation failed"}`);
      } else {
        setMessage(`✅ ${data.message || (formMode === "add" ? "Schedule added" : "Schedule updated")}`);
        await loadSchedules();
        handleCancel();
      }
    } catch (e) {
      setMessage(`❌ Error: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete schedule "${id}"?`)) return;

    setLoading(true);

    try {
      const res = await fetch("/api/feeder/schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { ok: false, message: text }; }

      if (!res.ok || !data.ok) {
        setMessage(`❌ ${data.message || data.error || "Delete failed"}`);
      } else {
        setMessage(`✅ ${data.message || "Schedule deleted"}`);
        await loadSchedules();
      }
    } catch (e) {
      setMessage(`❌ Error: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl         
        border
        border-gray-300
        rounded-[32px]
        p-10
        hss:p-7
        hss:w-[425px]
         ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-bold hss:text-xl">Schedule Manager</h2>
        <div className="flex gap-2">
          {!formMode && (
            <>
              <button
                onClick={handleAddClick}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 hss:px-3 hss:py-1 text-sm"
                disabled={loading}
              >
                + Add Schedule
              </button>
            </>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`text-white text-center p-3 rounded-lg hss:text-sm ${
          message.includes("Cannot POST") ? "bg-red-800" : "bg-gray-700"
        }`}>
          {message}
          {message.includes("Cannot POST") && (
            <div className="text-sm mt-2 text-gray-300">
              Note: Your Pi Feeder service doesn't support adding/editing schedules via API.
              <br />Configure schedules directly on the Pi or check the Pi Feeder documentation.
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {formMode && (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg flex flex-col gap-4 hss:p-4">
          <h3 className="text-white text-lg font-semibold md:text-base">
            {formMode === "add" ? "Add New Schedule" : "Edit Schedule"}
          </h3>

          {/* ID field (disabled when editing) */}
          <div className="flex flex-col gap-2">
            <label className="text-white">ID / Name</label>
            <input
              type="text"
              disabled={formMode === "edit"}
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="e.g., morning-feed"
              className="bg-gray-700 text-white px-3 py-2 rounded disabled:opacity-50"
            />
          </div>

          {/* Time field */}
          <div className="flex flex-col gap-2">
            <label className="text-white">Time (HH:MM)</label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              placeholder="07:30"
              pattern="\d{2}:\d{2}"
              className="bg-gray-700 text-white px-3 py-2 rounded hss:px-2 hss:py-1"
            />
          </div>

          {/* Duration field */}
          <div className="flex flex-col gap-2">
            <label className="text-white">Duration (seconds: 1-50)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              min="1"
              max="50"
              step="1"
              className="bg-gray-700 text-white px-3 py-2 rounded"
            />
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center gap-3">
            <label className="text-white">Enabled</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className={`w-14 h-8 rounded-full transition-colors ${
                formData.enabled ? "bg-orange-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`block w-6 h-6 bg-white rounded-full transition-transform ${
                  formData.enabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Form buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Schedules List */}
      <div className="flex flex-col gap-3">
        {!Array.isArray(schedules) || schedules.length === 0 ? (
          <div className="text-gray-400 text-center p-4">No schedules configured</div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="text-white font-semibold">{schedule.id}</div>
                <div className="text-gray-400 text-sm">
                  {schedule.time} • {toSeconds(schedule.duration)}s •{" "}
                  <span className={schedule.enabled !== false ? "text-green-400" : "text-red-400"}>
                    {schedule.enabled !== false ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(schedule)}
                  disabled={loading || formMode !== null}
                  className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50 text-sm md:px-2 hss:py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  disabled={loading || formMode !== null}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 text-sm md:px-2 hss:py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
