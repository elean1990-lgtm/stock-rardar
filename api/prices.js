export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // 台灣證交所官方 API - 上市股票
    const twseUrl = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_2308.tw|tse_2317.tw|tse_2337.tw|tse_2360.tw|tse_2383.tw|tse_2454.tw|tse_2890.tw|tse_2913.tw|tse_3481.tw|tse_3702.tw|tse_3711.tw|tse_6139.tw|tse_6446.tw|tse_8046.tw|tse_00919.tw|tse_00679B.tw';

    const r = await fetch(twseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://mis.twse.com.tw'
      }
    });

    if (!r.ok) throw new Error(`TWSE HTTP ${r.status}`);
    const data = await r.json();

    const prices = {};
    (data.msgArray || []).forEach(stock => {
      const id = stock.c; // 股票代號
      const price = parseFloat(stock.z) || parseFloat(stock.y) || 0; // z=成交價, y=昨收
      const prevClose = parseFloat(stock.y) || 0;
      const changePct = prevClose > 0 ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : 0;
      prices[id] = { price, changePct };
    });

    res.json({ success: true, prices });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
