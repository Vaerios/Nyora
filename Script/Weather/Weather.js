// Weather Panel for Surge — dynamic weather icons (SF Symbols) and emoji.
// Source: http://t.weather.sojson.com/api/weather/city/{cityId}
// Note: forecast[0].type is a daily forecast, not necessarily real-time observations.

const params = parseArguments(typeof $argument === "string" ? $argument : "");
const cityId = /^\d{9}$/.test(params.cityId || "") ? params.cityId : "101220101";
const apiUrl = `http://t.weather.sojson.com/api/weather/city/${cityId}`;
const panelTitle = "今日天气";
const unavailable = "暂无数据";

$httpClient.get(apiUrl, (error, response, data) => {
  if (error) return finishError("网络请求失败，请稍后重试。", error);

  try {
    const result = typeof data === "string" ? JSON.parse(data) : data;
    if (Number(result?.status) !== 200 || !result?.data || !Array.isArray(result.data.forecast) || !result.data.forecast.length) {
      return finishError("天气服务未返回预报，请检查城市编号后重试。", result?.message || result?.status);
    }

    const city = result.cityInfo || {};
    const today = result.data.forecast[0] || {};
    const weatherType = String(today.type || "").trim();
    const appearance = getWeatherAppearance(weatherType);

    const lines = [
      `城市：${city.city || "未知"}`,
      `更新时间：${city.updateTime || unavailable}`,
      `天气：${appearance.emoji} ${weatherType || unavailable}`,
      `气温：${today.low || "低温暂无数据"}  ${today.high || "高温暂无数据"}`,
      `湿度：${result.data.shidu || unavailable}`,
      `空气质量：${result.data.quality || unavailable}`,
      `PM2.5：${result.data.pm25 ?? unavailable}`,
      `PM10：${result.data.pm10 ?? unavailable}`,
      `风向：${today.fx || unavailable}`,
      `风力：${today.fl || unavailable}`,
      `日出：${today.sunrise || unavailable}`,
      `日落：${today.sunset || unavailable}`,
      `温馨提示：${today.notice || unavailable}`
    ];

    // Always use auto-detected icon/color. Existing module arguments
    // icon=sun.max.fill&color=%23ffc400 must NOT override dynamic weather.
    $done({
      title: panelTitle,
      content: lines.join("\n"),
      icon: appearance.icon,
      "icon-color": appearance.color
    });
  } catch (e) {
    finishError("无法读取天气数据，请稍后重试。", e);
  }
});

function getWeatherAppearance(weatherType) {
  const type = String(weatherType || "").trim();

  // Order matters: thunderstorm precedes rain, and sleet precedes rain/snow.
  if (/雷|闪电|雷暴/.test(type))
    return { icon: "cloud.bolt.rain.fill", color: "#AF52DE", emoji: "⛈️" };
  if (/雨夹雪|雨雪|冻雨|冰粒|霰/.test(type))
    return { icon: "cloud.sleet.fill", color: "#5AC8FA", emoji: "🌨️" };
  if (/雪|暴雪/.test(type))
    return { icon: "cloud.snow.fill", color: "#5AC8FA", emoji: "🌨️" };
  if (/雨|降水|毛毛雨/.test(type))
    return { icon: "cloud.rain.fill", color: "#298AFF", emoji: "🌧️" };
  if (/雾|霾|烟雾|沙尘|浮尘/.test(type))
    return { icon: "cloud.fog.fill", color: "#8E8E93", emoji: "🌫️" };
  if (/台风|飓风|龙卷/.test(type))
    return { icon: "hurricane", color: "#FF9F0A", emoji: "🌪️" };
  if (/大风|狂风|强风/.test(type))
    return { icon: "wind", color: "#8E8E93", emoji: "💨" };
  if (/多云|少云|晴间多云/.test(type))
    return { icon: "cloud.sun.fill", color: "#E9A23B", emoji: "🌤️" };
  if (/阴|云/.test(type))
    return { icon: "cloud.fill", color: "#8E8E93", emoji: "☁️" };
  if (/晴|日照|阳光/.test(type))
    return { icon: "sun.max.fill", color: "#FFC400", emoji: "☀️" };

  // Unknown weather should not be shown as sunny.
  return { icon: "cloud.fill", color: "#8E8E93", emoji: "❔" };
}

function finishError(message, detail) {
  console.log(detail == null ? message : `${message} ${String(detail)}`);
  $done({
    title: panelTitle,
    content: message,
    icon: "cloud.slash.fill",
    "icon-color": "#8E8E93"
  });
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
