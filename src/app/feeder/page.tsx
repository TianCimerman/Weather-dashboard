"use client";

import Status from "@/components_feeder/status";
import Navbar from '@/components/navbar';
import Header from "@/components_feeder/header";
import Schedules from "@/components_feeder/scheedules_edit";
import Logs from "@/components_feeder/logs";
import Fill from "@/components_feeder/fill";


export default function FeederDashboard() {
  return (
    <div className="feeder-bg feeder-page min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-row sl:flex-col">
      <div className="flex-1 flex flex-col">
        <h1 className="relative z-10 text-white text-4xl font-bold text-center p-5 sl:w-5/5 sl:mr-4">Feeder Dashboard</h1>
        <div className="relative z-10 w-full items-center sl:w-5/5 ">
          <Header />
        </div>
        <div className="relative z-10 feeder-main flex gap-20 h-full overflow-hidden p-6 hss:gap-10  sl:flex-col sl:gap-6">
          <div className="w-1/4 sl:w-full">
            <Status />
          </div>
          <div className="w-2/6 gap-6 flex flex-col sl:w-full">
            <Schedules />
            <Fill />
          </div>
          <div className="w-2/6 sl:w-full">
            <Logs />
          </div>
        </div>

      </div>
      <Navbar />
    </div>
  );
}






