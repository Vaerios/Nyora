// Weather Panel - Surge generic panel script
// Weather data provided by the original sojson weather endpoint.
const params = parseArguments(typeof $argument === "string" ? $argument : "");
const cityId = /^\d{9}$/.test(params.cityId || "") ? params.cityId : "101220101";
const apiUrl = `http://t.weather.sojson.com/api/weather/city/${cityId}`;

$httpClient.get(apiUrl, (error, response, data) => {
  if (error) return finishError(`Network error: ${String(error)}`);
  try {
    const result = JSON.parse(data);
    if (Number(result.status) !== 200 || !result.data || !result.data.forecast?.length) {
      return finishError(`Weather API error: ${result.message || result.status || "invalid response"}`);
    }
    const city = result.cityInfo || {};
    const today = result.data.forecast[0];
    const lines = [
      `📍 City: ${city.city || "Unknown"}`,
      `🕒 Updated: ${city.updateTime || "N/A"}`,
      `🌤 Weather: ${today.type || "N/A"}`,
      `🌡 Temperature: ${today.low || "N/A"}  ${today.high || "N/A"}`,
      `💧 Humidity: ${result.data.shidu || "N/A"}`,
      `💨 Air quality: ${result.data.quality || "N/A"}`,
      `☁️ PM2.5: ${result.data.pm25 ?? "N/A"}`,
      `☁️ PM10: ${result.data.pm10 ?? "N/A"}`,
      `🪁 Wind direction: ${today.fx || "N/A"}`,
      `🌪 Wind force: ${today.fl || "N/A"}`,
      `🌅 Sunrise: ${today.sunrise || "N/A"}`,
      `🌇 Sunset: ${today.sunset || "N/A"}`,
      `🏷 Tip: ${today.notice || "N/A"}`
    ];
    $done({ title: "Weather Today", content: lines.join("\n"), icon: params.icon || "sun.max.fill", "icon-color": params.color || "#ffc400" });
  } catch (e) {
    finishError(`Invalid weather response: ${String(e)}`);
  }
});

function finishError(message) {
  console.log(message);
  $done({ title: "Weather Today", content: message, icon: "cloud.slash.fill", "icon-color": "#ffc400" });
}

function parseArguments(raw) {
  const result = {};
  for (const pair of raw.split("&")) {
    if (!pair) continue;
    const pos = pair.indexOf("=");
    if (pos < 0) continue;
    const key = pair.slice(0, pos);
    const value = pair.slice(pos + 1);
    try { result[key] = decodeURIComponent(value); }
    catch (_) { result[key] = value; }
  }
  return result;
}
