
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 1. Import both services
    const { fetchWeatherAndSensors } = await import('./lib/weather_data.js');
    const { fetchPower } = await import('./lib/power_data.js');
    const { startFeederDailyAlertScheduler } = await import('./lib/feeder_fill_monitor.js');

    console.log("🚀 SERVER STARTUP: Initializing Background Services...");

    // --- WEATHER SERVICE (60 Second Delay) ---
    try {
      fetchWeatherAndSensors(); // Run immediately
      setInterval(() => {
        fetchWeatherAndSensors();
      }, 60000); 
      console.log("✅ Weather Loop initialized (60s)");
    } catch (err) {
      console.error("❌ Weather Loop failed to start:", err);
    }

    // --- POWER SERVICE (1 Second Delay) ---
    try {
      fetchPower(); // Run immediately
      setInterval(() => {
        fetchPower();
      }, 10000); 
      console.log("✅ Power Loop initialized (10s)");
    } catch (err) {
      console.error("❌ Power Loop failed to start:", err);
    }

    // --- FEEDER LOW-FILL ALERT SERVICE ---
    try {
      startFeederDailyAlertScheduler();
      console.log("✅ Feeder Alert Scheduler initialized (daily)");
    } catch (err) {
      console.error("❌ Feeder Alert Scheduler failed to start:", err);
    }
  }
}