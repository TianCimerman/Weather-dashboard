import { InfluxDB } from "@influxdata/influxdb-client";

// This logic ensures 'weatherStore' is truly global across the whole Node process
if (!global.weatherStore) {
  global.weatherStore = {
    cachedData: null,
  };
}

export const weatherStore = global.weatherStore;

export async function fetchWeatherAndSensors() {

  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const influxToken = process.env.INFLUX_TOKEN;
    const url = process.env.INFLUX_URL;
    const org = process.env.INFLUX_ORG;

    const queryApi = new InfluxDB({ url, token: influxToken }).getQueryApi(org);

    const flux = `
      from(bucket: "data")
        |> range(start: -1d)
        |> filter(fn: (r) => r["_measurement"] == "climate_2")
        |> filter(fn: (r) =>
          r["_field"] == "humidity_out" or
          r["_field"] == "temperature_out" or
          r["_field"] == "voltage_out" or
          r["_field"] == "voltage_in" or
          r["_field"] == "humidity_in" or
          r["_field"] == "temperature_in" or
          r["_field"] == "humidity_in_2" or   
          r["_field"] == "temperature_in_2"

        )
        |> last()
        |> keep(columns: ["_field", "_value"])
    `;

    const rows = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(flux, {
        next(row, meta) { rows.push(meta.toObject(row)); },
        error: reject,
        complete: resolve,
      });
    });

    const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Dobovica&appid=${apiKey}&units=metric`
    );
    const weather = await weatherRes.json();

    global.weatherStore.cachedData = {
        sensors: rows,
        weather: {
        main: weather.weather[0].main,
        icon: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`,
        location: weather.name,
        },
    };
    

  } catch (err) {
    console.error("❌ Fetch failed:", err.message);
  }
}