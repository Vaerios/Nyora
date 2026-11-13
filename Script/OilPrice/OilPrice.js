/*
 * Oil Price Panel for Surge
 * Original implementation: deezertidal/Surge_Module/files/oil.js
 * Province is configurable via the Surge module argument "provname".
 * API keys are inherited from the upstream public script; availability is not guaranteed.
 */
const params = parseArguments(typeof $argument === 'string' ? $argument : '');
const province = (params.provname || '安徽').trim();
const icon = params.icon || 'car';
const color = params.color || '#c932a9';
const keys = [
  '231de491563c35731436829ac52aad43',
  'a2bc7a0e01be908881ff752677cf94b7',
  '1bcc67c0114bc39a8818c8be12c2c9ac',
  '3c5ee42145c852de4147264f25b858dc',
  'd718b0f7c2b6d71cb3a9814e90bf847f'
];

function parseArguments(raw) {
  const result = {};
  for (const part of raw.split('&')) {
    if (!part) continue;
    const pos = part.indexOf('=');
    if (pos < 0) continue;
    const key = part.slice(0, pos);
    const value = part.slice(pos + 1);
    try { result[key] = decodeURIComponent(value); }
    catch (_) { result[key] = value; }
  }
  return result;
}

function finish(content) {
  $done({ title: '今日油价', content, icon, 'icon-color': color });
}

function formatPrice(value) {
  return value === null || value === undefined || value === ''
    ? '暂无数据' : `${value} 元/升`;
}

function fetchPrice(index) {
  if (index >= keys.length) {
    finish(`地区：${province}\n油价获取失败，请稍后重试`);
    return;
  }
  const url = `https://apis.tianapi.com/oilprice/index?key=${keys[index]}&prov=${encodeURIComponent(province)}`;
  $httpClient.get({ url, timeout: 10 }, (error, response, data) => {
    if (error || !response || response.status >= 400 || !data) {
      console.log(`[OilPricePanel] Request ${index + 1} failed: ${error || response?.status || 'empty response'}`);
      fetchPrice(index + 1);
      return;
    }
    try {
      const payload = JSON.parse(data);
      if (Number(payload.code) !== 200 || !payload.result) {
        console.log(`[OilPricePanel] API ${index + 1}: ${payload.msg || 'invalid result'}`);
        fetchPrice(index + 1);
        return;
      }
      const p = payload.result;
      finish([
        `📍 地区：${p.prov || province}`,
        `⛽ 0号柴油：${formatPrice(p.p0)}`,
        `⛽ 89号汽油：${formatPrice(p.p89)}`,
        `⛽ 92号汽油：${formatPrice(p.p92)}`,
        `⛽ 95号汽油：${formatPrice(p.p95)}`,
        `⛽ 98号汽油：${formatPrice(p.p98)}`,
        `🕒 更新时间：${p.time || '暂无数据'}`
      ].join('\n'));
    } catch (e) {
      console.log(`[OilPricePanel] JSON error ${index + 1}: ${String(e)}`);
      fetchPrice(index + 1);
    }
  });
}

if (!province) {
  finish('请在模块参数中填写省份名称');
} else {
  fetchPrice(0);
}
