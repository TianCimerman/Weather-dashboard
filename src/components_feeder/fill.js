"use client";
import { useEffect, useState } from "react";
import { FEEDER_FILL_MAX_CM, getFillMetrics } from "@/lib/feeder_fill";

export default function FeederDashboard() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const maxDistanceCm = Number(status?.maxDistanceCm);
  const metricMaxDistance = Number.isFinite(maxDistanceCm) && maxDistanceCm > 0
    ? maxDistanceCm
    : FEEDER_FILL_MAX_CM;
  const { distanceCm, percent: distancePercent } = getFillMetrics(status, metricMaxDistance);

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
      <div className="relative w-16 h-28 border-2 border-orange-400 rounded-2xl overflow-hidden bg-[#0B121E] flex-shrink-0 s">
        <div
          className="absolute bottom-0 left-0 w-full bg-orange-500 transition-all duration-1000 ease-out"
          style={{ height: `${animatedPercent}%` }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
      </div>

      <div className="flex flex-row items-start justify-center gap-4 flex-1 ">
        <div className="text-white text-xl font-bold hss:pt-10 sl:pt-6 pt-12 sl:pl-20">
        <p className="text-white text-left text-lg font-semibold">
          Fill: {distancePercent != null ? `${distancePercent}%` : loading ? "Loading..." : "--"}
        </p>
        <p className="text-white text-left text-sm opacity-80">
          Distance: {distanceCm != null ? `${distanceCm} cm` : "--"}
        </p>
        </div>
        <img src="/images/vecteezy_cute-dog-head-color-design_50090814-removebg-preview.png" alt="Fill legend" className="hss:w-32 w-40 opacity-80 hss:ml-0 ml-10 justify-center sl:ml-0  sl:w-[8rem] sl:pt-0" />
      </div>


      </div>
        
    
  );
}
