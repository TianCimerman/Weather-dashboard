"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { faFan } from '@fortawesome/free-solid-svg-icons';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { faPaw } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const pathname = usePathname();
  const [isIframeVisible, setIframeVisible] = useState(false);
  const [isIframeVisible2, setIframeVisible2] = useState(false);
  const [loadingIframe, setLoadingIframe] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const actionTokenRef = useRef(0);

const handleHomeClick = () => {
  actionTokenRef.current += 1;
  const isFeederPage = pathname?.startsWith('/feeder');
  const hasOpenIframe = isIframeVisible || isIframeVisible2 || loadingIframe;

  setIsMobileMenuOpen(false);
  setIframeVisible(false);
  setIframeVisible2(false);
  setLoadingIframe(false);

  if (isFeederPage) {
    window.location.replace('/');
    return;
  }

  if (hasOpenIframe) {
    window.location.reload();
    return;
  }

  window.location.replace('/');
};

const closeAllIframes = () => {
  actionTokenRef.current += 1;
  setIsMobileMenuOpen(false);
  setIframeVisible(false);
  setIframeVisible2(false);
  setLoadingIframe(false);
};

useEffect(() => {
  closeAllIframes();
}, [pathname]);

const handleIframeToggle = () => {
  actionTokenRef.current += 1;
  const nextVisible = !isIframeVisible;
  setIsMobileMenuOpen(false);
  setIframeVisible(nextVisible);
  setIframeVisible2(false);
  setLoadingIframe(nextVisible);
};

const handleIframeToggle2 = async () => {
  const token = actionTokenRef.current + 1;
  actionTokenRef.current = token;
  setIsMobileMenuOpen(false);
  setIframeVisible(false);
  setIframeVisible2(false);
  setLoadingIframe(true);

  await handleAutoLogin();

  if (actionTokenRef.current !== token) {
    return;
  }

  setIframeVisible2(true);
};




  const handleAutoLogin = async () => {
    const res = await fetch('/auto-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'helios' })
    });
  
    const data = await res.json();
    console.log(data);
  };


  

  return (
    <>
      <button
        type="button"
        className="fixed top-4 right-4 z-[1200] sm:hidden rounded-md bg-[#0B121E] px-3 py-2 text-white"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[1150] bg-black/40 sm:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav className="fixed right-0 top-0 z-[1100] w-[6.5rem] h-full hidden sm:flex flex-col items-center justify-between py-20 pr-2 bg-[#0B121E] text-white">
        <ul className="flex flex-col items-center justify-between h-full">
          <li>
            <button onClick={handleHomeClick} className="hover:text-gray-400" type="button">
              <FontAwesomeIcon icon={faHouse} className="text-[3.2rem]" />
            </button>
          </li>

          <li>
            <button onClick={handleIframeToggle2} className="hover:text-gray-400">
              <FontAwesomeIcon icon={faFan} className="text-[3.2rem]" />
            </button>
          </li>

          <li>
            <button onClick={handleIframeToggle} className="hover:text-gray-400">
              <FontAwesomeIcon icon={faChartLine} className="text-[3.2rem]" />
            </button>
          </li>

          <li>
            <Link href="/feeder" onClick={closeAllIframes} className="hover:text-gray-400">
              <FontAwesomeIcon icon={faPaw} className="text-[3.2rem]" />
            </Link>
          </li>
        </ul>
      </nav>

      <nav className={`fixed right-0 top-0 z-[1200] w-[6.5rem] h-full sm:hidden transition-transform duration-200 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col items-center justify-between py-20 pr-2 bg-[#0B121E] text-white`}>
        <ul className="flex flex-col items-center justify-between h-full">
          <li>
            <button onClick={handleHomeClick} className="hover:text-gray-400" type="button">
              <FontAwesomeIcon icon={faHouse} className="text-[3.2rem]" />
            </button>
          </li>

          <li>
            <button onClick={handleIframeToggle2} className="hover:text-gray-400">
              <FontAwesomeIcon icon={faFan} className="text-[3.2rem]" />
            </button>
          </li>

          <li>
            <button onClick={handleIframeToggle} className="hover:text-gray-400">
              <FontAwesomeIcon icon={faChartLine} className="text-[3.2rem]" />
            </button>
          </li>

          <li>
            <Link href="/feeder" onClick={closeAllIframes} className="hover:text-gray-400">
              <FontAwesomeIcon icon={faPaw} className="text-[3.2rem]" />
            </Link>
          </li>
        </ul>
      </nav>

{isIframeVisible && (
  <div className="pointer-events-none fixed top-0 left-0 right-0 sm:right-[6.5rem] h-screen z-50">
    <iframe
      src="http://192.168.1.160:3000"
      className="pointer-events-auto w-full h-full"
      height="100%"
      title="Grafana Dashboard"
      style={{ pointerEvents: 'auto', border: 'none' }}
      onLoad={() => setLoadingIframe(false)} // Hide loader when iframe loads
    />
  </div>
)}


{isIframeVisible2 && (
  <div className='pointer-events-none fixed top-0 left-0 right-0 sm:right-[6.5rem] h-full z-50'>
    <iframe
      src="http://192.168.1.180/info.htm"
      className="pointer-events-auto w-full h-full"
      height="100%"
      title="Ventilation Dashboard"
      style={{ pointerEvents: 'auto', border: 'none' }}
      onLoad={() => setLoadingIframe(false)} // Hide loader when iframe loads
    ></iframe>
  </div>
)}

{loadingIframe && (
  <div className="pointer-events-none fixed top-0 left-0 right-0 sm:right-[6.5rem] h-full z-[999] flex items-center justify-center bg-opacity-70" style={{ backgroundColor: 'rgb(48, 57, 70)' }}>
    <div className="text-white text-lg animate-pulse">Loading page...</div>
  </div>
)}

    </>
  );
};

export default Navbar;
