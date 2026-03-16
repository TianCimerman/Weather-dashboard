
"use client";

import React, { useEffect} from 'react';
import WeatherWidget from "@/components/outside";
import Inside_Temp from "@/components/inside";
import Time from "@/components/time";
import TemperatureGauge from "@/components/power";
import Navbar from '@/components/navbar';

function App() {
    useEffect(() => {
      document.body.classList.add("overflow-hidden");
        if (window.innerWidth <= 639) {
            document.body.style.overflowY = 'auto';
            document.body.style.overflowX = 'hidden';
          }

      return () => {

      };
    }, []);


  return (
    <div className="h-screen w-screen bg-[#303946] flex overflow-hidden">
      {/* MAIN CONTENT (left) */}
      <div className="flex-1 h-full overflow-hidden">
        <div className="h-full overflow-y-auto pt-5 pl-16 hss:pt-0 hss:pl-0 sl:p-0">
          <div className="flex flex-col md:flex-row items-start gap-5 hss:ml-5 sl:ml-0">
            <WeatherWidget />
            <div className="md:mt-[2.4rem] md:ml-[-4rem] sl:hidden">
              <Time />
            </div>
          </div>

          {/* Inside Temp + Gauge */}
          <div className="flex flex-col md:flex-row gap-5 mt-4 md:mt-[-1rem] hss:ml-5">
            <div className="mt-1 md:mt-[-2rem] sl:mt-[-5rem]">
              <Inside_Temp />
            </div>

            <div className="mt-[-10.5rem] hss:mt-[-5.3rem] sl:mt-[-2.5rem] sl:ml-[1rem] sl:pb-[1rem]">
              <TemperatureGauge />
            </div>
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
}


export default App;