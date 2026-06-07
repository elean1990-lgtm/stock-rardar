import { useState, useEffect } from "react";

const PORTFOLIO_BASE = [
  { id:"00919",  name:"群益台灣精選高息", shares:8974,  sector:"ETF",     cost:21.68,   stopLoss:20.00, target:32.00  },
  { id:"2308",   name:"台達電",           shares:18,    sector:"AI電源",  cost:2171.88, stopLoss:2300,  target:2900   },
  { id:"2317",   name:"鴻海",             shares:425,   sector:"AI伺服器",cost:221.14,  stopLoss:200,   target:300    },
  { id:"2337",   name:"旺宏",             shares:125,   sector:"記憶體",  cost:163.79,  stopLoss:140,   target:200    },
  { id:"2360",   name:"致茂",             shares:59,    sector:"測試設備",cost:2128.73, stopLoss:2000,  target:3000   },
  { id:"2383",   name:"台光電",           shares:26,    sector:"CCL基板", cost:3955.89, stopLoss:3500,  target:6000   },
  { id:"2454",   name:"聯發科",           shares:32,    sector:"AI晶片",  cost:1912.25, stopLoss:3800,  target:5500   },
  { id:"2890",   name:"永豐金",           shares:1700,  sector:"金融",    cost:30.18,   stopLoss:27.00, target:35.00  },
  { id:"2913",   name:"農林",             shares:1000,  sector:"傳產",    cost:19.26,   stopLoss:null,  target:null   },
  { id:"3481",   name:"群創",             shares:150,   sector:"面板",    cost:46.21,   stopLoss:42.00, target:55.00  },
  { id:"3702",   name:"大聯大",           shares:400,   sector:"通路",    cost:87.48,   stopLoss:100,   target:150    },
  { id:"3711",   name:"日月光投控",       shares:275,   sector:"封測",    cost:348.15,  stopLoss:550,   target:800    },
  { id:"6139",   name:"亞翔",             shares:30,    sector:"廠務",    cost:801.66,  stopLoss:700,   target:950    },
  { id:"6446",   name:"藥華藥",           shares:50,    sector:"生技",    cost:674.92,  stopLoss:750,   target:1100   },
  { id:"8046",   name:"南電",             shares:111,   sector:"ABF載板", cost:853.73,  stopLoss:750,   target:1000   },
  { id:"00679B", name:"元大美債20年",     shares:9807,  sector:"債券ETF", cost:26.49,   stopLoss:24.00, target:28.00  },
];

const SC = {
  "ETF":"#00d4ff","AI電源":"#ff6b35","AI伺服器":"#ff4466","AI晶片":"#ff4466",
  "記憶體":"#a78bfa","測試設備":"#34d399","CCL基板":"#fbbf24","封測":"#f472b6",
  "廠務":"#60a5fa","生技":"#4ade80","ABF載板":"#fb923c","金融":"#94a3b8",
  "傳產":"#6b7280","面板":"#64748b","通路":"#71717a","債券ETF":"#38bdf8"
};

function copyText(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  } catch(e) {}
}

