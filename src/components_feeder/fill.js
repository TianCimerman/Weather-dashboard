"use client";
import { useEffect, useState } from "react";
import { FEEDER_FILL_MAX_CM, getFillMetrics } from "@/lib/feeder_fill";

export default function FeederDashboard() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const { distanceCm, percent: distancePercent } = getFillMetrics(status, FEEDER_FILL_MAX_CM);

  useEffect(() => {
    if (distancePercent == null) return;
    setAnimatedPercent(distancePercent);
  }, [distancePercent]);


  // Poll status every 3 seconds
  useEffect(() => {
    const loadStatus = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/feeder/fill", { cache: "no-store" });
            if (!res.ok) {
              setMessage(`Fill API error: ${res.status}`);
              setStatus(null);
              return;
            }

            const data = await res.json();
            const payload = data?.result ?? data?.data ?? data ?? null;

            if (payload && (payload.distanceCm != null || payload.distance != null)) {
              setStatus(payload);
              setMessage(null);
            } else {
              setStatus(payload);
              setMessage("No distance field in response yet");
            }

            console.log("Fetched fill status:", data);
        } catch (err) {
            console.error("fill fetch error:", err);
            setStatus(null);
            setMessage("Failed to fetch fill status");
        } finally {
            setLoading(false);
        }
    };
    loadStatus();
    const id = setInterval(loadStatus, 3000);
    return () => clearInterval(id);
  }, []);




  return (
    <div
      className="
        z-20
        border
        border-gray-300
        rounded-[32px]
        p-12
        hss:p-7
        w-full
        h-[170px]
        hss:w-[425px]
        bg-transparent
        shadow-[inset_0_0_0_3px_rgba(255,255,255,0.25)]
        flex
        flex-row
        items-center
        justify-between
        gap-4
      "
    >
      <div className="relative w-16 h-28 border-2 border-orange-400 rounded-2xl overflow-hidden bg-[#0B121E] flex-shrink-0">
        <div
          className="absolute bottom-0 left-0 w-full bg-orange-500 transition-all duration-1000 ease-out"
          style={{ height: `${animatedPercent}%` }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
      </div>

      <div className="flex flex-row items-start justify-center gap-4 flex-1">
        <div className="text-white text-xl font-bold hss:pt-10 pt-12">
        <p className="text-white text-left text-lg font-semibold">
          Fill: {distancePercent != null ? `${distancePercent}%` : loading ? "Loading..." : "--"}
        </p>
        <p className="text-white text-left text-sm opacity-80">
          Distance: {distanceCm != null ? `${distanceCm} cm` : "--"}
        </p>
        </div>
        <img src="/images/vecteezy_cute-dog-head-color-design_50090814-removebg-preview.png" alt="Fill legend" className="hss:w-32 w-40 opacity-80 hss:ml-0 ml-10 justify-center" />
      </div>


      </div>
        
    
  );
}
