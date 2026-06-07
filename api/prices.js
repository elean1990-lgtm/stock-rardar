export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const symbols = ['00919.TW','2308.TW','2317.TW','2337.TW','2360.TW','2383.TW','2454.TW','2890.TW','2913.TW','3481.TW','3702.TW','3711.TW','6139.TW','6446.TW','8046.TW','00679B.TW'].join(',');
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent`;
  const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}});
  const data = await r.json();
  const prices = {};
  (data.quoteResponse?.result||[]).forEach(q=>{
    prices[q.symbol.replace('.TW','')] = {price: q.regularMarketPrice, changePct: parseFloat((q.regularMarketChangePercent||0).toFixed(2))};
  });
  res.json({success:true, prices});
}
