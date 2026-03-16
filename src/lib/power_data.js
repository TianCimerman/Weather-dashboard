import { InfluxDB } from "@influxdata/influxdb-client";

// Ensure the global object exists
if (!global.powerStore) {
  global.powerStore = {
    cachedData: null,
  };
}

export async function fetchPower() {
  try {
    const influxToken = process.env.INFLUX_TOKEN;
    const url = process.env.INFLUX_URL;
    const org = process.env.INFLUX_ORG;

    const queryApi = new InfluxDB({ url, token: influxToken }).getQueryApi(org);

    // Note: range(start: -1h) is good, but make sure your DB has data in the last hour
    const flux = `
      from(bucket: "data")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "meter_data2")
        |> filter(fn: (r) => r["_field"] == "power2")
        |> last()
    `;

    const rows = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(flux, {
        next(row, meta) { rows.push(meta.toObject(row)); },
        error: reject,
        complete: resolve,
      });
    });

    if (rows.length > 0) {
      // CRITICAL: You must update global.powerStore.cachedData
      global.powerStore.cachedData = {
        value: rows[0]._value,
        time: rows[0]._time
      };
      // Remove this log after it works so your terminal isn't flooded every second
      
    } else {
      console.log("⚠️ Power query returned 0 rows. Check your Influx bucket/range.");
    }
  } catch (err) {
    console.error("❌ Power Fetch Error:", err.message);
  }
}