export default function App() {
  const [prices, setPrices]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [error, setError]         = useState("");
  const [page, setPage]           = useState("list");
  const [sel, setSel]             = useState(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [sortBy, setSortBy]       = useState("value");
  const [filter, setFilter]       = useState("全部");
  const [pulse, setPulse]         = useState(false);
  const [toast, setToast]         = useState("");
  const [posEditing, setPosEditing] = useState(false);
  const [posData, setPosData]     = useState({});
  const [posDraft, setPosDraft]   = useState({});

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1800);
    return () => clearInterval(t);
  }, []);

  async function fetchPrices() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      if (data.success) {
        setPrices(data.prices);
        const now = new Date();
        setLastUpdate(`${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      } else {
        setError(data.error || "抓取失敗");
      }
    } catch(e) {
      setError("網路錯誤：" + e.message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchPrices(); }, []);

  // 合併即時股價與基本資料
  const PORTFOLIO = PORTFOLIO_BASE.map(s => {
    const live = prices[s.id];
    const price = live?.price || 0;
    const changePct = live?.changePct || 0;
    const value = price * s.shares;
    return { ...s, price, changePct: parseFloat(changePct), value };
  });

  const totalValue = PORTFOLIO.reduce((a, s) => a + s.value, 0);
  const sectors = ["全部", ...new Set(PORTFOLIO.map(s => s.sector))];

  const sorted = [...PORTFOLIO]
    .filter(s => filter === "全部" || s.sector === filter)
    .sort((a, b) => {
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "pnl") return ((b.price - b.cost) * b.shares) - ((a.price - a.cost) * a.shares);
      return a.name.localeCompare(b.name, "zh-TW");
    });

  function open(s) { setSel(s); setDetailTab("overview"); setPage("detail"); setPosEditing(false); }

  const cur = sel ? {
    shares: posData[sel.id]?.shares ?? sel.shares,
    cost:   posData[sel.id]?.cost   ?? sel.cost,
    stopLoss: posData[sel.id]?.stopLoss ?? sel.stopLoss,
    target:   posData[sel.id]?.target   ?? sel.target,
  } : {};

  const curPnl    = sel && cur.cost ? (sel.price - cur.cost) * cur.shares : null;
  const curPnlPct = sel && cur.cost ? (((sel.price - cur.cost) / cur.cost) * 100).toFixed(1) : null;
  const up        = curPnl != null && curPnl >= 0;
  const upside    = sel && cur.target ? (((cur.target - sel.price) / sel.price) * 100).toFixed(1) : null;
  const stopTriggered = sel && cur.stopLoss && sel.price < cur.stopLoss;

  function buildMsg() {
    if (!sel) return "";
    return `請分析 ${sel.name}（${sel.id}）並給出本日操作建議。

【持倉資料】
收盤價：${sel.price} | 持有：${cur.shares}股 | 均價：${cur.cost} | 損益：${curPnlPct}%
停損：${cur.stopLoss||"未設"} | 法人目標價：${cur.target||"未設"} | 佔總資產：${totalValue > 0 ? ((sel.value/totalValue)*100).toFixed(1) : 0}%

【偏好】核心持股+衛星倉，波段操作，重視資金保全，不想賣在最低點

請依以下格式輸出：
一、未來1週走勢機率（上漲突破/區間震盪/跌破支撐 各%）+ 原因3點
二、關鍵支撐與壓力價位
三、今日掛單建議（具體股數與價位、停損條件）
四、操作評等（🟢可分批布局/🟡續抱觀察/🟠反彈減碼/🔴優先保全資金）+ 一句理由
五、風險提示 2點`;
  }

  return (
    <div style={{minHeight:"100vh",background:"#070b12",color:"#dde4ee",fontFamily:"'IBM Plex Mono',monospace",maxWidth:430,margin:"0 auto"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{width:0;}
        .card{background:#0c1520;border:1px solid #131f30;border-radius:10px;}
        .tap{cursor:pointer;transition:background .15s;}
        .tap:active{background:#0d1b2e !important;}
        .chip{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;}
        .tab{background:none;border:none;cursor:pointer;font-family:inherit;padding:10px 14px;font-size:12px;white-space:nowrap;}
        input{background:#0c1520;border:1px solid #1a2e48;color:#dde4ee;padding:8px 12px;border-radius:6px;font-family:inherit;font-size:13px;width:100%;outline:none;}
        input:focus{border-color:#00d4ff;}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"calc(100% - 32px)",maxWidth:400,background:"#003a20",border:"1px solid #00cc88",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#00cc88",fontFamily:"'Noto Sans TC',sans-serif",lineHeight:1.6,textAlign:"center"}}>
          {toast}
        </div>
      )}

      {/* TOP BAR */}
      <div style={{background:"#05080f",borderBottom:"1px solid #0f1a28",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:99}}>
        {page !== "list" ? (
          <button onClick={() => setPage("list")} style={{background:"none",border:"none",cursor:"pointer",color:"#4a7090",fontSize:20,padding:"0 4px"}}>‹</button>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:pulse?"#00d4ff":"#0a2040",display:"inline-block"}}></span>
            <span style={{fontSize:13,fontWeight:600,letterSpacing:2,color:"#00d4ff"}}>RADAR</span>
          </div>
        )}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:"#3a5070",fontFamily:"'Noto Sans TC',sans-serif"}}>
            {page === "list" ? "持股總覽" : sel?.name || ""}
          </div>
          {lastUpdate && <div style={{fontSize:9,color:"#2a4060"}}>更新 {lastUpdate}</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {page === "list" && (
            <button onClick={fetchPrices} style={{background:"none",border:"1px solid #1a2e48",borderRadius:6,color:"#4a7090",fontSize:11,padding:"4px 8px",cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif"}}>
              {loading ? "更新中" : "↻ 更新"}
            </button>
          )}
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:"#1e3050"}}>總市值</div>
            <div style={{fontSize:13,fontWeight:600,color:"#00d4ff"}}>
              {loading ? "---" : `NT$${Math.round(totalValue/10000)}萬`}
            </div>
          </div>
        </div>
      </div>

      {/* 載入中 */}
      {loading && page === "list" && (
        <div style={{padding:"40px",textAlign:"center",color:"#3a5070",fontFamily:"'Noto Sans TC',sans-serif",fontSize:13}}>
          <div style={{fontSize:24,marginBottom:12}}>⟳</div>
          抓取最新股價中...
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && !loading && (
        <div style={{margin:"12px",background:"#1a0008",border:"1px solid #ff446644",borderRadius:8,padding:"12px 14px",fontSize:12,color:"#ff6680",fontFamily:"'Noto Sans TC',sans-serif"}}>
          ⚠️ {error} — <span style={{cursor:"pointer",textDecoration:"underline"}} onClick={fetchPrices}>重試</span>
        </div>
      )}

      {/* ══ 持股列表 ══ */}
      {page === "list" && !loading && (
        <div style={{padding:"12px 12px 80px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {label:"持股",value:`${PORTFOLIO.length}檔`},
              {label:"獲利",value:`${PORTFOLIO.filter(s=>s.price>s.cost).length}檔`,color:"#00cc88"},
              {label:"虧損",value:`${PORTFOLIO.filter(s=>s.cost&&s.price<s.cost).length}檔`,color:"#ff4466"},
            ].map((item,i)=>(
              <div key={i} className="card" style={{padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#2a4060",letterSpacing:1,marginBottom:3,fontFamily:"'Noto Sans TC',sans-serif"}}>{item.label}</div>
                <div style={{fontSize:18,fontWeight:600,color:item.color||"#c0d0e0"}}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
            <span style={{fontSize:10,color:"#2a4060",flexShrink:0}}>排序</span>
            {[["value","市值"],["pnl","損益"],["name","名稱"]].map(([k,l])=>(
              <span key={k} className="chip tap" onClick={()=>setSortBy(k)}
                style={{background:sortBy===k?"#00d4ff22":"transparent",color:sortBy===k?"#00d4ff":"#4a6080",border:`1px solid ${sortBy===k?"#00d4ff44":"#1a2e48"}`}}>
                {l}
              </span>
            ))}
          </div>

          <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
            {sectors.map(s=>(
              <span key={s} className="chip tap" onClick={()=>setFilter(s)}
                style={{background:filter===s?"#00d4ff":"#0c1520",color:filter===s?"#070b12":"#5070a0",border:`1px solid ${filter===s?"#00d4ff":"#1a2e48"}`,flexShrink:0,fontFamily:"'Noto Sans TC',sans-serif"}}>
                {s}
              </span>
            ))}
          </div>

          {sorted.map((s,i)=>{
            const pct = totalValue > 0 ? ((s.value/totalValue)*100).toFixed(1) : 0;
            const m = posData[s.id] || {};
            const cost = m.cost ?? s.cost;
            const hasCost = !!cost;
            const gainUp = hasCost ? s.price >= cost : null;
            const pnlAmt = hasCost ? ((s.price - cost) * (m.shares ?? s.shares)) : null;
            const c = SC[s.sector] || "#88aacc";
            const stop = (m.stopLoss ?? s.stopLoss) && s.price < (m.stopLoss ?? s.stopLoss);
            const dayUp = s.changePct >= 0;
            return (
              <div key={s.id} className="card tap" onClick={()=>open(s)}
                style={{padding:"14px",marginBottom:8,borderColor:stop?"#ff446633":"#131f30",position:"relative",overflow:"hidden"}}>
                {stop && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"#ff4466"}}></div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:15,fontFamily:"'Noto Sans TC',sans-serif",fontWeight:700}}>{s.name}</span>
                      {stop && <span style={{fontSize:9,color:"#ff4466",background:"#1a0008",border:"1px solid #ff446633",borderRadius:3,padding:"0 4px"}}>停損</span>}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:10,color:"#3a5070"}}>{s.id}</span>
                      <span className="chip" style={{background:c+"18",color:c,border:`1px solid ${c}22`,fontFamily:"'Noto Sans TC',sans-serif",fontSize:9}}>{s.sector}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:18,fontWeight:600}}>{s.price ? s.price.toLocaleString() : "---"}</div>
                    <div style={{fontSize:12,color:dayUp?"#ff6680":"#00cc88",marginTop:1}}>
                      {s.price ? `${dayUp?"+":""}${s.changePct}%` : ""}
                    </div>
                  </div>
                </div>
                <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:3,background:"#0a1018",borderRadius:2}}>
                    <div style={{height:"100%",width:`${Math.min(parseFloat(pct)*2.5,100)}%`,background:c,borderRadius:2,opacity:0.6}}></div>
                  </div>
                  <span style={{fontSize:10,color:"#3a5070",flexShrink:0}}>{pct}%</span>
                  {pnlAmt != null && <span style={{fontSize:11,color:gainUp?"#00cc88":"#ff4466",flexShrink:0,fontWeight:500}}>{gainUp?"+":""}{Math.round(pnlAmt).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ 個股詳情 ══ */}
      {page === "detail" && sel && (
        <div>
          <div style={{padding:"14px 16px",background:"#08101a",borderBottom:"1px solid #0f1a28"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:22,fontFamily:"'Noto Sans TC',sans-serif",fontWeight:700,marginBottom:2}}>{sel.name}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#3a5070"}}>{sel.id}.TW</span>
                  <span className="chip" style={{background:(SC[sel.sector]||"#88aacc")+"22",color:SC[sel.sector]||"#88aacc",border:`1px solid ${(SC[sel.sector]||"#88aacc")}33`,fontFamily:"'Noto Sans TC',sans-serif",fontSize:10}}>{sel.sector}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:26,fontWeight:600}}>{sel.price?.toLocaleString() || "---"}</div>
                <div style={{fontSize:12,color:sel.changePct>=0?"#ff6680":"#00cc88"}}>
                  {sel.changePct >= 0 ? "+" : ""}{sel.changePct}%
                </div>
              </div>
            </div>
          </div>

          {stopTriggered && (
            <div style={{margin:"12px",background:"#1a0008",border:"1px solid #ff4466",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#ff4466",fontFamily:"'Noto Sans TC',sans-serif"}}>
              ⚠️ 已跌破停損點 {cur.stopLoss}，請評估是否出場！
            </div>
          )}

          <div style={{display:"flex",borderBottom:"1px solid #0f1a28",overflowX:"auto",background:"#08101a"}}>
            {[["overview","總覽"],["position","我的持倉"],["advice","⚡操作建議"]].map(([id,label])=>(
              <button key={id} className="tab"
                onClick={() => { setDetailTab(id); setPosEditing(false); }}
                style={{color:detailTab===id?(id==="advice"?"#ffd700":"#00d4ff"):"#405070",borderBottom:detailTab===id?`2px solid ${id==="advice"?"#ffd700":"#00d4ff"}`:"2px solid transparent",fontFamily:"'Noto Sans TC',sans-serif",flexShrink:0}}>
                {label}
              </button>
            ))}
          </div>

          <div style={{padding:"14px 12px 80px"}}>

            {/* 總覽 */}
            {detailTab === "overview" && (
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[
                    {label:"法人目標價",value:cur.target?`${cur.target.toLocaleString()}元`:"未設定",sub:upside?`空間+${upside}%`:null,color:"#00d4ff"},
                    {label:"今日漲跌",value:`${sel.changePct>=0?"+":""}${sel.changePct}%`,color:sel.changePct>=0?"#ff6680":"#00cc88"},
                    {label:"持倉損益",value:curPnlPct?`${up?"+":""}${curPnlPct}%`:"未設成本",color:up?"#00cc88":"#ff4466"},
                    {label:"停損點",value:cur.stopLoss?`${cur.stopLoss.toLocaleString()}元`:"未設定",color:stopTriggered?"#ff4466":"#ff8866"},
                  ].map((item,i)=>(
                    <div key={i} className="card" style={{padding:"12px 14px"}}>
                      <div style={{fontSize:9,color:"#2a4060",letterSpacing:1,marginBottom:4,fontFamily:"'Noto Sans TC',sans-serif"}}>{item.label}</div>
                      <div style={{fontSize:16,fontWeight:600,color:item.color}}>{item.value}</div>
                      {item.sub&&<div style={{fontSize:10,color:"#4a6080",marginTop:2,fontFamily:"'Noto Sans TC',sans-serif"}}>{item.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 我的持倉 */}
            {detailTab === "position" && (
              <div>
                <div className="card" style={{padding:"14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:posEditing?14:0}}>
                    <div style={{fontSize:9,color:"#2a4060",letterSpacing:2}}>持倉資訊</div>
                    {!posEditing ? (
                      <button onClick={()=>{ setPosDraft({shares:String(cur.shares||""),cost:String(cur.cost||""),stopLoss:String(cur.stopLoss||""),target:String(cur.target||"")}); setPosEditing(true); }}
                        style={{background:"transparent",border:"1px solid #1a2e48",color:"#00d4ff",padding:"5px 14px",borderRadius:6,cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12}}>
                        ✎ 編輯
                      </button>
                    ) : (
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setPosEditing(false)} style={{background:"transparent",border:"1px solid #1a2e48",color:"#4a6080",padding:"5px 12px",borderRadius:6,cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12}}>取消</button>
                        <button onClick={()=>{ setPosData(prev=>({...prev,[sel.id]:{shares:parseFloat(posDraft.shares)||cur.shares,cost:parseFloat(posDraft.cost)||cur.cost,stopLoss:parseFloat(posDraft.stopLoss)||cur.stopLoss,target:parseFloat(posDraft.target)||cur.target}})); setPosEditing(false); }}
                          style={{background:"#00d4ff",border:"none",color:"#070b12",padding:"5px 14px",borderRadius:6,cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,fontWeight:700}}>儲存</button>
                      </div>
                    )}
                  </div>
                  {posEditing && (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {[{label:"持有股數（股）",key:"shares"},{label:"平均成本（元）",key:"cost"},{label:"停損點（元）",key:"stopLoss"},{label:"法人目標價（元）",key:"target"}].map(item=>(
                        <div key={item.key}>
                          <div style={{fontSize:10,color:"#4a6080",marginBottom:5,fontFamily:"'Noto Sans TC',sans-serif"}}>{item.label}</div>
                          <input type="number" value={posDraft[item.key]} onChange={e=>setPosDraft(p=>({...p,[item.key]:e.target.value}))} style={{fontSize:14,padding:"9px 12px",borderRadius:8}} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[
                    {label:"持有股數",value:`${cur.shares?.toLocaleString()} 股`},
                    {label:"現值",value:`NT$ ${sel.price ? Math.round(sel.price * cur.shares).toLocaleString() : "---"}`},
                    {label:"均價成本",value:cur.cost?`${cur.cost.toLocaleString()} 元`:"未設定"},
                    {label:"佔總資產",value:totalValue>0?`${((sel.value/totalValue)*100).toFixed(1)}%`:"---"},
                  ].map((item,i)=>(
                    <div key={i} className="card" style={{padding:"12px 14px"}}>
                      <div style={{fontSize:9,color:"#2a4060",letterSpacing:1,marginBottom:4,fontFamily:"'Noto Sans TC',sans-serif"}}>{item.label}</div>
                      <div style={{fontSize:15,fontWeight:500,color:"#c0d0e0"}}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {curPnl != null && (
                  <div className="card" style={{padding:"14px",marginBottom:10,borderColor:up?"#00cc8822":"#ff446622"}}>
                    <div style={{fontSize:9,color:"#2a4060",letterSpacing:2,marginBottom:10}}>帳面損益</div>
                    <div style={{display:"flex",justifyContent:"space-around"}}>
                      {[
                        {label:"每股",value:`${up?"+":""}${(sel.price-cur.cost).toFixed(0)}`},
                        {label:"總損益",value:`${up?"+":""}${Math.round(curPnl).toLocaleString()}`},
                        {label:"報酬率",value:`${up?"+":""}${curPnlPct}%`},
                      ].map((item,i)=>(
                        <div key={i} style={{textAlign:"center"}}>
                          <div style={{fontSize:11,color:"#4a6080",marginBottom:4,fontFamily:"'Noto Sans TC',sans-serif"}}>{item.label}</div>
                          <div style={{fontSize:18,fontWeight:700,color:up?"#00cc88":"#ff4466"}}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ⚡ 操作建議 */}
            {detailTab === "advice" && (
              <div>
                <div style={{background:"#0f1200",border:"1px solid #2a2800",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:11,color:"#706030",fontFamily:"'Noto Sans TC',sans-serif",lineHeight:1.7}}>
                  ⚠️ 本分析由 AI 生成，僅供參考，不構成投資建議。
                </div>
                <div className="card" style={{padding:"20px 16px",marginBottom:12,borderColor:"#ffd70033",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:10}}>⚡</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#ffd700",fontFamily:"'Noto Sans TC',sans-serif",marginBottom:6}}>{sel.name} 操作分析</div>
                  <div style={{fontSize:12,color:"#5070a0",fontFamily:"'Noto Sans TC',sans-serif",lineHeight:1.9,marginBottom:20}}>
                    整合持倉成本・籌碼・均線<br/>
                    輸出走勢機率・掛單建議・評等
                  </div>
                  <button onClick={()=>{ copyText(buildMsg()); setToast("✓ 已複製！請關閉此畫面，貼到 Claude 對話框送出"); setTimeout(()=>setToast(""),6000); }}
                    style={{width:"100%",background:"linear-gradient(135deg,#1a2800,#0d1808)",border:"1px solid #3a5020",color:"#7dcc30",padding:"16px",borderRadius:10,cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:15,fontWeight:700,letterSpacing:1}}>
                    開始分析（複製資料）
                  </button>
                </div>
                <div className="card" style={{padding:"14px"}}>
                  <div style={{fontSize:9,color:"#2a4060",letterSpacing:2,marginBottom:10}}>將送出的分析資料</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[
                      {label:"收盤價",value:sel.price?.toLocaleString()||"---"},
                      {label:"持倉損益",value:`${curPnlPct||"—"}%`,color:up?"#00cc88":"#ff4466"},
                      {label:"今日漲跌",value:`${sel.changePct>=0?"+":""}${sel.changePct}%`,color:sel.changePct>=0?"#ff6680":"#00cc88"},
                      {label:"目標上漲空間",value:upside?`+${upside}%`:"未設",color:"#00d4ff"},
                    ].map((item,i)=>(
                      <div key={i} style={{background:"#080e18",borderRadius:6,padding:"8px 10px"}}>
                        <div style={{fontSize:9,color:"#2a4060",marginBottom:2,fontFamily:"'Noto Sans TC',sans-serif"}}>{item.label}</div>
                        <div style={{fontSize:13,fontWeight:500,color:item.color||"#c0d0e0"}}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
