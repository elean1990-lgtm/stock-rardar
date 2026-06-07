export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const symbols = ['00919.TW','2308.TW','2317.TW','2337.TW','2360.TW','2383.TW','2454.TW','2890.TW','2913.TW','3481.TW','3702.TW','3711.TW','6139.TW','6446.TW','8046.TW','00679B.TW'].join(',');
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com',
        'Origin': 'https://finance.yahoo.com'
      }
    });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    const data = await r.json();
    const prices = {};
    (data.quoteResponse?.result||[]).forEach(q => {
      prices[q.symbol.replace('.TW','').replace('.TWO','')] = {
        price: q.regularMarketPrice,
        changePct: parseFloat((q.regularMarketChangePercent||0).toFixed(2))
      };
    });
    res.json({ success: true, prices });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
