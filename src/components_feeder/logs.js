"use client";
import { useEffect, useState } from "react";



export default function FeederLogs() {
  const [status, setStatus] = useState(null);

  // Poll logs every 3 seconds
  useEffect(() => {
    const loadLogs = () => {
      fetch(`/api/feeder/logs?lines=20`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          
          if (data.error) {
            console.error("Logs error:", data.error);
            setStatus(null);
          } else {
            setStatus(data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch logs:", err);
          setStatus(null);
        });
    };

    loadLogs();
    const id = setInterval(loadLogs, 3000);
    return () => clearInterval(id);
  }, []);



  return (
    <div
      className="
        z-20
        border
        border-gray-300
        rounded-[32px]
        p-8
        hss:p-6
        w-[400px]
        bg-transparent
        shadow-[inset_0_0_0_3px_rgba(255,255,255,0.25)]
        flex
        flex-col
        items-center
        justify-center
        gap-6 
        hss:w-[320px]
        hss:h-[550px]
        sl:w-[370px]
      "
    >
        <h1 className="text-white text-3xl font-bold">Feeder Logs</h1>

        {status && status.logs && (
          <div className="text-gray-300 text-sm w-full text-right">
            {(() => {
              const relevantLogsCount = status.logs.filter(log => {
                const message = String(log.message || log.line || log).toLowerCase();
                const isFeeding = message.includes('feeding') && !message.includes('feed complete');
                const isScheduleWithStatus = message.includes('schedule updated') && message.includes('(status:');
                return isFeeding || isScheduleWithStatus;
              }).length;
              return `Showing ${relevantLogsCount} event${relevantLogsCount !== 1 ? 's' : ''}`;
            })()}
          </div>
        )}

        <div className="w-full max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {status && status.logs && status.logs.length > 0 ? (
            (() => {
              const relevantLogs = status.logs.filter(log => {
                const message = String(log.message || log.line || log).toLowerCase();
                const isFeeding = message.includes('feeding') && !message.includes('feed complete');
                const isScheduleWithStatus = message.includes('schedule updated') && message.includes('(status:');
                return isFeeding || isScheduleWithStatus;
              }).reverse(); // Newest logs first
              
              return relevantLogs.length > 0 ? (
                <ul className="text-left space-y-3"> 
                  {relevantLogs.map((log, idx) => {
                    // Handle different log formats
                    const message = log.message || log.line || log;
                    let displayTime = '';
                    
                    // Extract timestamp from message if it's in the format [2026-02-16T17:30:00.014Z]
                    const timestampMatch = String(message).match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\]/);
                    const timestampStr = timestampMatch ? timestampMatch[1] : log.timestamp;
                    
                    if (timestampStr) {
                      const parsed = new Date(timestampStr);
                      if (!isNaN(parsed.getTime())) {
                        // Full date and time
                        displayTime = parsed.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                      }
                    }
                    
                    // Detect log level from message
                    const msgStr = String(message).toLowerCase();
                    let logType = "info";
                    let icon = "ℹ️";
                    let bgColor = "bg-orange-500/20";
                    let borderColor = "border-orange-500/50";
                    let textColor = "text-orange-300";
                    
                    if (msgStr.includes("error") || msgStr.includes("failed") || msgStr.includes("exception")) {
                      logType = "error";
                      icon = "❌";
                      bgColor = "bg-red-500/20";
                      borderColor = "border-red-500/50";
                      textColor = "text-red-300";
                    } else if (msgStr.includes("warning") || msgStr.includes("warn")) {
                      logType = "warning";
                      icon = "⚠️";
                      bgColor = "bg-yellow-500/20";
                      borderColor = "border-yellow-500/50";
                      textColor = "text-yellow-300";
                    } else if (msgStr.includes("success") || msgStr.includes("complete") || msgStr.includes("finished")) {
                      logType = "success";
                      icon = "✅";
                      bgColor = "bg-green-500/20";
                      borderColor = "border-green-500/50";
                      textColor = "text-green-300";
                    } else if (msgStr.includes("schedule updated")) {
                      // Check if it's enabled or disabled
                      if (msgStr.includes("disabled")) {
                        logType = "schedule";
                        icon = "⚙️";
                        bgColor = "bg-blue-500/20";
                        borderColor = "border-blue-500/50";
                        textColor = "text-blue-300";
                      } else if (msgStr.includes("enabled")) {
                        logType = "schedule";
                        icon = "⚙️";
                        bgColor = "bg-green-500/20";
                        borderColor = "border-green-500/50";
                        textColor = "text-green-300";
                      } else {
                        logType = "schedule";
                        icon = "⚙️";
                        bgColor = "bg-blue-500/20";
                        borderColor = "border-blue-500/50";
                        textColor = "text-blue-300";
                      }
                    } else if (msgStr.includes("feed")) {
                      logType = "feed";
                      icon = "🍽️";
                      bgColor = "bg-orange-500/20";
                      borderColor = "border-orange-500/50";
                      textColor = "text-orange-300";
                    }
                    
                    // Clean up message text for user-friendly display
                    const cleanMessage = (msg) => {
                      let cleaned = String(msg);
                      
                      // Remove [timestamp] prefix like [2026-02-16T17:30:00.014Z]
                      cleaned = cleaned.replace(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\]\s*/i, '');
                      
                      // Remove [INFO], [DEBUG], [ERROR], [WARN] prefixes
                      cleaned = cleaned.replace(/^\[(INFO|DEBUG|WARNING|ERROR|WARN|TRACE)\]\s*/i, '');
                      
                      // Remove timestamp prefix (e.g., "2025-01-15 10:30:45 - ")
                      cleaned = cleaned.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(\.\d+)?\s*[-:]\s*/i, '');
                      
                      // Parse feeding messages with schedule (milliseconds)
                      if (/Feeding\s+\(SCHEDULE:([\w-]+)\)\s+for\s+(\d+)ms/i.test(cleaned)) {
                        cleaned = cleaned.replace(
                          /Feeding\s+\(SCHEDULE:([\w-]+)\)\s+for\s+(\d+)ms/i,
                          (match, schedule, ms) => {
                            const scheduleName = schedule.charAt(0).toUpperCase() + schedule.slice(1);
                            const duration = (parseInt(ms) / 1000).toFixed(1);
                            return `🕐 ${scheduleName} feeding (${duration}s)`;
                          }
                        );
                      }
                      // Parse feeding messages with schedule (seconds)
                      else if (/Feeding\s+\(SCHEDULE:([\w-]+)\)\s+for\s+([\d.]+)\s+seconds?/i.test(cleaned)) {
                        cleaned = cleaned.replace(
                          /Feeding\s+\(SCHEDULE:([\w-]+)\)\s+for\s+([\d.]+)\s+seconds?/i,
                          (match, schedule, duration) => {
                            const scheduleName = schedule.charAt(0).toUpperCase() + schedule.slice(1);
                            return `🕐 ${scheduleName} feeding (${duration}s)`;
                          }
                        );
                      }
                      
                      // Parse manual feeding messages (milliseconds)
                      else if (/Feeding\s+\(MANUAL\)\s+for\s+(\d+)ms/i.test(cleaned)) {
                        cleaned = cleaned.replace(
                          /Feeding\s+\(MANUAL\)\s+for\s+(\d+)ms/i,
                          (match, ms) => {
                            const duration = (parseInt(ms) / 1000).toFixed(1);
                            return `👆 Manual feeding (${duration}s)`;
                          }
                        );
                      }
                      // Parse manual feeding messages (seconds)
                      else if (/Feeding\s+\(MANUAL\)\s+for\s+([\d.]+)\s+seconds?/i.test(cleaned)) {
                        cleaned = cleaned.replace(
                          /Feeding\s+\(MANUAL\)\s+for\s+([\d.]+)\s+seconds?/i,
                          (match, duration) => `👆 Manual feeding (${duration}s)`
                        );
                      }
                      
                      // Handle generic feeding without context (milliseconds)
                      else if (/Feeding\s+for\s+(\d+)ms/i.test(cleaned)) {
                        cleaned = cleaned.replace(
                          /Feeding\s+for\s+(\d+)ms/i,
                          (match, ms) => {
                            const duration = (parseInt(ms) / 1000).toFixed(1);
                            return `Feeding for ${duration} seconds`;
                          }
                        );
                      }
                      // Handle generic feeding without context (seconds)
                      else if (/Feeding\s+for\s+([\d.]+)\s+seconds?/i.test(cleaned)) {
                        cleaned = cleaned.replace(
                          /Feeding\s+for\s+([\d.]+)\s+seconds?/i,
                          (match, duration) => `Feeding for ${duration} seconds`
                        );
                      }
                      
                      // Parse feed complete messages
                      if (/^Feed complete$/i.test(cleaned)) {
                        cleaned = "✓ Feeding completed successfully";
                      }
                      
                      // Parse schedule trigger messages
                      cleaned = cleaned.replace(/Schedule triggered:\s*(\w+)/gi, (match, schedule) => {
                        const scheduleName = schedule.charAt(0).toUpperCase() + schedule.slice(1);
                        return `🔔 ${scheduleName} schedule activated`;
                      });
                      
                      // Parse schedule update messages (with status transition)
                      cleaned = cleaned.replace(/Schedule updated:\s*["']?([\w-]+)["']?\s*\(status:\s*(\w+)\s*[^\w\s]+\s*(\w+)\)/gi, 
                        (match, schedule, oldStatus, newStatus) => {
                          const scheduleName = schedule.charAt(0).toUpperCase() + schedule.slice(1);
                          
                          if (newStatus.toLowerCase() === 'enabled') {
                            return `✅ ${scheduleName} schedule was enabled`;
                          } else if (newStatus.toLowerCase() === 'disabled') {
                            return `⏸️ ${scheduleName} schedule disabled`;
                          }
                          return `⚙️ ${scheduleName} schedule: ${oldStatus} → ${newStatus}`;
                        }
                      );
                      
                      // Replace technical motor/gpio terms
                      cleaned = cleaned.replace(/motor\s+started/gi, '⚙️ Motor started');
                      cleaned = cleaned.replace(/motor\s+stopped/gi, '⏹️ Motor stopped');
                      cleaned = cleaned.replace(/motor\s+running/gi, 'Motor running');
                      
                      // Replace REST/HTTP terms
                      cleaned = cleaned.replace(/POST\s+\/feed/gi, 'Feed button pressed');
                      cleaned = cleaned.replace(/GET\s+\/status/gi, 'Status requested');
                      
                      // Clean up file paths
                      cleaned = cleaned.replace(/\/[^\s]+\.(log|txt|json|js|py)/gi, '[log file]');
                      
                      // Remove extra whitespace
                      cleaned = cleaned.replace(/\s+/g, ' ').trim();
                      
                      // If still too technical or empty, use generic message
                      if (!cleaned || cleaned.length < 3) {
                        cleaned = "System event";
                      }
                      
                      return cleaned;
                    };
                    
                    const displayMessage = cleanMessage(message);
                    
                    return (
                      <li key={idx} className={`${bgColor} ${borderColor} border rounded-lg p-3 transition-all hover:scale-[1.02]`}>
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-semibold ${textColor} uppercase tracking-wide`}>
                                  {logType}
                                </span>
                                {displayTime && (
                                  <div className="text-xs text-gray-300 font-medium">{displayTime}</div>
                                )}
                              </div>
                              <div className="text-white text-base hss:text-sm leading-relaxed">
                                {displayMessage}
                              </div>
                            </div>
                          </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-gray-400 italic">No events found in logs.</div>
              );
            })()
          ) : ( 
            <div className="text-gray-400 italic">
              {status === null ? "Loading logs..." : "No logs available."}
            </div>
          )}
        </div>
      </div>
    
  );
}
