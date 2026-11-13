const args = Object.fromEntries(
  ($argument || "")
    .split("&")
    .filter(Boolean)
    .map(item => {
      const index = item.indexOf("=");
      if (index < 0) return [item, ""];
      return [
        item.slice(0, index),
        item.slice(index + 1)
      ];
    })
);

const cityId = /^\d{9}$/.test(args.cityId || "")
  ? args.cityId
  : "101220101";

const icon = args.icon || "sun.max.fill";
const color = args.color || "#ffc400";

const url = `https://t.weather.sojson.com/api/weather/city/${cityId}`;

const request = {
  url,
  timeout: 10,
  headers: {
    Accept: "application/json"
  }
};

function finish(title, content, extra = {}) {
  $done({
    title,
    content,
    icon,
    "icon-color": color,
    ...extra
  });
}

function weatherDescription(type) {
  const names = {
    Sunny: "晴",
    Cloudy: "多云",
    Overcast: "阴",
    Rain: "雨",
    Snow: "雪",
    Thunderstorm: "雷阵雨"
  };

  return names[type] || type || "未知";
}

function getAirQuality(aqi) {
  const value = Number(aqi);

  if (!Number.isFinite(value)) return "暂无数据";
  if (value <= 50) return "优";
  if (value <= 100) return "良";
  if (value <= 150) return "轻度污染";
  if (value <= 200) return "中度污染";
  if (value <= 300) return "重度污染";
  return "严重污染";
}

function formatTemperature(value) {
  if (value === undefined || value === null) {
    return "--";
  }

  const text = String(value).replace(/℃|°C/g, "").trim();
  return text ? `${text}°C` : "--";
}

function formatTime(date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

$httpClient.get(request, (error, response, data) => {
  if (error) {
    finish("今日天气", "天气请求失败，请检查网络连接");
    return;
  }

  if (response && response.status >= 400) {
    finish("今日天气", `天气接口异常：HTTP ${response.status}`);
    return;
  }

  try {
    const result = JSON.parse(data);

    if (String(result.status) !== "200") {
      finish(
        "今日天气",
        result.message || "天气数据获取失败"
      );
      return;
    }

    const city = result.cityInfo?.city || "未知城市";
    const weather = result.data || {};
    const today = weather.forecast?.[0] || {};

    const type = weatherDescription(today.type);
    const temperature = formatTemperature(weather.wendu);
    const high = today.high || "--";
    const low = today.low || "--";
    const humidity = weather.shidu || "--";
    const wind = [
      today.fx,
      today.fl
    ].filter(Boolean).join(" ");

    const aqi = today.aqi;
    const quality = getAirQuality(aqi);

    const content = [
      `天气：${type}  |  当前：${temperature}`,
      `最高：${high}  |  最低：${low}`,
      `湿度：${humidity}  |  风向：${wind || "--"}`,
      `空气质量：${quality}${aqi != null ? `（AQI ${aqi}）` : ""}`,
      `更新时间：${formatTime(new Date())}`
    ].join("\n");

    finish(`${city} · 今日天气`, content);

  } catch (e) {
    finish("今日天气", "天气数据解析失败");
    console.log(`[WeatherPanel] ${String(e)}`);
  }
});
