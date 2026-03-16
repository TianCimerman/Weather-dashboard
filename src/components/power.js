"use client";
import React, { useEffect, useMemo, useState } from 'react';
import GaugeChart from 'react-gauge-chart';

export default function PowerGauge() {
  const [power, setPower] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/power");
        
        if (res.status === 503) {
          console.log("Power cache warming up...");
          return; 
        }

        const json = await res.json();
        
        // json.value comes from your global.powerStore.cachedData
        if (json && json.value !== undefined) {
          setPower(json.value);
          setLoading(false);
        }
      } catch (err) {
        console.error("Power fetch error:", err);
      }
    }

    load();
    const interval = setInterval(load, 5000); // 1 second refresh for the gauge
    return () => clearInterval(interval);
  }, []);

  // ADJUST THESE: Set your kW range for the gauge
  const minValue = -12; 
  const maxValue = 12; // For example: 10kW max

  const percent = useMemo(() => {
    if (power === null) return 0;
    const normalized = (power - minValue) / (maxValue - minValue);
    return Math.min(Math.max(normalized, 0), 1); // Clamp between 0 and 1
  }, [power]);

  return (
    <div 
      className="flex flex-col w-[63rem] pt-[5rem] p-15 px-10 rounded-3xl hss:w-[35.5rem] hss:p-0 h-[33rem] hss:h-[24.5rem] justify-center gap-[0.8rem] sl:w-[96%] sl:h-[60%] sl:pt-6 " 
      style={{ backgroundColor: 'hsl(218, 46%, 8%)' }}
    >
      <p className="text-[2.8rem] sl:text-[2rem] text-center font-bold pb-8 hss:text-white sl:text-[1.5rem] sl:pb-2">Power consumption</p>
      <GaugeChart
        id="custom-gauge"
        nrOfLevels={3}
        arcsLength={[0.5, 0.35, 0.15]}
        colors={['#00FF00', '#FFBF00', '#FF0000']}
        percent={percent}
        formatTextValue={() =>
          power !== null ? `${Number(power.toFixed(1))} kW` : 'Loading...'
        }
        arcPadding={0.02}
        arcWidth={0.3}
        textColor="#FFFFFF"
        needleColor="rgba(182, 182, 182, 0.97)"
        needleBaseColor="rgba(182, 182, 182, 0.97)"
        animate={false}
      />
    </div>
  );
};
