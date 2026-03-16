"use client";
import { useEffect, useState } from "react";

function isConnected(heartbeat) {
  if (!heartbeat) return false;
  const diff = Date.now() - new Date(heartbeat).getTime();
  return diff < 10000; // 10 seconds
}


export default function FeederDashboard() {
  const [status, setStatus] = useState(null);

  const connected = status ? isConnected(status.heartbeat) : false;

  useEffect(() => {
    const loadStatus = () => {
      fetch("/api/feeder/status", { cache: "no-store" })
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => setStatus(null));
    };

    loadStatus();
    const id = setInterval(loadStatus, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-5 w-full items-center text-center justify-center mb-4">
        <h1 className="text-white text-2xl font-bold">Connection status: </h1>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          background: connected ? "lime" : "red",
        }}
      />

      <div className="text-white font-bold text-2xl">{connected ? "Connected" : "Offline"}</div>
    </div>
  );
}
