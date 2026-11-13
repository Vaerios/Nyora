// Weather Panel - Surge generic panel script
// Weather data provided by the original sojson weather endpoint.
const params = parseArguments(typeof $argument === "string" ? $argument : "");
const cityId = /^\d{9}$/.test(params.cityId || "") ? params.cityId : "101220101";
const apiUrl = `http://t.weather.sojson.com/api/weather/city/${cityId}`;
const panelTitle = "今日天气";
const unavailable = "暂无数据";

$httpClient.get(apiUrl, (error, response, data) => {
  if (error) return finishError("网络请求失败，请稍后重试。", error);
  try {
    const result = JSON.parse(data);
    if (Number(result.status) !== 200 || !result.data || !result.data.forecast?.length) {
      return finishError("天气服务未返回预报，请检查城市编号后重试。", result.message || result.status);
    }
    const city = result.cityInfo || {};
    const today = result.data.forecast[0];
    const lines = [
      `城市：${city.city || "未知"}`,
      `更新时间：${city.updateTime || unavailable}`,
      `天气：${today.type || unavailable}`,
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
    $done({ title: panelTitle, content: lines.join("\n"), icon: params.icon || "sun.max.fill", "icon-color": params.color || "#ffc400" });
  } catch (e) {
    finishError("无法读取天气数据，请稍后重试。", e);
  }
});

function finishError(message, detail) {
  console.log(detail == null ? message : `${message} ${String(detail)}`);
  $done({ title: panelTitle, content: message, icon: "cloud.slash.fill", "icon-color": "#ffc400" });
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
