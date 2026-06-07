// api/prices.js - Vercel Serverless Function
// 從 Yahoo Finance 抓取台股即時股價

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const SYMBOLS = [
    '00919.TW', '2308.TW', '2317.TW', '2337.TW', '2360.TW',
    '2383.TW', '2454.TW', '2890.TW', '2913.TW', '3481.TW',
    '3702.TW', '3711.TW', '6139.TW', '6446.TW', '8046.TW', '00679B.TW'
  ];

  try {
    const symbolStr = SYMBOLS.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolStr}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketPreviousClose`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) throw new Error(`Yahoo Finance error: ${response.status}`);

    const data = await response.json();
    const quotes = data.quoteResponse?.result || [];

    const prices = {};
    quotes.forEach(q => {
      const id = q.symbol.replace('.TW', '');
      prices[id] = {
        price: q.regularMarketPrice,
        changePct: q.regularMarketChangePercent?.toFixed(2),
        prevClose: q.regularMarketPreviousClose,
        updatedAt: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
      };
    });

    res.status(200).json({ success: true, prices, fetchedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
