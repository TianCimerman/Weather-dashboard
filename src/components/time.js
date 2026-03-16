"use client";

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendarDays } from '@fortawesome/free-solid-svg-icons';

const Time = () => {
  const [time, setTime] = useState(new Date());
  const [showColon, setShowColon] = useState(true);
  const [mounted, setMounted] = useState(false); // ✅ New state to avoid hydration issues

  useEffect(() => {
    setMounted(true); // Mark that we're on the client
    const interval = setInterval(() => {
      setTime(new Date());
      setShowColon(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ❌ Don't render anything until client-side hydration is complete
  if (!mounted) return null;

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
const date = time.toLocaleDateString('sl-SI', { 
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
});


  return (
    <div className="flex flex-row w-[63rem] gap-[2.5rem] items-center ml-[4rem] p-[3rem] pr-[4rem]  pl-[4rem]  hss:h-[18rem] hss:pr-[0rem]  hss:pl-[0rem] rounded-3xl hss:w-[35.5rem] hss:flex-col p-[0.6rem] hss:gap-[0rem]" style={{ backgroundColor: 'hsl(218, 46%, 8%)' }}>
      <div className="flex flex-row gap-[3rem] hss:gap-[6rem] items-center hss:mt-[-2rem]">
        <FontAwesomeIcon icon={faClock} className="text-[5rem] hss:text-[5.5rem] ml-[-1.8rem] hss:text-white" />
        <p className="text-[5rem] mr-[0.5rem] hss:text-[5.5rem] hss:text-white">
          {hours}
          <span className={`${showColon ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 p-2`}>:</span>
          {minutes}
        </p>
      </div>
      <div className="flex flex-row gap-[0rem]  items-center">
        <FontAwesomeIcon icon={faCalendarDays} className="absolute text-[4.6rem] hss:text-[5.5rem] hss:text-white hss:ml-[-8.5rem] hss:absolute" />
        <p className="text-[4.3rem] hss:text-[4.5rem] hss:text-white hss:mr-[-10rem] ml-[8rem] hss:ml-0 ">{date}</p>
      </div>
    </div>
  );
};

export default Time;
