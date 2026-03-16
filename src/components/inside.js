"use client";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTemperatureLow } from '@fortawesome/free-solid-svg-icons';
import { faTint } from '@fortawesome/free-solid-svg-icons';


const FloorSwitch = ({ floor, setFloor }) => {

  return (
    <div  style={{ backgroundColor: 'hsl(218, 30.50%, 23.10%)' }} className=" sl:text-[0.8rem] inline-flex rounded-full p-1 select-none cursor-pointer mt-8 w-[8.8rem] ml-[1.5rem] sl:w-[6.5rem] ">
      {/* First Floor */}
      <div
        onClick={() => setFloor("first")}
        className="px-2 py-1 sl:px-1 sl:py-0.5 rounded-full transition-colors duration-300 cursor-pointer select-none text-gray-400"
        style={
          floor === "first"
            ? { backgroundColor: 'hsl(217, 39.60%, 10.40%)', color: 'white' } // Replace with your desired color values
            : { backgroundColor: 'transparent', color: 'gray' }
        }
      >
        1.Floor
      </div>

      {/* Second Floor */}
      <div
        onClick={() => setFloor("second")}
        className="px-2 py-1 sl:px-1 sl:py-0.5 rounded-full transition-colors duration-300 cursor-pointer select-none"
        style={
          floor === "second"
            ? { backgroundColor: 'hsl(217, 39.60%, 10.40%)', color: 'white' } // Replace with your desired color values
            : { backgroundColor: 'transparent', color: 'gray' }
        } 
      >
        2.Floor
      </div>
    </div>
  );
};

export default function WeatherWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [floor, setFloor] = useState("first");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weather");
        
        // If the server is still warming up (503), keep loading
        if (res.status === 503) {
          console.log("Server cache warming up...");
          return; 
        }

        const json = await res.json();
        
        // Check if json actually has the sensors array before stopping the loader
        if (json && json.sensors) {
          setData(json);
          setLoading(false);


        }
      } catch (err) {
        console.error("Frontend fetch error:", err);
        // We don't set loading to false here so it tries again in 60s
      }
    }

    load();
    const interval = setInterval(load, 10000); // Check every 10s until loaded
    return () => clearInterval(interval);
  }, []);

  // Show a nice loading state instead of a blank screen
  if (loading || !data) {
    return (
      <div 
        style={{ backgroundColor: "hsl(218, 46%, 8%)" }}
        className="w-[38.33rem] rounded-3xl m-[2.5rem] p-[1.5rem] h-[26rem] flex items-center justify-center"
      >
        <p className="text-white text-xl animate-pulse">Initializing Sensors...</p>
      </div>
    );
  }

  const weather = data.weather;



  return (
    <div style={{ backgroundColor: 'hsl(218, 46%, 8%)' }} className="relative w-[38rem] rounded-3xl m-[2.5rem] p-[1.5rem] hss:p-[1rem] h-[22rem] hss:h-[19rem] hss:w-[29rem] ml-[1.5rem] ml-[0.225rem] sl:w-[90%] sl:items-center sl:h-[80%]">
      <p className="text-[3.125rem] text-center font-bold sl:text-[2rem] sl:mr-[6rem] hss:text-white">Inside</p>
      <div className="absolute top-12 right-5 sl:top-0 sl:right-3">
        <FloorSwitch floor={floor} setFloor={setFloor} />
      </div>
      <div className="flex flex-row pt-[2.5rem] sl:pt-[0.5rem]">
        <div className="flex flex-col gap-[2.5rem] items-center ml-[1.5rem] pt-[1rem] p-[1.25rem] rounded-3xl w-[5rem] sl:text-[0.8rem] sl:ml-0 sl:gap-[1rem]">
          <FontAwesomeIcon icon={faTemperatureLow} color="orange" className="text-5xl sl:text-3xl" />
          <FontAwesomeIcon icon={faTint}color="orange" className="pr-[0.1875rem] text-5xl sl:text-3xl"/>
        </div>
        <div className={`flex flex-col gap-[0.125rem] items-center ml-[7.5rem] pt-[0.5rem] hss:ml-[2.5rem] sl:ml-0 ${floor === "first" ? "block" : "hidden"}`}>
          <div className="flex flex-row gap-[2rem] items-center">
            <p className="text-[2.8rem] sl:text-[1.5rem] hss:text-white">{data.sensors.find((d) => d._field === "temperature_in")?._value ?? "--"}°C</p>
          </div>
          <div className="flex flex-row gap-[2.5rem] items-center pt-[1rem] ">
            <p className="text-[2.8rem] sl:text-[1.5rem] hss:text-white ">{data.sensors.find((d) => d._field === "humidity_in")?._value ?? "--"}%</p>
          </div>
        </div>
                <div className={`flex flex-col gap-[0.125rem] items-center ml-[7.5rem] pt-[0.5rem] hss:ml-[2.5rem] sl:ml-0 ${floor === "second" ? "block" : "hidden"}`}>
          <div className="flex flex-row gap-[2rem] items-center">
            <p className="text-[2.8rem] sl:text-[1.5rem] hss:text-white">{data.sensors.find((d) => d._field === "temperature_in_2")?._value ?? "--"}°C</p>
          </div>
          <div className="flex flex-row gap-[2.5rem] items-center pt-[1rem] ">
            <p className="text-[2.8rem] sl:text-[1.5rem] hss:text-white ">{data.sensors.find((d) => d._field === "humidity_in_2")?._value ?? "--"}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

