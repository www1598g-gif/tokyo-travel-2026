import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Utensils, CloudSun, Wind, AlertCircle, Phone, Wallet, Plane,
  Home, ChevronDown, ChevronUp, Navigation, Loader2, CloudRain, Sun, Cloud,
  Lock, KeyRound, Info, Compass, Sparkles, Droplets, Clock, Signal,
  CheckCircle, Banknote, FileText, AlertTriangle, Settings, Trash2,
  ShoppingBag, Ban, Smartphone, RefreshCw, Edit3, Save, Eye, Ticket,
  Train, Building2, BookOpen, Music, Wine, Gem, PawPrint, ArrowRight,
} from 'lucide-react';

import { ref, onValue, set, goOffline, goOnline, get } from "firebase/database";
import { db } from "./firebase";

// 🔥 所有資料都收在這個命名空間底下，避免跟同一個 Firebase 專案裡的
// 九州行程資料互相覆蓋
const NS = 'tokyo2026';
const r = (path) => ref(db, `${NS}/${path}`);

// ============================================================
// 東京風格插畫 — 無需外部圖檔，純 SVG 繪製
// ============================================================

// 東京鐵塔小圖示（取代九州版的鬱金香）
const TokyoTowerIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2 L9 20 H15 L12 2Z" fill="#E2472A" stroke="#B23A22" strokeWidth="0.6" />
    <path d="M12 2 L10.4 11 H13.6 L12 2Z" fill="#FFFFFF" stroke="#B23A22" strokeWidth="0.4" />
    <path d="M9.6 15 H14.4" stroke="#B23A22" strokeWidth="0.6" />
    <path d="M9 20 H15 L15.6 22 H8.4 Z" fill="#B23A22" />
    <circle cx="12" cy="4.2" r="0.7" fill="#F2C879" />
  </svg>
);

// 鎖定畫面用的東京夜景插畫（鐵塔＋晴空塔＋富士山剪影＋星空）
const TokyoNightArt = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0B0E2A" />
        <stop offset="55%" stopColor="#1B1F4B" />
        <stop offset="100%" stopColor="#3A2A55" />
      </linearGradient>
      <linearGradient id="fuji" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4A4270" />
        <stop offset="100%" stopColor="#2C2650" />
      </linearGradient>
      <radialGradient id="moon" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFF6D8" />
        <stop offset="100%" stopColor="#F2C879" />
      </radialGradient>
    </defs>
    <rect width="400" height="500" fill="url(#sky)" />
    {[...Array(40)].map((_, i) => (
      <circle key={i} cx={(i * 53) % 400} cy={(i * 97) % 260} r={i % 5 === 0 ? 1.6 : 0.8} fill="#FFF6D8" opacity={0.3 + (i % 4) * 0.15} />
    ))}
    <circle cx="320" cy="80" r="34" fill="url(#moon)" opacity="0.9" />
    <path d="M40 300 L150 150 L260 300 Z" fill="url(#fuji)" opacity="0.55" />
    <path d="M110 210 L150 150 L190 210 Z" fill="#F5EDE0" opacity="0.5" />
    {/* 晴空塔 */}
    <g opacity="0.9">
      <path d="M300 420 L305 230 L310 420 Z" fill="#241E3D" />
      <rect x="301" y="260" width="8" height="3" fill="#F2C879" />
      <rect x="302" y="310" width="6" height="3" fill="#F2C879" />
      <rect x="303" y="360" width="4" height="3" fill="#E2472A" />
      <circle cx="305" cy="225" r="3" fill="#F2C879" />
    </g>
    {/* 東京鐵塔 */}
    <g>
      <path d="M150 420 L172 160 L194 420 Z" fill="#E2472A" />
      <path d="M156 420 L172 175 L188 420 Z" fill="#B23A22" />
      <path d="M164 260 L180 260" stroke="#F5EDE0" strokeWidth="2" />
      <path d="M158 340 L186 340" stroke="#F5EDE0" strokeWidth="2" />
      <rect x="169" y="150" width="6" height="14" fill="#F5EDE0" />
      <circle cx="172" cy="148" r="2.4" fill="#F2C879" />
    </g>
    {/* 城市剪影 + 河面倒影 */}
    <path d="M0 430 L40 420 L60 400 L90 425 L120 405 L150 420 L200 415 L230 400 L260 420 L300 415 L340 400 L370 420 L400 410 L400 500 L0 500 Z" fill="#181433" />
    <rect x="0" y="430" width="400" height="70" fill="#0B0E2A" opacity="0.65" />
  </svg>
);

// ============================================================
// 基本資料設定
// ============================================================
const USERS = ['佑任', '睏寶', '學弟', '腳慢'];

const TRIP_DATES = [
  { date: '2026-09-24', label: 'D1・9/24 (四)', short: '9/24' },
  { date: '2026-09-25', label: 'D2・9/25 (五)', short: '9/25' },
  { date: '2026-09-26', label: 'D3・9/26 (六)', short: '9/26' },
  { date: '2026-09-27', label: 'D4・9/27 (日)', short: '9/27' },
];

const DEFAULT_ITINERARY_TEXT = `【D1 9/24（四）】
2:00 桃園機場第一航廈起飛 → 6:30 抵達成田
・放行李、吃早餐（🥪 or 昭和咖啡）
・上午彈性：Plan A 隨意休息／Plan B 9:30 開館三選一（東京都美術館大英博物館展／東京國立博物館／國立新美術館羅浮宮展）
・12:30 午餐：Ebimaru Ramen 海老丸らーめん（法式拉麵，尚未訂位，9/17 才開放預約）
・下午：神保町書店街（書泉、企鵝書店）→ 藏前小店 → 淺草雷門
・17:30-18:30 COIN LUCK 東京店 手作戒指體驗（已預約，現金付款，請提早5分鐘到）
・晚上：累累組回住宿／活力組去寶可夢中心；晚餐待定

【D2 9/25（五）】
・早晨：累累組睡覺／活力組東麻布步道橋拍照吃早餐
・10:00 開館，約 10:30-11:00 teamlab borderless（尚未訂位）
・午後：麻布台之丘／國立新美術館羅浮宮展／爬東京鐵塔，午餐隨意
・傍晚：東京車站（想去的人再去），晚餐待定
・21:00 銀座 Mixology Salon 酒吧（已預約，4名）

【D3 9/26（六）】
・上午：高円寺（氣象神社、古著、復古街區）
・午後：涉谷／表參道／原宿／新宿（錄音卡帶咖啡店、and ST TOKYO、Shibuya Publishing & Booksellers）
・21:30 惠比壽 蕃 YORONIKU 燒肉（已預約，4名）

【D4 9/27（日）】
・10:00 退房
・日暮里周邊：Le Coussinet 泡芙店、谷根千貓商圈、根津神社
・13:00 こち亀記念館／烏龍派出所博物館（已購票，4張）
・傍晚從龜有搭計程車到青砥，轉搭 Skyliner 到成田機場
　預計 6:35 出發、7:16 抵達，離 22:15 登機約有近 3 小時緩衝；若行程拖延，還有 7:15 那班可補救
・22:15 MM627 成田起飛`;

// ============================================================
// 天氣 Hero 區塊（東京版：西日暮里座標）
// ============================================================
const WeatherHero = ({ isAdmin, onLock }) => {
  const [data, setData] = useState(null);
  const [aqi, setAqi] = useState(15);
  const [bannerText, setBannerText] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [secretLinks, setSecretLinks] = useState([]);

  useEffect(() => {
    const unsubscribe = onValue(r('secretLinks'), (snapshot) => {
      const val = snapshot.val();
      if (val) setSecretLinks(val);
      else {
        const defaultLinks = [
          { name: '🚇 東京 Metro 即時運行情報', url: 'https://www.tokyometro.jp/unkou/index.html' },
          { name: '🚄 JR 東日本 運行情報', url: 'https://traininfo.jreast.co.jp/train_info/kanto.aspx' },
        ];
        setSecretLinks(defaultLinks);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchWeather = async () => {
    setIsLoading(true);
    try {
      // 西日暮里 / 田端一帶座標
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=35.7320&longitude=139.7660&current=temperature_2m,weather_code,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation_probability&forecast_days=10&timezone=Asia%2FTokyo'
      );
      const json = await res.json();

      let currentAqi = 15;
      let aqiSource = 'default';
      try {
        const waqiRes = await fetch('https://api.waqi.info/feed/tokyo/?token=6a1feb1b93b9f182f5ace9c2ffc8fdfc0e6e61c2');
        const waqiData = await waqiRes.json();
        if (waqiData.status === 'ok' && waqiData.data?.aqi) {
          currentAqi = waqiData.data.aqi;
          aqiSource = 'WAQI';
        } else throw new Error('WAQI 異常');
      } catch (e) {
        try {
          const iqairRes = await fetch('https://api.airvisual.com/v2/nearest_city?lat=35.7320&lon=139.7660&key=4743d035-1b8f-4a42-9ddf-66dee64f8b8a');
          const iqairData = await iqairRes.json();
          if (iqairData.status === 'success' && iqairData.data?.current?.pollution) {
            currentAqi = iqairData.data.current.pollution.aqius;
            aqiSource = 'IQAir';
          }
        } catch (e2) { aqiSource = 'N/A'; }
      }

      const cacheData = {
        weather: json, aqi: currentAqi, source: aqiSource,
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem('tokyo2026_weather_cache', JSON.stringify(cacheData));
      setAqi(currentAqi);
      setLastUpdate(`${cacheData.time} (${aqiSource})`);

      if (json?.current) {
        setData(json);
        const nowInJp = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        const currentHourInJp = nowInJp.getHours();
        const next3HoursRain = json.hourly.precipitation_probability.slice(currentHourInJp, currentHourInJp + 3);
        const maxRainProb = Math.max(...next3HoursRain);
        const newAlerts = [];
        if (maxRainProb > 40) newAlerts.push({ type: 'rain', msg: `🌧️ 局部降雨機率 ${maxRainProb}%，記得帶傘！` });
        if (currentAqi > 100) newAlerts.push({ type: 'aqi', msg: `😷 AQI 數值偏高，戶外請戴口罩。` });
        setAlerts(newAlerts);
      }
    } catch (e) {
      const saved = localStorage.getItem('tokyo2026_weather_cache');
      if (saved) {
        const cache = JSON.parse(saved);
        setData(cache.weather); setAqi(cache.aqi);
        setLastUpdate(`${cache.time} (Offline)`);
      }
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    const calcTime = () => {
      const nowInJp = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
      const startDate = new Date('2026-09-24T02:00:00');
      const endDate = new Date('2026-09-27T23:59:59');
      if (nowInJp < startDate) {
        const days = Math.ceil((startDate - nowInJp) / (1000 * 60 * 60 * 24));
        setBannerText(`✈️ 距離東京出發還有 ${days} 天！`);
      } else if (nowInJp > endDate) {
        setBannerText('👋 東京行圓滿結束了 QQ');
      } else {
        const dayNum = Math.floor((nowInJp - startDate) / (1000 * 60 * 60 * 24)) + 1;
        setBannerText(dayNum >= 4 ? '😭 旅程最後一天哭哭' : `🗼 旅程第 ${dayNum} 天 (${dayNum}/4)`);
      }
    };
    calcTime();
    const timer = setInterval(calcTime, 60000);
    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 20 * 60 * 1000);
    return () => { clearInterval(timer); clearInterval(weatherTimer); };
  }, []);

  const getWeatherIcon = (code, size = 20) => {
    if (code <= 1) return <Sun size={size} className="text-amber-500" strokeWidth={2.5} />;
    if (code <= 3 || code === 45 || code === 48) return <Cloud size={size} className="text-stone-400" strokeWidth={2.5} />;
    if (code >= 50) return <CloudRain size={size} className="text-blue-400" strokeWidth={2.5} />;
    return <CloudSun size={size} className="text-amber-400" strokeWidth={2.5} />;
  };
  const getAqiColor = (val) => {
    if (val <= 50) return 'bg-emerald-100 text-emerald-700';
    if (val <= 100) return 'bg-yellow-100 text-yellow-700';
    if (val <= 150) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };
  const getNext24Hours = () => {
    if (!data?.hourly?.time) return [];
    const nowInJp = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const startIndex = nowInJp.getHours() + 1;
    return data.hourly.time.slice(startIndex, startIndex + 24).map((t, i) => ({
      time: t.split('T')[1].slice(0, 5),
      temp: Math.round(data.hourly.temperature_2m[startIndex + i]),
      code: data.hourly.weather_code[startIndex + i],
      rain: data.hourly.precipitation_probability?.[startIndex + i] ?? 0,
    }));
  };
  const nextHours = getNext24Hours();

  return (
    <div className="relative pt-0 pb-8 px-6 rounded-b-[2.5rem] z-10 overflow-hidden" style={{ background: '#141530' }}>
      {bannerText && (
        <div className="absolute top-0 left-0 right-0 py-1.5 z-20 text-[10px] font-bold text-center text-white" style={{ background: '#E2472A' }}>
          {bannerText}
        </div>
      )}
      <button onClick={onLock} className="absolute top-0 right-0 z-30 h-[28px] w-[30px] flex items-center justify-center text-white/40 hover:text-white transition-colors" title="鎖定畫面">
        <Lock size={12} strokeWidth={2.5} />
      </button>

      <div className="relative z-10 mt-10">
        {alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-3 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm border" style={{ background: 'rgba(75,172,214,0.15)', borderColor: '#4BACD6', color: '#CFE8F5' }}>
                <CloudRain size={16} /> {alert.msg}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full whitespace-nowrap" style={{ background: 'rgba(226,71,42,0.18)', color: '#F2A18E' }}>
                佑任・睏寶・學弟・腳慢
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <TokyoTowerIcon className="w-7 h-7" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: '#F2C879' }}>Tokyo 2026</span>
            </div>
            <h1 className="text-4xl tracking-tight leading-[0.95] text-white" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              自由行<br /><span style={{ color: '#F2A18E' }}>隨興東京</span>
            </h1>
          </div>

          <div className="text-right flex-shrink-0 mt-2">
            <div onClick={fetchWeather} className="text-[10px] font-bold mb-1 uppercase tracking-widest cursor-pointer" style={{ color: 'rgba(255,255,255,0.4)' }}>
              西日暮里 Now
            </div>
            {data ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  {getWeatherIcon(data.current.weather_code, 34)}
                  <span className="text-5xl font-medium tracking-tighter text-white">{Math.round(data.current.temperature_2m)}°</span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${getAqiColor(aqi)}`}><Wind size={10} /> AQI {aqi}</div>
                  <div className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                    <Droplets size={10} /> {data.current.relative_humidity_2m}%
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1.5 cursor-pointer mt-2" onClick={fetchWeather}>
                  {lastUpdate && <span className="text-[10px] font-mono tracking-tighter" style={{ color: 'rgba(255,255,255,0.3)' }}>{lastUpdate}</span>}
                  <RefreshCw size={10} className={isLoading ? 'animate-spin text-blue-400' : 'text-white/30'} />
                </div>
              </div>
            ) : (
              <div className="animate-pulse flex gap-2 items-center justify-end">
                <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                <div className="w-12 h-8 bg-white/10 rounded"></div>
              </div>
            )}
          </div>
        </div>

        {data && nextHours.length > 0 && (
          <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center">
              <div className="text-[10px] font-bold border-l pl-3 mr-3 h-10 flex items-center justify-center tracking-widest flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.15)' }}>24H</div>
              <div className="flex overflow-x-auto gap-4 pb-2 w-full no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {nextHours.map((h, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 min-w-[3.5rem] flex-shrink-0">
                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>{h.time}</span>
                    <div className="py-1">{getWeatherIcon(h.code, 20)}</div>
                    <span className="text-sm font-bold text-white">{h.temp}°</span>
                    {h.rain >= 0 && <span className="text-[9px] font-bold" style={{ color: '#7FC8E8' }}>{h.rain}%</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent('東京 2026年9月下旬 西日暮里 田端 神保町 淺草 涉谷 銀座一帶 必吃美食與私房景點 也請納入日本在地Tabelog與小紅書評價 以中文回答')}`, '_blank')}
          className="w-full mt-3 py-3 backdrop-blur-md rounded-2xl flex items-center justify-center gap-2 text-sm font-bold active:scale-95 shadow-sm group"
          style={{ background: 'rgba(255,255,255,0.9)', color: '#1B1F3B' }}
        >
          <Sparkles size={16} className="text-teal-500 group-hover:rotate-12 transition-transform" /> Ask AI（Perplexity 深度探索）
        </button>

        {isAdmin && secretLinks.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            {secretLinks.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)', borderBottom: idx < secretLinks.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <span className="text-sm text-white/90">{link.name}</span>
                <ArrowRight size={14} className="text-white/40" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 穿搭指南（以 TRIP_DATES 為單位，不再依賴行程資料）
// ============================================================
const OutfitPickerModal = ({ onClose }) => {
  const [selected, setSelected] = useState(TRIP_DATES[0]);
  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl shadow-2xl p-6" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
        <h3 className="font-bold text-stone-800 text-base flex items-center gap-2 mb-4"><Sparkles size={18} className="text-amber-500" /> 選擇哪一天？</h3>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {TRIP_DATES.map((d) => (
            <button key={d.date} onClick={() => setSelected(d)} className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${selected.date === d.date ? 'text-white' : 'text-stone-500 border-stone-200'}`} style={selected.date === d.date ? { background: '#E2472A', borderColor: '#E2472A' } : {}}>
              {d.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const query = `${selected.date} 日本東京天氣預報，請根據天氣預報建議今天穿什麼衣服、需要帶什麼裝備（含是否需要帶傘防颱風雨），以繁體中文回答`;
            window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`, '_blank');
            onClose();
          }}
          className="w-full py-3.5 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
          style={{ background: '#1B1F3B' }}
        >
          <Sparkles size={16} className="text-teal-400" /> 查詢這天的穿搭建議
        </button>
      </div>
    </div>
  );
};

const OutfitGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOutfit, setShowOutfit] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  if (!isOpen)
    return (
      <div className="mx-6 mt-6 flex flex-col gap-2">
        <button onClick={() => setIsOpen(true)} className="bg-white shadow-sm border border-stone-100 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-stone-600 w-full active:scale-95 transition-transform">
          <Info size={14} className="text-amber-500" /> 查看九月東京穿搭建議
        </button>
        <button onClick={() => setShowOutfit(true)} className="bg-white shadow-sm border border-stone-100 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-stone-600 w-full active:scale-95 transition-transform">
          <Sparkles size={16} className="text-amber-500" /> 今日穿搭 AI 建議
        </button>
        <button onClick={() => setShowWeather(true)} className="bg-white shadow-sm border-2 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-stone-800 w-full active:scale-95 transition-transform" style={{ borderColor: '#1B1F3B', boxShadow: '2px 2px 0 #1B1F3B' }}>
          <Sun size={14} className="text-amber-500" /> 日本在地權威天氣站
        </button>

        {showOutfit && <OutfitPickerModal onClose={() => setShowOutfit(false)} />}

        {showWeather && (
          <div className="fixed inset-0 z-[99999] flex items-end justify-center" onClick={() => setShowWeather(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white w-full max-w-md rounded-t-3xl shadow-2xl p-6 border-t-4" style={{ borderColor: '#1B1F3B', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-stone-800 text-sm flex items-center gap-1.5 mb-5"><Wind size={16} className="text-blue-500" /> 日本在地權威觀測</h3>
              <div className="flex flex-col gap-2">
                <button onClick={() => window.open('https://weathernews.jp/onebox/35.732000/139.766000/', '_blank')} className="w-full py-2.5 border-2 rounded-xl font-bold text-xs text-stone-800 active:scale-95" style={{ background: '#F2C879', borderColor: '#1B1F3B' }}>🏠 西日暮里・田端（住宿一帶）</button>
                <button onClick={() => window.open('https://weathernews.jp/onebox/35.693840/139.700280/', '_blank')} className="w-full py-2.5 border-2 rounded-xl font-bold text-xs text-stone-800 active:scale-95" style={{ background: '#F2C879', borderColor: '#1B1F3B' }}>🎋 神保町・淺草</button>
                <button onClick={() => window.open('https://weathernews.jp/onebox/35.658580/139.701640/', '_blank')} className="w-full py-2.5 border-2 rounded-xl font-bold text-xs text-stone-800 active:scale-95" style={{ background: '#F2C879', borderColor: '#1B1F3B' }}>🛍️ 涉谷・原宿・新宿</button>
                <button onClick={() => window.open('https://weathernews.jp/onebox/35.671690/139.764560/', '_blank')} className="w-full py-2.5 border-2 rounded-xl font-bold text-xs text-stone-800 active:scale-95" style={{ background: '#F2C879', borderColor: '#1B1F3B' }}>🍷 銀座</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

  return (
    <div className="mx-6 mt-6 bg-white p-5 rounded-2xl border border-stone-100 shadow-sm relative animate-fadeIn">
      <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-stone-300 hover:text-stone-500"><ChevronUp size={18} /></button>
      <h3 className="flex items-center gap-2 font-bold text-base mb-3" style={{ color: '#1B1F3B', fontFamily: "'Noto Serif TC', serif" }}>
        <Sun size={18} className="text-amber-500" /> 九月東京穿搭指南
      </h3>
      <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 p-1.5 rounded-full text-amber-600 flex-shrink-0"><Sun size={12} /></div>
          <div><strong>白天（26-30°C）</strong><br />悶熱潮濕，短袖透氣衣物為主，九月仍是颱風季尾聲，隨身帶把摺疊傘。</div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 flex-shrink-0"><Wind size={12} /></div>
          <div><strong>夜晚 / 室內冷氣房（22-25°C）</strong><br />晚上逛涉谷、銀座或百貨商場時，建議帶件薄外套防冷氣。</div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600 flex-shrink-0"><Droplets size={12} /></div>
          <div><strong>步行量</strong><br />神保町、涉谷原宿、日暮里谷根千都是走逛型行程，建議穿好走的鞋子。</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 共享塗鴉白板（沿用九州版機制，重新配色 + 命名空間）
// ============================================================
const SharedWhiteboard = ({ isAdmin, isMember }) => {
  const canvasRef = useRef(null);
  const [tool, setToolState] = useState('pen');
  const [color, setColor] = useState('#1B1F3B');
  const [size, setSize] = useState(4);
  const [textInput, setTextInput] = useState('');
  const painting = useRef(false);
  const isInit = useRef(false);
  const strokeHistory = useRef([]);
  const redoHistory = useRef([]);
  const currentStroke = useRef([]);
  const currentStrokeKey = useRef(null);

  const COLORS = ['#1B1F3B', '#FFFFFF', '#E2472A', '#F2A18E', '#F2C879', '#4BACD6', '#6FA84B', '#9B59B6', '#EC4899', '#78716C'];

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, c.width, c.height);
    get(r('wb/snapshot')).then(snap => {
      if (snap.val()) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, c.width, c.height); isInit.current = true; };
        img.src = snap.val();
      } else isInit.current = true;
    });
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    const unsub = onValue(r('wb/strokes'), (snap) => {
      const data = snap.val();
      if (!isInit.current) return;
      const ctx = c.getContext('2d');
      get(r('wb/snapshot')).then(snapShot => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, c.width, c.height);
        const applyStrokes = () => { if (data) Object.values(data).forEach(stroke => drawStroke(ctx, stroke)); };
        if (snapShot.val()) {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0, c.width, c.height); applyStrokes(); };
          img.src = snapShot.val();
        } else applyStrokes();
      });
    });
    return () => unsub();
  }, []);

  const drawStroke = (ctx, stroke) => {
    if (stroke.type === 'text') {
      ctx.font = `${stroke.fontSize}px 'Space Mono', monospace`;
      ctx.fillStyle = stroke.color;
      ctx.fillText(stroke.text, stroke.x, stroke.y);
      return;
    }
    if (!stroke.points || stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    ctx.strokeStyle = stroke.type === 'eraser' ? '#FFFFFF' : stroke.color;
    ctx.lineWidth = stroke.type === 'eraser' ? stroke.size * 5 : stroke.size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const getPos = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width, sy = c.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: Math.round((src.clientX - rect.left) * sx), y: Math.round((src.clientY - rect.top) * sy) };
  };

  const startDraw = (e) => {
    e.preventDefault();
    if (tool === 'text') {
      if (!textInput.trim()) return;
      const pos = getPos(e);
      const stroke = { type: 'text', text: textInput, x: pos.x, y: pos.y, color, fontSize: Math.max(16, size * 3), ts: Date.now() };
      const key = Date.now().toString();
      strokeHistory.current.push({ key, stroke });
      redoHistory.current = [];
      set(r(`wb/strokes/${key}`), stroke);
      return;
    }
    painting.current = true;
    currentStroke.current = [getPos(e)];
    currentStrokeKey.current = Date.now().toString();
  };

  const draw = (e) => {
    e.preventDefault();
    if (!painting.current) return;
    const pos = getPos(e);
    currentStroke.current.push(pos);
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const pts = currentStroke.current;
    if (pts.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = tool === 'eraser' ? size * 5 : size;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    if (!painting.current) return;
    painting.current = false;
    if (currentStroke.current.length < 2) return;
    const stroke = { type: tool, color, size, points: currentStroke.current, ts: Date.now() };
    const key = currentStrokeKey.current;
    strokeHistory.current.push({ key, stroke });
    redoHistory.current = [];
    set(r(`wb/strokes/${key}`), stroke);
    currentStroke.current = [];
    get(r('wb/strokes')).then(snap => {
      const count = snap.val() ? Object.keys(snap.val()).length : 0;
      if (count > 80) mergeSnapshot();
    });
  };

  const undoLast = () => {
    if (strokeHistory.current.length === 0) return;
    const last = strokeHistory.current.pop();
    redoHistory.current.push(last.stroke);
    set(r(`wb/strokes/${last.key}`), null);
  };
  const redoLast = () => {
    if (redoHistory.current.length === 0) return;
    const stroke = redoHistory.current.pop();
    const key = Date.now().toString();
    strokeHistory.current.push({ key, stroke });
    set(r(`wb/strokes/${key}`), stroke);
  };
  const mergeSnapshot = () => {
    const c = canvasRef.current;
    const off = document.createElement('canvas');
    off.width = 480; off.height = 320;
    off.getContext('2d').drawImage(c, 0, 0);
    set(r('wb/snapshot'), off.toDataURL('image/jpeg', 0.65));
    set(r('wb/strokes'), null);
    strokeHistory.current = []; redoHistory.current = [];
  };
  const clearBoard = () => {
    if (!window.confirm('確定清空？所有人的塗鴉都會消失！')) return;
    set(r('wb/snapshot'), '');
    set(r('wb/strokes'), null);
    strokeHistory.current = []; redoHistory.current = [];
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, c.width, c.height);
  };
  const setTool = (t) => {
    setToolState(t);
    if (canvasRef.current) canvasRef.current.style.cursor = t === 'eraser' ? 'cell' : t === 'text' ? 'text' : 'crosshair';
  };
  const tbtn = (t) => `text-[9px] font-bold px-3 py-1.5 rounded-full border transition-all ${tool === t ? 'text-white' : 'bg-white text-stone-600 border-stone-300'}`;

  return (
    <section className="mt-4 rounded-[2rem] overflow-hidden border-2" style={{ borderColor: '#1B1F3B', boxShadow: '4px 4px 0 #1B1F3B' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b-2" style={{ background: '#F2C879', borderColor: '#1B1F3B' }}>
        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-900">✏️ 共享塗鴉白板</span>
        <span className="text-[9px] text-stone-600 ml-1">大家都在同一張畫布上！</span>
      </div>
      <canvas
        ref={canvasRef} width={480} height={320} className="block w-full bg-white"
        style={{ touchAction: 'none', cursor: isAdmin || isMember ? 'crosshair' : 'not-allowed' }}
        onMouseDown={isAdmin || isMember ? startDraw : undefined}
        onMouseMove={isAdmin || isMember ? draw : undefined}
        onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={isAdmin || isMember ? startDraw : undefined}
        onTouchMove={isAdmin || isMember ? draw : undefined}
        onTouchEnd={stopDraw}
      />
      <div className="px-3 py-2.5 border-t-2 bg-stone-50 flex flex-wrap items-center gap-2" style={{ borderColor: '#1B1F3B' }}>
        <button onClick={() => setTool('pen')} className={tbtn('pen')} style={tool === 'pen' ? { background: '#1B1F3B' } : {}}>✏️ 畫筆</button>
        <button onClick={() => setTool('eraser')} className={tbtn('eraser')} style={tool === 'eraser' ? { background: '#1B1F3B' } : {}}>⬜ 橡皮</button>
        <button onClick={() => setTool('text')} className={tbtn('text')} style={tool === 'text' ? { background: '#1B1F3B' } : {}}>🔤 文字</button>
        <div className="w-px h-5 bg-stone-300 mx-1" />
        {COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }} className="w-5 h-5 rounded-full border-2 flex-shrink-0 transition-transform" style={{ background: c, borderColor: color === c ? '#1B1F3B' : 'transparent', transform: color === c ? 'scale(1.3)' : 'scale(1)' }} />
        ))}
        <button onClick={undoLast} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-stone-400 text-stone-600 bg-white">↩ 上一步</button>
        <button onClick={redoLast} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-stone-400 text-stone-600 bg-white">↪ 下一步</button>
        {(isAdmin || isMember) && <button onClick={clearBoard} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-red-300 text-red-500 bg-white">🗑 清空</button>}
      </div>
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex items-center gap-3">
        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">SIZE</span>
        <input type="range" min="2" max="30" value={size} onChange={e => setSize(parseInt(e.target.value))} className="flex-1" />
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="rounded-full border border-stone-400" style={{ background: color, width: Math.max(4, Math.min(size * 1.2, 24)), height: Math.max(4, Math.min(size * 1.2, 24)) }} />
        </div>
      </div>
      {tool === 'text' && (
        <div className="px-3 py-2.5 bg-blue-50 border-t border-stone-200 flex gap-2 items-center animate-fadeIn">
          <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="輸入文字後點畫布放置..." maxLength={20} className="flex-1 text-xs px-3 py-2 rounded-full border border-stone-300 bg-white outline-none focus:border-amber-400" />
          <span className="text-[9px] text-stone-400 whitespace-nowrap">→ 點畫布</span>
        </div>
      )}
    </section>
  );
};

// ============================================================
// 簡易共享行程文字編輯器（取代九州版 Day 結構）
// ============================================================
const FreeItinerary = ({ isAdmin, isMember }) => {
  const [text, setText] = useState(DEFAULT_ITINERARY_TEXT);
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastEditor, setLastEditor] = useState('');
  const canEdit = isAdmin || isMember;

  useEffect(() => {
    const unsub = onValue(r('freeItinerary'), (snap) => {
      const val = snap.val();
      if (val && typeof val === 'object') {
        setText(val.content || DEFAULT_ITINERARY_TEXT);
        setLastEditor(val.editor || '');
      } else if (typeof val === 'string' && val) {
        setText(val);
      }
    });
    return () => unsub();
  }, []);

  const startEdit = () => { setDraft(text); setIsEditing(true); };
  const saveEdit = () => {
    set(r('freeItinerary'), { content: draft, editor: '最後編輯', ts: Date.now() }).catch(() => alert('雲端同步失敗 🛜'));
    setText(draft);
    setIsEditing(false);
  };

  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl tracking-tight" style={{ color: '#1B1F3B', fontFamily: "'Noto Serif TC', serif" }}>
          <span className="inline-block w-1.5 h-6 rounded-full align-middle mr-2" style={{ background: '#E2472A' }}></span>自由行程筆記
        </h2>
        {canEdit && !isEditing && (
          <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white active:scale-95" style={{ background: '#1B1F3B' }}>
            <Edit3 size={12} /> 編輯
          </button>
        )}
      </div>
      <p className="text-[11px] text-stone-400 mb-4">這次是隨興旅，不特別排定表格式行程 — 大家可以直接在這裡寫、改、加註記，全部即時同步。</p>

      {isEditing ? (
        <div className="animate-fadeIn">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-h-[420px] p-4 rounded-2xl border-2 text-sm leading-relaxed font-medium outline-none bg-white"
            style={{ borderColor: '#1B1F3B', fontFamily: "'Noto Sans TC', sans-serif" }}
            placeholder="在這裡自由編輯行程..."
          />
          <div className="flex gap-2 mt-3">
            <button onClick={saveEdit} className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 active:scale-95" style={{ background: '#E2472A' }}>
              <Save size={16} /> 儲存並同步
            </button>
            <button onClick={() => setIsEditing(false)} className="px-5 py-3 rounded-xl font-bold text-stone-500 border border-stone-200 bg-white active:scale-95">取消</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          {!canEdit && (
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-bold mb-3"><Eye size={11} /> 訪客唯讀模式</div>
          )}
          <p className="text-sm text-stone-700 leading-[1.9] whitespace-pre-line" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>{text}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 航班卡片
// ============================================================
const FlightCard = ({ type, date, flightNo, time, airline, from, to, fromCode, toCode, fromTerminal, toTerminal }) => {
  const searchUrl = `https://www.google.com/search?q=${flightNo}+flight+status`;
  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm mb-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 z-0" style={{ background: '#FBF3E4' }}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider text-white" style={{ background: type === '去程' ? '#E2472A' : '#4B5563' }}>{type}</span>
          <span className="text-xs font-bold text-stone-400">{date}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="text-center min-w-[3rem]">
            <div className="text-2xl font-bold text-stone-800 leading-none mb-1">{from}</div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-stone-400 font-bold tracking-widest">{fromCode}</span>
              {fromTerminal && <span className="mt-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow-sm" style={{ background: '#E2472A' }}>{fromTerminal}</span>}
            </div>
          </div>
          <div className="flex-1 px-3 flex flex-col items-center">
            <div className="text-xs font-bold text-stone-500 mb-2">{flightNo}</div>
            <div className="w-full h-[2px] bg-stone-200 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1"><Plane size={14} className="text-stone-300 rotate-90" /></div>
            </div>
            <div className="text-xs font-bold text-stone-400 mt-2 whitespace-nowrap">{time}</div>
          </div>
          <div className="text-center min-w-[3rem]">
            <div className="text-2xl font-bold text-stone-800 leading-none mb-1">{to}</div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-stone-400 font-bold tracking-widest">{toCode}</span>
              {toTerminal && <span className="mt-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow-sm" style={{ background: '#4B5563' }}>{toTerminal}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-xs text-stone-500 font-medium">{airline}</span></div>
          <a href={searchUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full">即時動態 <ArrowRight size={12} /></a>
        </div>
      </div>
    </div>
  );
};

const UTILS_DATA = {
  flights: [
    { type: '去程', date: '9/24 (四)', flightNo: 'MM620', time: '02:00 - 06:30', airline: '樂桃航空 Peach', from: '台北', fromCode: 'TPE', fromTerminal: 'T1', to: '成田', toCode: 'NRT', toTerminal: '' },
    { type: '回程', date: '9/27 (日)', flightNo: 'MM627', time: '22:15 起飛', airline: '樂桃航空 Peach', from: '成田', fromCode: 'NRT', fromTerminal: '', to: '台北', toCode: 'TPE', toTerminal: 'T1' },
  ],
  accommodation: {
    name: 'Airbnb',
    address: '東京都北区田端新町1-6-7',
    station: '最寄站：JR「西日暮里」站',
    keyNote: '鑰匙在建物左側的鑰匙盒（Key Box）內，密碼「0708」',
    dates: '9/24 - 9/27（全程同一間）',
    mapQuery: '東京都北区田端新町1-6-7',
  },
  emergency: {
    office: '台北駐日經濟文化代表處（東京本處）',
    address: '東京都港区白金台5-20-2',
    officeTel: '+81-3-3280-7811',
    emergencyMobile1: '+81-80-1009-7179',
    emergencyMobile2: '+81-80-1009-7436',
    globalFree: '001-010-800-0885-0885',
  },
  notes: '九月仍是颱風季尾聲，出發前留意颱風動態與班機異動通知。\n住宿鑰匙盒密碼「0708」請勿外流，退房記得放回鑰匙盒鎖好。',
  driveUrl: 'https://drive.google.com/drive/folders/1ug9ArdSALUtTHR6zHTY5LeWRjl6B_u-I?usp=sharing',
};

// ============================================================
// 匯率換算
// ============================================================
const CurrencySection = () => {
  const [rate, setRate] = useState(4.65);
  const [twd, setTwd] = useState('');
  const [jpy, setJpy] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const savedRate = localStorage.getItem('tokyo2026_exchange_rate');
    const savedRateTime = localStorage.getItem('tokyo2026_exchange_time');
    if (savedRate) { setRate(parseFloat(savedRate)); setLastUpdate(savedRateTime + ' (離線)'); }
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/TWD');
        const data = await res.json();
        if (data?.rates?.JPY) {
          setRate(data.rates.JPY);
          const newTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
          setLastUpdate(newTime);
          localStorage.setItem('tokyo2026_exchange_rate', data.rates.JPY);
          localStorage.setItem('tokyo2026_exchange_time', newTime);
        }
      } catch (e) { /* ignore */ }
    };
    fetchRate();
  }, []);

  return (
    <section className="bg-white p-6 rounded-2xl border border-stone-100 mb-6">
      <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-4 border-b pb-3"><Wallet size={18} className="text-green-600" /> 匯率換算</h3>
      <div className="bg-green-50 p-4 rounded-xl">
        <div className="text-[10px] text-green-600 font-bold mb-2 flex justify-between"><span>即時基準：1 TWD ≈ {rate} JPY</span><span>{lastUpdate}</span></div>
        <div className="flex items-center gap-2">
          <input type="number" value={twd} onChange={(e) => { setTwd(e.target.value); setJpy(e.target.value ? (parseFloat(e.target.value) * rate).toFixed(0) : ''); }} placeholder="台幣" className="w-full p-2 rounded-lg border border-green-200 outline-none focus:border-green-500 font-bold text-stone-700" />
          <span className="text-stone-400 font-bold">=</span>
          <input type="number" value={jpy} onChange={(e) => { setJpy(e.target.value); setTwd(e.target.value ? (parseFloat(e.target.value) / rate).toFixed(1) : ''); }} placeholder="日幣" className="w-full p-2 rounded-lg border border-green-200 outline-none focus:border-green-500 font-bold text-stone-700" />
        </div>
      </div>
    </section>
  );
};

// ============================================================
// 已預約商家清單（僅 admin / member 可見，訪客完全看不到本區）
// ============================================================
const DEFAULT_RESERVATIONS = [
  { name: 'Ebimaru Ramen 海老丸らーめん（法式拉麵）', date: '9/24 (四)', time: '12:30', note: '尚未訂位，9/17 才開放預約', status: 'pending' },
  { name: 'COIN LUCK 東京店（手作戒指體驗）', date: '9/24 (四)', time: '17:30-18:30', note: '已預約成功，現金付款，請提早5分鐘到場', status: 'confirmed' },
  { name: 'teamlab borderless', date: '9/25 (五)', time: '約10:30', note: '尚未訂位', status: 'pending' },
  { name: 'Mixology Salon（銀座酒吧）', date: '9/25 (五)', time: '21:00', note: '確認號碼 HH3HQK・Chang, YuJen・4名', status: 'confirmed' },
  { name: 'Ebisu YORONIKU 蕃（燒肉）', date: '9/26 (六)', time: '21:30', note: '確認號碼 XGUWX2・Chang, YuJen・4名', status: 'confirmed' },
  { name: 'こち亀記念館 烏龍派出所博物館', date: '9/27 (日)', time: '13:00', note: '申込番号 37301717・已購票4張（大人票 ¥700 x4＝¥2,800）', status: 'confirmed', ticketUrl: 'https://www.etix.com/kketix/online/onlinereprint.jsp?userID=37301717&password=44062257' },
];

const ReservationAdminSection = ({ reservations, saveList }) => {
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newNote, setNewNote] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newList = [...reservations, { name: newName, date: newDate, time: newTime, note: newNote, status: 'confirmed' }];
    saveList(newList);
    setNewName(''); setNewDate(''); setNewTime(''); setNewNote('');
  };

  return (
    <div className="p-4 border-t border-stone-100 bg-blue-50 space-y-2">
      <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">管理員新增預約</div>
      <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="店名" className="w-full p-2 border rounded-lg text-xs bg-white" />
      <div className="grid grid-cols-2 gap-2">
        <input value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="日期 (9/25)" className="p-2 border rounded-lg text-xs bg-white" />
        <input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="時間 (21:00)" className="p-2 border rounded-lg text-xs bg-white" />
      </div>
      <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="備註（預約號碼等）" className="w-full p-2 border rounded-lg text-xs bg-white" />
      <button onClick={handleAdd} className="w-full text-white font-bold py-2 rounded-xl text-xs" style={{ background: '#1B1F3B' }}>+ 新增</button>
      {reservations.map((res, i) => (
        <div key={i} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg">
          <span>{res.name} · {res.date} {res.time}</span>
          <button onClick={() => saveList(reservations.filter((_, idx) => idx !== i))} className="text-red-400 ml-2">×</button>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// 行李打包頁
// ============================================================
const DEFAULT_ITEMS = [
  'eSIM / 網卡(行前/入境)', 'Visit Japan Web填妥(行前)', '乳液、凡士林', '防曬乳', '化妝品',
  '衣服、褲子', '睡衣', '內衣褲、襪子', '護照', '提款卡 (開國外提款)', '信用卡', '身分證/健保卡',
  '現金 (日幣/台幣)', '牙膏、牙刷(飯店有)', '行李箱 (確認密碼)', '一般出門鞋子', '室內拖/室外拖',
  '手機 & 充電器', '行動電源(請用透明袋裝好)', '衛生紙/濕紙巾', '吹風機(飯店有)', '梳子',
  '暈車藥', '防蚊液', '個人藥品', '雨傘（颱風季必備）', '塑膠袋 (髒衣物用)', '沐浴乳/洗髮精',
  '數位相機/傳統相機/充電器/底片', '隱形眼鏡/藥水/器具', '眼鏡/眼鏡盒', '墨鏡', '刮鬍刀/刮鬍泡', '口罩(看自己)',
];

const TokyoTips = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="mx-6 mt-6 mb-6">
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: '#F2C879' }}>
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 font-bold transition-colors" style={{ background: '#FBF3E4', color: '#8A5A1E' }}>
          <div className="flex items-center gap-2"><AlertCircle size={18} style={{ color: '#C97A1E' }} /><span>2026 東京行前提醒</span></div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {isOpen && (
          <div className="p-4 space-y-4 text-sm text-stone-700 leading-relaxed" style={{ background: '#FBF3E4' }}>
            <div className="flex gap-3">
              <div className="min-w-[24px] text-amber-600 font-bold mt-1"><AlertTriangle size={18} /></div>
              <div>
                <strong className="text-stone-900 block mb-1">行動電源攜帶鐵律</strong>
                <ul className="list-disc pl-4 text-xs text-stone-500 space-y-1">
                  <li>手提行動電源<span className="text-red-600 font-bold">絕對嚴禁託運</span>，必須隨身攜帶，並依航空公司規範放置。</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="min-w-[24px] text-blue-600 font-bold mt-1"><Train size={18} /></div>
              <div>
                <strong className="text-stone-900 block mb-1">交通卡</strong>
                <p className="text-xs text-stone-500">建議使用apple-pay Suica 或現場買實體 Suica/PASMO，東京地鐵、JR、公車幾乎都通用。悠遊卡在東京無法直接搭車。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="min-w-[24px] text-emerald-600 font-bold mt-1"><CloudRain size={18} /></div>
              <div>
                <strong className="text-stone-900 block mb-1">九月颱風季</strong>
                <p className="text-xs text-stone-500">9月下旬仍可能有颱風尾或午後雷陣雨，出發前留意班機異動通知，行程盡量保留彈性備案。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="min-w-[24px] text-rose-600 font-bold mt-1"><KeyRound size={18} /></div>
              <div>
                <strong className="text-stone-900 block mb-1">住宿鑰匙盒</strong>
                <p className="text-xs text-stone-500">Airbnb 鑰匙在建物左側鑰匙盒內，密碼在工具頁，退房記得把鑰匙放回鎖好。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PackingPage = ({ isAdmin, isMember }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [packingData, setPackingData] = useState({});
  const [newItem, setNewItem] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tokyo2026_packing_list');
    if (saved) setPackingData(JSON.parse(saved));
    const unsubscribe = onValue(r('packingList'), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPackingData(val);
        localStorage.setItem('tokyo2026_packing_list', JSON.stringify(val));
      } else {
        const initialData = {};
        USERS.forEach((user) => { initialData[user] = DEFAULT_ITEMS.map((item) => ({ name: item, checked: false })); });
        set(r('packingList'), initialData);
        setPackingData(initialData);
      }
    });
    return () => unsubscribe();
  }, []);

  const saveToStorage = (newData) => {
    set(r('packingList'), newData).catch(() => alert('雲端同步失敗 🛜'));
    setPackingData(newData);
  };

  const toggleItem = (user, index) => {
    if (!isAdmin && !isMember) { setShowToast(true); setTimeout(() => setShowToast(false), 3000); return; }
    const newData = { ...packingData };
    newData[user][index].checked = !newData[user][index].checked;
    saveToStorage(newData);
  };
  const addItem = () => {
    if (!newItem.trim() || !currentUser) return;
    const newData = { ...packingData };
    newData[currentUser] = [{ name: newItem, checked: false }, ...newData[currentUser]];
    saveToStorage(newData);
    setNewItem('');
  };
  const deleteItem = (index) => {
    if (!window.confirm('確定刪除此項目？')) return;
    const newData = { ...packingData };
    newData[currentUser].splice(index, 1);
    saveToStorage(newData);
  };
  const getProgress = (user) => {
    if (!packingData[user]) return 0;
    const total = packingData[user].length;
    const checked = packingData[user].filter((i) => i.checked).length;
    return total === 0 ? 0 : Math.round((checked / total) * 100);
  };

  return (
    <div className="pb-24 min-h-screen bg-[#FAF7F0] relative">
      <TokyoTips />
      <div className="mx-6 mt-6">
        <a href="https://vjw-lp.digital.go.jp/zh-hant/" target="_blank" rel="noreferrer" className="bg-white shadow-sm border border-stone-100 py-4 px-4 rounded-2xl flex items-center justify-between gap-2 text-stone-600 w-full active:scale-95 transition-transform">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl"><FileText size={20} className="text-blue-500" /></div>
            <div><div className="font-bold text-sm text-stone-800">Visit Japan Web</div><div className="text-[10px] text-stone-400 mt-0.5">入境申報 / 免稅 / 簽證</div></div>
          </div>
          <ArrowRight size={16} className="text-stone-400" />
        </a>
      </div>

      {showToast && (
        <div className="fixed bottom-24 left-6 right-6 z-50 animate-bounce">
          <div className="text-white p-4 rounded-2xl border flex items-center gap-3" style={{ background: '#1B1F3B', borderColor: '#2C2F55' }}>
            <Lock size={20} style={{ color: '#F2C879' }} />
            <div><div className="font-bold text-sm">訪客唯讀模式 Read Only</div><div className="text-[10px] text-stone-300">請輸入密碼解鎖後編輯項目</div></div>
          </div>
        </div>
      )}

      <div className="px-6 mt-6 mb-4">
        <h2 className="text-2xl tracking-tight flex items-center gap-2" style={{ color: '#1B1F3B', fontFamily: "'Noto Serif TC', serif" }}>
          <span className="w-1.5 h-6 rounded-full" style={{ background: '#E2472A' }}></span>行李防呆準備清單
        </h2>
      </div>
      <div className="px-6 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {USERS.map((user) => (
            <button key={user} onClick={() => setCurrentUser(user)} className="relative flex flex-col items-center justify-center rounded-2xl border py-4 transition-all" style={currentUser === user ? { background: '#1B1F3B', color: '#fff', borderColor: '#1B1F3B' } : { background: '#fff', color: '#78716C', borderColor: '#E7E2D6' }}>
              <span className="font-bold text-sm">{user}</span>
              <span className="text-[9px] mt-1 opacity-80">{getProgress(user)}%</span>
            </button>
          ))}
        </div>
      </div>
      {currentUser ? (
        <div className="px-6 animate-fadeIn">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif TC', serif" }}>{currentUser} 的打包清單</h2>
            <span className="text-xs text-stone-400 font-bold">{packingData[currentUser]?.filter(i => i.checked).length} / {packingData[currentUser]?.length} 完成</span>
          </div>
          <div className="h-1.5 w-full bg-stone-200 rounded-full mb-6 overflow-hidden"><div className="h-full transition-all duration-500" style={{ width: `${getProgress(currentUser)}%`, background: 'linear-gradient(90deg,#4BACD6,#6FA84B)' }} /></div>
          {(isAdmin || isMember) && (
            <div className="mb-6 flex gap-2">
              <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="自訂行李項目..." className="flex-1 p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 bg-white shadow-sm placeholder:text-stone-400" onKeyPress={(e) => e.key === 'Enter' && addItem()} />
              <button onClick={addItem} className="text-white px-5 rounded-xl font-bold" style={{ background: '#1B1F3B' }}>+</button>
            </div>
          )}
          <div className="space-y-3">
            {packingData[currentUser]?.map((item, idx) => (
              <div key={idx} onClick={() => toggleItem(currentUser, idx)} className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${item.checked ? 'bg-stone-100 border-transparent opacity-60' : 'bg-white border-stone-100 shadow-sm hover:shadow-md'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${item.checked ? 'text-white' : 'border-stone-300 bg-stone-50'}`} style={item.checked ? { background: '#6FA84B', borderColor: '#6FA84B' } : {}}>{item.checked && <CheckCircle size={14} />}</div>
                <span className={`flex-1 font-medium ${item.checked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{item.name}</span>
                {(isAdmin || isMember) && <button onClick={(e) => { e.stopPropagation(); deleteItem(idx); }} className="text-stone-300 hover:text-red-400">×</button>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-10 py-20 text-center text-stone-400"><p className="text-sm">👆 請先點選上方按鈕<br />開啟專屬清單</p></div>
      )}
    </div>
  );
};

// ============================================================
// 指南頁
// ============================================================
const GuidePage = ({ isAdmin, isMember, noticeText, updateNoticeText }) => {
  const [showPickyEater, setShowPickyEater] = useState(false);
  const [sharedStores, setSharedStores] = useState([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreNote, setNewStoreNote] = useState('');
  const [showTaxRefund, setShowTaxRefund] = useState(false);
  const [adderName, setAdderName] = useState('佑任');
  const [showReservations, setShowReservations] = useState(true);
  const [reservations, setReservations] = useState(DEFAULT_RESERVATIONS);

  useEffect(() => {
    const unsubscribe = onValue(r('reservations'), (snapshot) => {
      const data = snapshot.val();
      if (data) setReservations(data);
    });
    return () => unsubscribe();
  }, []);
  const saveReservations = (list) => { set(r('reservations'), list).catch(() => alert('雲端同步失敗 🛜')); setReservations(list); };

  useEffect(() => {
    const unsubscribe = onValue(r('sharedStores'), (snapshot) => { if (snapshot.val()) setSharedStores(snapshot.val()); });
    return () => unsubscribe();
  }, []);
  const handleAddStore = () => {
    if (!newStoreName.trim()) return;
    const newList = [...sharedStores, { name: newStoreName, note: newStoreNote, adder: adderName }];
    set(r('sharedStores'), newList).then(() => { setNewStoreName(''); setNewStoreNote(''); });
  };

  const pickyItems = [
    { th: '生魚・刺身NG', zh: '不吃生魚片 / 生食' }, { th: '牛肉NG', zh: '不吃牛肉' },
    { th: 'パクチーNG', zh: '不加香菜' }, { th: 'ネギNG', zh: '不加蔥' },
    { th: '生姜NG', zh: '不加薑' }, { th: 'ニンニクNG', zh: '不加蒜' },
    { th: 'シナモンNG', zh: '不加肉桂' }, { th: 'ニラNG', zh: '不加韭菜' },
    { th: '八角NG', zh: '不加八角' }, { th: 'セロリNG', zh: '不加芹菜' },
  ];

  const guideSections = [
    { title: '神保町書店街', icon: <BookOpen className="text-amber-700" />, desc: '書泉、企鵝書店等古書 / 新書店群，愛書人的聖地，離海老丸拉麵很近。', color: 'bg-amber-50 border-amber-100', mapUrl: 'https://maps.app.goo.gl/PpExGD3mQef9pxXi7?g_st=ic', aiQuery: '神保町 書店 古書店 推薦 2026 以中文回答' },
    { title: '淺草・藏前', icon: <Building2 className="text-red-600" />, desc: '雷門、仲見世通，藏前一帶則是文青小店與職人工藝品聚落。', color: 'bg-red-50 border-red-100', mapUrl: 'https://www.google.com/maps/search/?api=1&query=淺草雷門', aiQuery: '淺草 藏前 私房小店 咖啡廳 推薦 2026 以中文回答' },
    { title: '手作戒指體驗', icon: <Gem className="text-rose-500" />, desc: 'COIN LUCK 東京店，用真的日本硬幣現場手作一枚專屬戒指，只收現金。', color: 'bg-rose-50 border-rose-100', mapUrl: 'https://maps.app.goo.gl/1ng8a4jfFQhjzfiF8?g_st=ic', aiQuery: 'COIN LUCK 東京 硬幣戒指 體驗 心得 以中文回答' },
    { title: '寶可夢中心', icon: <Sparkles className="text-yellow-500" />, desc: '活力還夠的話，晚上可以安排一趟寶可夢周邊朝聖。', color: 'bg-yellow-50 border-yellow-100', mapUrl: 'https://maps.app.goo.gl/CAa2zRjFdPLsipvY9?g_st=ic', aiQuery: '東京 寶可夢中心 Pokemon Center 逛街推薦 以中文回答' },
    { title: 'teamlab borderless', icon: <Sparkles className="text-purple-500" />, desc: '沉浸式數位藝術展，10:00 開館，建議提早到場排隊。', color: 'bg-purple-50 border-purple-100', mapUrl: 'https://maps.app.goo.gl/bnuCqUKXswoJh4mF6?g_st=ic', aiQuery: 'teamlab borderless 東京 麻布台之丘 參觀攻略 以中文回答' },
    { title: '麻布台之丘 / 東京鐵塔', icon: <TokyoTowerIcon className="w-5 h-5" />, desc: '新地標麻布台之丘商場，或直接去爬東京鐵塔看夜景。', color: 'bg-orange-50 border-orange-100', mapUrl: 'https://www.google.com/maps/search/?api=1&query=麻布台之丘', aiQuery: '麻布台之丘 東京鐵塔 一日遊 推薦 以中文回答' },
    { title: '銀座酒吧巡禮', icon: <Wine className="text-purple-700" />, desc: 'Mixology Salon 特色調酒吧，21:00 已預約 4 名。', color: 'bg-indigo-50 border-indigo-100', mapUrl: 'https://maps.app.goo.gl/GeMsdt98DpWvfVKPA?g_st=ic', aiQuery: '銀座 特色酒吧 調酒 推薦 2026 以中文回答' },
    { title: '高円寺', icon: <Music className="text-teal-600" />, desc: '氣象神社、古着屋、復古昭和氛圍，喜歡挖寶的人會愛上這裡。', color: 'bg-teal-50 border-teal-100', mapUrl: 'https://www.google.com/maps/search/?api=1&query=高円寺', aiQuery: '高円寺 古着 氣象神社 逛街路線 以中文回答' },
    { title: '涉谷・原宿・新宿', icon: <ShoppingBag className="text-blue-600" />, desc: '錄音卡帶咖啡店、and ST TOKYO、Shibuya Publishing & Booksellers 選書店。', color: 'bg-blue-50 border-blue-100', mapUrl: 'https://maps.app.goo.gl/4Tqw6E3jgPotf8Ng6?g_st=ic', aiQuery: '涉谷 原宿 新宿 特色小店 選物店 推薦 2026 以中文回答' },
    { title: '惠比壽燒肉', icon: <Utensils className="text-red-700" />, desc: 'Ebisu YORONIKU 蕃，9/26 21:30 已預約4名，東京數一數二難訂燒肉名店。', color: 'bg-red-50 border-red-100', mapUrl: 'https://maps.app.goo.gl/UfEbc4f2nvwEqai17?g_st=ic', aiQuery: 'Ebisu YORONIKU 蕃 燒肉 心得 以中文回答' },
    { title: '日暮里・谷根千', icon: <PawPrint className="text-orange-600" />, desc: '泡芙店 Le Coussinet、貓咪商圈、根津神社，離住宿最近的散步範圍。', color: 'bg-orange-50 border-orange-100', mapUrl: 'https://maps.app.goo.gl/gBoD572My7T6cWMN6?g_st=ic', aiQuery: '日暮里 谷根千 散步路線 貓咪 神社 推薦 以中文回答' },
    { title: '龜有・烏龍派出所', icon: <Ticket className="text-emerald-600" />, desc: 'こち亀記念館，9/27 13:00 已購票4張，逛完直接坐車到青砥轉 Skyliner 去機場。', color: 'bg-emerald-50 border-emerald-100', mapUrl: 'https://maps.app.goo.gl/Uy7regD17c4h8EbHA?g_st=ic', aiQuery: '龜有 烏龍派出所 こち亀記念館 周邊 推薦 以中文回答' },
  ];

  return (
    <div className="p-6 space-y-6 pb-24 animate-fadeIn">
      <section>
        <div className="bg-white border rounded-[2rem] p-5 shadow-sm" style={{ borderColor: '#F2C879' }}>
          <div className="flex items-center gap-2 mb-3 font-bold text-xs uppercase tracking-widest" style={{ color: '#C97A1E' }}><Info size={14} /> 團隊重要通知公佈欄</div>
          {isAdmin ? (
            <textarea value={noticeText} onChange={(e) => updateNoticeText(e.target.value)} className="w-full rounded-2xl p-3 text-sm min-h-[100px] outline-none" style={{ background: '#FBF3E4' }} />
          ) : (
            <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-line italic px-1">{noticeText}</div>
          )}
        </div>
      </section>

      <SharedWhiteboard isAdmin={isAdmin} isMember={isMember} />

      <section>
        <button onClick={() => setShowPickyEater(!showPickyEater)} className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl text-rose-500"><Ban size={20} /></div><div className="font-bold text-rose-800 text-sm">挑食避雷救援卡（日本餐廳出示）</div></div>
          {showPickyEater ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showPickyEater && (
          <div className="mt-3 bg-white rounded-3xl border border-rose-100 overflow-hidden divide-y">
            {pickyItems.map((item, i) => (
              <div key={i} className="px-5 py-4 flex justify-between items-center">
                <span className="font-bold text-stone-800">{item.zh}</span>
                <span className="text-base font-black text-rose-600" style={{ fontFamily: "'Noto Serif TC', serif" }}>{item.th}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <button onClick={() => setShowTaxRefund(!showTaxRefund)} className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl text-amber-600"><Banknote size={20} /></div><div className="font-bold text-amber-800 text-sm">2026 日本一般免稅規定</div></div>
          {showTaxRefund ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showTaxRefund && (
          <div className="mt-3 bg-white rounded-3xl border border-amber-200 p-5 space-y-3 text-sm">
            <p>🛍️ <strong>一般物品/消耗品門檻</strong>：單日同店消費滿 5,000 日圓（未稅）以上即可當場辦理免稅退稅。</p>
            <p>🛑 <strong>注意</strong>：消耗品會以免稅袋密封，離開日本前<strong>嚴禁拆封使用</strong>，海關抽查若已拆封會被要求補繳消費稅。</p>
          </div>
        )}
      </section>

      {isMember && (
        <section>
          <button onClick={() => setShowReservations(!showReservations)} className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl text-blue-600"><Ticket size={20} /></div><div className="font-bold text-blue-800 text-sm">已預約商家清單（限團員）</div></div>
            {showReservations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showReservations && (
            <div className="mt-3 bg-white rounded-3xl border border-blue-100 overflow-hidden">
              <div className="divide-y divide-stone-100">
                {reservations.map((res, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="font-bold text-stone-800 text-sm">{res.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${res.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{res.status === 'pending' ? '待訂' : '已訂'} · {res.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500"><Clock size={11} /> {res.time} ・ {res.note}</div>
                    {res.ticketUrl && (
                      <a href={res.ticketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full"><Ticket size={11} /> 開啟票券連結</a>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && <ReservationAdminSection reservations={reservations} saveList={saveReservations} />}
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-4">
        {guideSections.map((section, idx) => (
          <div key={idx} className={`p-5 rounded-[2rem] border ${section.color} shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white rounded-2xl shadow-sm">{section.icon}</div>
              <h3 className="text-lg font-bold text-stone-800">{section.title}</h3>
            </div>
            <p className="text-[11px] text-stone-500 mb-5">{section.desc}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => window.open(section.mapUrl, '_blank')} className="flex items-center justify-center gap-2 py-2.5 text-white rounded-2xl text-xs font-bold shadow-md active:scale-95" style={{ background: '#1B1F3B' }}><MapPin size={14} /> 開啟地圖</button>
              <button onClick={() => window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent('東京 ' + section.aiQuery)}`, '_blank')} className="flex items-center justify-center gap-2 py-2.5 border rounded-2xl text-xs font-bold shadow-sm active:scale-95 bg-white border-stone-200 text-stone-700"><Sparkles size={14} className="text-teal-500" /> 問問 AI</button>
            </div>
          </div>
        ))}
      </div>

      <section className="p-6 rounded-[2.5rem] border-2" style={{ background: '#FDF1DC', borderColor: '#F2C879' }}>
        <div className="flex items-center gap-2 mb-5 font-black text-sm tracking-wider" style={{ color: '#8A5A1E' }}><Sparkles size={16} /> 團員私藏好店許願池</div>
        <div className="space-y-4 mb-6">
          {sharedStores.length === 0 && <div className="text-xs text-stone-400 text-center py-4">目前還沒有人新增願望喔！</div>}
          {sharedStores.map((store, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border flex justify-between">
              <div>
                <div className="font-bold text-base">{store.name}</div>
                {store.note && <div className="text-xs text-stone-500">💬 {store.note}</div>}
                <div className="text-[10px] mt-1" style={{ color: '#C97A1E' }}>Added by {store.adder}</div>
              </div>
              {isAdmin && <button onClick={() => set(r('sharedStores'), sharedStores.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-400"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
        {(isAdmin || isMember) && (
          <div className="space-y-2">
            <select value={adderName} onChange={(e) => setAdderName(e.target.value)} className="w-full p-2 rounded-xl text-xs font-bold border border-amber-200 bg-white text-stone-800">
              {USERS.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <input value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} placeholder="店家名稱" className="w-full p-2 border rounded-xl text-sm bg-white placeholder:text-stone-400" />
            <input value={newStoreNote} onChange={(e) => setNewStoreNote(e.target.value)} placeholder="理由備註" className="w-full p-2 border rounded-xl text-sm bg-white placeholder:text-stone-400" />
            <button onClick={handleAddStore} className="w-full text-white font-bold py-2 rounded-xl text-sm" style={{ background: '#E2472A' }}>+</button>
          </div>
        )}
      </section>
    </div>
  );
};

// ============================================================
// 工具頁
// ============================================================
const UtilsPage = ({ isAdmin, isMember, systemInfo, updateSystemInfo }) => {
  const [showEsim, setShowEsim] = useState(false);
  const handleAppDownload = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) window.open('https://itunes.apple.com/eg/app/safety-tips/id858357174?mt=8', '_blank');
    else window.open('https://play.google.com/store/apps/details?id=jp.co.rcsc.safetyTips.android&hl=en', '_blank');
  };

  const appRow = (name, desc, iosUrl, androidUrl) => (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
      <div><div className="font-bold text-stone-800 text-sm">{name}</div><div className="text-[10px] text-stone-500">{desc}</div></div>
      <div className="flex gap-2">
        {iosUrl && <a href={iosUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-white px-2 py-1 rounded-lg" style={{ background: '#1B1F3B' }}>iOS</a>}
        {androidUrl && <a href={androidUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-white px-2 py-1 rounded-lg" style={{ background: '#1B1F3B' }}>Android</a>}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 pb-24 bg-[#FAF7F0] transition-colors">
      <h2 className="text-2xl tracking-tight" style={{ color: '#1B1F3B', fontFamily: "'Noto Serif TC', serif" }}>實用工具及資訊</h2>

      {isAdmin && (
        <section className="p-6 rounded-2xl text-white" style={{ background: '#1B1F3B' }}>
          <h3 className="flex items-center gap-2 font-bold mb-4 border-b border-white/20 pb-3" style={{ color: '#F2C879' }}><Settings size={18} /> 管理端設定</h3>
          <input type="text" value={systemInfo || ''} onChange={(e) => updateSystemInfo(e.target.value)} className="w-full bg-black/30 border border-white/20 rounded-xl px-3 py-2 text-sm text-emerald-200" />
        </section>
      )}

      {isMember && (
        <section className="p-6 rounded-2xl shadow-lg text-white relative overflow-hidden" style={{ background: '#06C755' }}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <h3 className="flex items-center gap-2 font-bold text-white mb-2 relative z-10"><Wallet size={18} /> 公款記帳與分帳</h3>
          <p className="text-green-50 text-sm mb-6 relative z-10 font-medium">所有公費支出請統一記錄在此，系統會自動結算每個人該付多少錢。</p>
          <a href="https://liff.line.me/1655320992-Y8GowEpw/g/bhuFPhrYzsnkAeC8YoTU8M" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white py-3.5 rounded-xl font-bold active:scale-95 transition-all relative z-10" style={{ color: '#06C755' }}>
            開啟 Lightsplit 分帳群組 <ArrowRight size={16} />
          </a>
        </section>
      )}

      <section className="bg-white p-6 rounded-2xl border border-stone-100">
        <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-4 border-b pb-3"><Plane size={18} className="text-blue-500" /> 航班詳細資訊</h3>
        {UTILS_DATA.flights.map((f, i) => <FlightCard key={i} {...f} />)}

        {isMember && (
          <a href={UTILS_DATA.driveUrl} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 mt-4 rounded-xl font-bold active:scale-95 transition-all"
            style={{ background: '#FBF3E4', color: '#1B1F3B' }}
          >
            <Info size={16} /> 開啟電子機票 / 各種憑證
          </a>
        )}



      </section>
      <section className="bg-white p-6 rounded-2xl border border-stone-100">
        <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-4 border-b pb-3"><Home size={18} className="text-orange-500" /> 住宿資訊</h3>
        {isMember ? (
          <div className="rounded-xl p-4 border relative" style={{ background: '#FBF3E4', borderColor: '#F2C879' }}>
            <div className="flex justify-between items-start mb-2">
              <div><span className="text-[10px] text-stone-400 font-bold">Airbnb</span><h4 className="font-bold text-base">{UTILS_DATA.accommodation.name}</h4></div>
              <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-stone-200 whitespace-nowrap">{UTILS_DATA.accommodation.dates}</span>
            </div>
            <p className="text-xs text-stone-500 mb-1"><MapPin size={10} className="inline mr-1" />{UTILS_DATA.accommodation.address}</p>
            <p className="text-xs text-stone-500 mb-3"><Train size={10} className="inline mr-1" />{UTILS_DATA.accommodation.station}</p>
            <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-rose-100 mb-4">
              <KeyRound size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-stone-600 font-medium">{UTILS_DATA.accommodation.keyNote}</p>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(UTILS_DATA.accommodation.mapQuery)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 text-white rounded-lg text-xs font-bold" style={{ background: '#1B1F3B' }}><Navigation size={14} /> 導航到住宿</a>
          </div>
        ) : (
          <div className="rounded-xl p-5 border border-stone-100 bg-stone-50 flex items-center gap-3">
            <Lock size={16} className="text-stone-300 flex-shrink-0" />
            <p className="text-xs text-stone-400 font-medium">住宿地址與鑰匙盒密碼僅團員可見。</p>
          </div>
        )}
      </section>

      {isMember && (
        <section className="bg-white p-6 rounded-2xl border border-stone-100 mb-6">
          <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-4 border-b pb-3"><Smartphone size={18} className="text-purple-500" /> 旅行必備 App</h3>
          <div className="space-y-3">
            <a href="https://studio--studio-9206745680-de144.us-central1.hosted.app" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 active:scale-95 transition-all">
              <div><div className="font-bold text-stone-800 text-sm">DIGEST 菜單翻譯</div><div className="text-[10px] text-stone-500">拍照即時翻譯日文菜單</div></div>
              <ArrowRight size={16} className="text-stone-400" />
            </a>
            {appRow('ロケスマ (ROKESUMA)', '專門用來在日本快速尋找各種連鎖店、超商、超市、咖啡廳、加油站及公共設施的地圖查詢工具。', 'https://apps.apple.com/tw/app/%E3%83%AD%E3%82%B1%E3%82%B9%E3%83%9E/id498923187', 'https://play.google.com/store/apps/details?id=jp.d_advantage.locasma&hl=zh_TW')}
            {appRow('東京地鐵JR巴士規劃軟體', '地鐵路線圖、轉乘搜尋、票價查詢', 'https://apps.apple.com/tw/app/japan-transit-planner-travel/id299490481', 'https://play.google.com/store/apps/details?id=jp.co.jorudan.nrkj')}
            <a href="https://static.japan.travel.navitime.com/web/walk/contents/html/boot/market.html?utm_source=safetytips&utm_medium=web&utm_campaign=safetytips" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 active:scale-95 transition-all">
              <div><div className="font-bold text-stone-800 text-sm">Japan Travel by Navitime</div><div className="text-[10px] text-stone-500">離線地圖・交通路線・景點導覽</div></div>
              <ArrowRight size={16} className="text-stone-400" />
            </a>
            {appRow('ecbo cloak 行李寄放', '找附近寄放行李的店家', 'https://apps.apple.com/tw/app/ecbo-cloak-%E6%97%A5%E6%9C%AC%E5%AF%84%E7%89%A9%E6%9C%8D%E5%8B%99/id1443707795', 'https://play.google.com/store/apps/details?id=io.ecbo.cloak&pcampaignid=web_share')}
            {appRow('tenki.jp', '日本氣象協會・最準確日本天氣預報', 'https://apps.apple.com/tw/app/tenki-jp-%E5%A4%A9%E6%B0%97%E4%BA%88%E5%A0%B1-%E9%9B%A8%E9%9B%B2%E3%83%AC%E3%83%BC%E3%83%80%E3%83%BC-%E5%9C%B0%E9%9C%87%E9%80%9F%E5%A0%B1/id433865746', 'https://play.google.com/store/apps/details?id=jwa.or.jp.tenkijp3&hl=zh_TW')}
            {appRow('樂桃航空 Peach', '航班查詢・報到・行李・訂位管理', 'https://apps.apple.com/jp/app/peach-aviation/id1032087975', 'https://play.google.com/store/apps/details?id=jp.co.peachaviation.app')}
            {appRow('VoiceTra', '日本 NICT 開發・31語言語音即時翻譯', 'https://apps.apple.com/tw/app/voicetra/id581137577', 'https://play.google.com/store/apps/details?id=jp.go.nict.voicetra')}
            {appRow('GO 日本計程車', '日本最大計程車叫車 App・支援信用卡', 'https://apps.apple.com/us/app/go-taxi-app-for-japan/id1254341709', 'https://play.google.com/store/apps/details?id=com.dena.automotive.taxibell')}
            {appRow('Tabelog 食べログ', '日本最大餐廳評分・在地口碑查詢', 'https://apps.apple.com/tw/app/tabelog-%E6%97%A5%E6%9C%AC%E9%A4%90%E5%BB%B3%E6%8E%A2%E7%B4%A2-%E8%A8%82%E4%BD%8D%E8%88%87%E8%A9%95%E5%83%B9%E5%85%A8%E6%96%B9%E4%BD%8D%E5%B9%B3%E5%8F%B0/id6752922875', 'https://play.google.com/store/apps/details?id=com.kakaku.tabelog.tourists&hl=zh_TW')}
            {appRow('Payke', '掃條碼查日本商品成分・免稅優惠券', 'https://apps.apple.com/tw/app/payke-%E4%BD%BF%E7%94%A8%E5%84%AA%E6%83%A0%E5%88%B8-%E8%AE%93%E6%97%A5%E6%9C%AC%E6%97%85%E8%A1%8C%E6%9B%B4%E5%88%92%E7%AE%97-%E7%BF%BB%E8%AD%AF-%E8%A9%95%E5%83%B9/id1040452788', 'https://play.google.com/store/apps/details?id=jp.co.payke.Payke1')}
            <a href="https://linshibi.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 active:scale-95 transition-all">
              <div><div className="font-bold text-stone-800 text-sm">林氏壁情報站</div><div className="text-[10px] text-stone-500">日本旅遊資訊・攻略・必買推薦懶人包</div></div>
              <ArrowRight size={16} className="text-stone-400" />
            </a>
          </div>







          
{/* 佑任短句本 */}
<a href="https://drive.google.com/file/d/1EPeIs8EED3Ul8bBv6hb0km7Lgfv7yY4l/view?usp=drive_link" target="_blank" rel="noreferrer"
  className="mt-3 flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 active:scale-95 transition-all"
>
  <div>
    <div className="font-bold text-stone-800 dark:text-stone-100 text-sm">佑任の日語突發即用短句本</div>
    <div className="text-[10px] text-amber-600 dark:text-amber-400">點我開啟 Google Drive 📖</div>
  </div>
  <ArrowRight size={16} className="text-amber-400" />
</a>

  
{/* eSIM 防爆流量區塊 */}
  <section className="mt-3 bg-white dark:bg-stone-800 p-6 rounded-2xl border border-stone-100 dark:border-stone-700 mb-6">

    
  <button
    onClick={() => setShowEsim(!showEsim)}
    className="w-full flex items-center justify-between"
  >
    <h3 className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-100">
      <Signal size={18} className="text-blue-500" /> eSIM 出國防爆流量指南
    </h3>
    {showEsim ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
  </button>

  {showEsim && (
    <div className="mt-4 animate-fadeIn">

   

    <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
        <AlertTriangle size={12} /> Whoscall 用戶注意
      </p>
      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
        開著 Whoscall 在國外使用 eSIM，後台「自動網站檢查」功能會持續消耗流量，可能吃掉 5-10GB。出發前請關閉此app的行動數據，並確認沒開VPN。
      </p>
    </div>

    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold bg-stone-800 text-amber-50 px-3 py-1 rounded-full font-mono tracking-wider">iOS</span>
          <span className="text-xs text-stone-400 font-bold">大容量怪獸設定清單</span>
        </div>
        <img
          src={process.env.PUBLIC_URL + '/images/esim_ios.jpg'}
          alt="iOS eSIM 防爆流量設定"
          className="w-full rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold bg-stone-800 text-amber-50 px-3 py-1 rounded-full font-mono tracking-wider">Android</span>
          <span className="text-xs text-stone-400 font-bold">大容量怪獸設定清單</span>
        </div>
        <img
          src={process.env.PUBLIC_URL + '/images/esim_android.jpg'}
          alt="Android eSIM 防爆流量設定"
          className="w-full rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm"
        />
      </div>
    </div>


     </div>
  )}
        </section>
        </section>
      )}

      <section className="bg-white p-6 rounded-2xl border border-stone-100 mb-6">
        <h3 className="flex items-center gap-2 font-bold text-red-700 mb-4 border-b pb-3"><AlertCircle size={18} className="text-red-600" /> 緊急救援中心</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <a href="tel:110" className="bg-red-50 p-3 rounded-xl flex flex-col items-center border border-red-100"><span className="text-2xl font-black text-red-600">110</span><span className="text-xs font-bold text-red-800">警察報案</span></a>
            <a href="tel:119" className="bg-red-50 p-3 rounded-xl flex flex-col items-center border border-red-100"><span className="text-2xl font-black text-red-600">119</span><span className="text-xs font-bold text-red-800">救護車／火災</span></a>
          </div>
          <div className="rounded-xl p-4 text-stone-300 text-sm space-y-4" style={{ background: '#1B1F3B' }}>
            <div onClick={handleAppDownload} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3 cursor-pointer active:scale-95 transition-all group">
              <div className="p-2 bg-amber-500 rounded-full text-stone-900 flex-shrink-0"><Smartphone size={16} strokeWidth={2.5} /></div>
              <div className="flex-1">
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">必備救命工具</div>
                <div className="text-xs font-bold text-stone-100">下載 Japan Safety Tips</div>
                <div className="text-[9px] text-stone-400 mt-0.5">地震海嘯警報・多國語言緊急通知</div>
              </div>
              <ArrowRight size={14} className="text-stone-600 group-hover:text-amber-500" />
            </div>
            <div className="space-y-3">
              <div className="border-b border-white/10 pb-2">
                <div className="font-bold text-white text-xs mb-1">🇹🇼 {UTILS_DATA.emergency.office}</div>
                <div className="text-[10px] text-stone-400">{UTILS_DATA.emergency.address}</div>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>辦公室電話</span><a href={`tel:${UTILS_DATA.emergency.officeTel}`} className="text-stone-300 font-bold">{UTILS_DATA.emergency.officeTel}</a></div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>急難救助手機①</span><a href={`tel:${UTILS_DATA.emergency.emergencyMobile1}`} className="font-bold" style={{ color: '#F2C879' }}>{UTILS_DATA.emergency.emergencyMobile1}</a></div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>急難救助手機②</span><a href={`tel:${UTILS_DATA.emergency.emergencyMobile2}`} className="font-bold" style={{ color: '#F2C879' }}>{UTILS_DATA.emergency.emergencyMobile2}</a></div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>全球免付費急難救助</span><a href={`tel:${UTILS_DATA.emergency.globalFree}`} className="text-stone-300 text-xs">{UTILS_DATA.emergency.globalFree}</a></div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>👮 當地報案 (Police)</span><a href="tel:110" className="text-white font-bold">110</a></div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>🚑 救護車／火災</span><a href="tel:119" className="text-white font-bold">119</a></div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>💳 Visa 全球掛失</span><a href="tel:00531110001" className="text-stone-400 text-xs">0053-111-0001</a></div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2"><span>💳 JCB 掛失</span><a href="tel:00531110011" className="text-stone-400 text-xs">0053-111-0011</a></div>
              <div className="flex justify-between items-center pt-1"><span>💳 Mastercard 掛失</span><a href="tel:00531110086" className="text-stone-400 text-xs">0053-111-0086</a></div>
            </div>
          </div>
          <p className="text-[10px] text-stone-400 leading-relaxed px-1">※ 電話號碼已於系統建立時查證，出發前仍建議上「台北駐日經濟文化代表處」官網 roc-taiwan.org/jp 再次確認最新資訊。</p>
        </div>
      </section>

      <CurrencySection />
    </div>
  );
};

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 300);
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  return isVisible ? (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-24 right-4 z-40 p-3 backdrop-blur text-white rounded-full border" style={{ background: 'rgba(27,31,59,0.85)', borderColor: '#F2C879' }}>
      <ArrowRight size={20} className="-rotate-90" strokeWidth={3} />
    </button>
  ) : null;
};

// ============================================================
// 主程式
// ============================================================
export default function TravelApp() {
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('tokyo2026_unlocked') !== 'true');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [inputPwd, setInputPwd] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [appVersion, setAppVersion] = useState('V1 自由行版');
  const [systemInfo, setSystemInfo] = useState('System Ver. 1.0 東京自由行 🗼');
  const [noticeText, setNoticeText] = useState('載入中...');

  useEffect(() => {
    const savedRole = localStorage.getItem('tokyo2026_role');
    if (savedRole === '3b82b420366fa66a414d72aa05de7414336e87d8f1fca9c5ecee85b090a64209') { setIsAdmin(true); setIsMember(true); }
    else if (savedRole === 'be41b7f1fa56ba2b0582910053c86cf6ee7e311efc51300220df0918bb9a287b') { setIsAdmin(false); setIsMember(true); }
  }, []);

  useEffect(() => {
    goOnline(db);
    setTimeout(() => setIsLoadingData(false), 600);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') { goOffline(db); setTimeout(() => goOnline(db), 300); }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    onValue(r('appVersion'), (snap) => { if (snap.val()) setAppVersion(snap.val()); });
    onValue(r('systemInfo'), (snap) => { if (snap.val()) setSystemInfo(snap.val()); });
    onValue(r('noticeBoard'), (snap) => { if (snap.val() !== null) setNoticeText(snap.val()); else setNoticeText('📌 點擊編輯公佈欄，記錄重要資訊'); });
  }, []);

  const handleUpdateNotice = (newText) => { setNoticeText(newText); set(r('noticeBoard'), newText); };
  const updateSystemInfo = (newText) => { setSystemInfo(newText); set(r('systemInfo'), newText); };

  const hashPassword = async (pwd) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleUnlock = async () => {
    const hash = await hashPassword(inputPwd);
    const ADMIN_HASH = '3b82b420366fa66a414d72aa05de7414336e87d8f1fca9c5ecee85b090a64209';
    const MEMBER_HASH = 'be41b7f1fa56ba2b0582910053c86cf6ee7e311efc51300220df0918bb9a287b';
    const GUEST_HASH = '2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731';
    if (hash === ADMIN_HASH) { localStorage.setItem('tokyo2026_unlocked', 'true'); localStorage.setItem('tokyo2026_role', ADMIN_HASH); setIsAdmin(true); setIsMember(true); setIsUnlocking(true); setTimeout(() => setIsLocked(false), 900); }
    else if (hash === MEMBER_HASH) { localStorage.setItem('tokyo2026_unlocked', 'true'); localStorage.setItem('tokyo2026_role', MEMBER_HASH); setIsAdmin(false); setIsMember(true); setIsUnlocking(true); setTimeout(() => setIsLocked(false), 900); }
    else if (hash === GUEST_HASH) { localStorage.setItem('tokyo2026_unlocked', 'true'); localStorage.setItem('tokyo2026_role', GUEST_HASH); setIsAdmin(false); setIsMember(false); setIsUnlocking(true); setTimeout(() => setIsLocked(false), 900); }
    else { alert('密碼錯誤！🔒'); setInputPwd(''); }
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
        * { font-family: 'Noto Sans TC', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
        body, #root { background-color: #FAF7F0; }
        @media print {
          #main-app-container { display: none !important; }
          #print-zone { display: block !important; background: white !important; }
        }
      `}</style>

      <div className="min-h-screen font-sans text-stone-800 max-w-md mx-auto relative overflow-hidden bg-[#FAF7F0]">
        <div className="fixed inset-0 z-[9999] bg-stone-900 text-white flex-col items-center justify-center hidden landscape:flex"><Phone size={48} className="animate-pulse mb-4" /><p className="text-lg font-bold">請將手機轉為直向</p></div>

        {isLocked && (
          <div className="fixed inset-0 z-[100] flex justify-center h-screen w-full" style={{ background: '#0B0E2A' }}>
            <div className="relative w-full max-w-md h-full flex flex-col items-center overflow-hidden">
               
               
               
               {/* <TokyoNightArt /> */}
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${process.env.PUBLIC_URL}/images/jungle2.jpeg)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 70%',
                }}
              >
                <div className="absolute inset-0 bg-black/30"></div>
              </div>












              <div className="relative z-10 flex flex-col items-center w-full px-8 h-full pt-32">
                
                
                
                <div
                  className="mb-4"
                  style={{
                    marginLeft: '-36px',
                    transition: isUnlocking ? 'transform 1.0s cubic-bezier(0.4,0,1,1), opacity 1.0s ease' : 'none',
                    transform: isUnlocking ? 'translateX(130vw) translateY(-12px) rotate(6deg)' : 'translateX(0) translateY(0) rotate(0deg)',
                    opacity: isUnlocking ? 0 : 1,
                  }}
                >
                  <div style={{ transform: 'rotate(32deg)', filter: 'drop-shadow(0 0 10px rgba(242,200,121,0.45))' }}>
                    <Plane size={56} className="text-white" strokeWidth={1.5} />
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-1 text-white tracking-tight" style={{ fontFamily: "'Noto Serif TC', serif" }}>東京 Tokyo 2026</h2>
                <p className="text-sm mb-2 text-center tracking-widest font-bold" style={{ color: '#F2A18E' }}>佑任・睏寶・學弟・腳慢</p>
                <p className="text-[10px] uppercase font-bold text-center mb-6" style={{ color: 'rgba(242,200,121,0.6)' }}>{systemInfo}</p>
                <button onClick={() => window.location.reload()} className="absolute top-12 right-6 p-2 rounded-full bg-white/10 text-white/50"><RefreshCw size={20} /></button>

                <form className="w-full relative" style={{ marginTop: 'auto', marginBottom: 'calc(15vh + env(safe-area-inset-bottom))' }} onSubmit={(e) => { e.preventDefault(); handleUnlock(); }}>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-4 top-4 text-white/70" />
                    <input type="password" value={inputPwd} onChange={(e) => setInputPwd(e.target.value)} placeholder="Passcode" className="w-full rounded-2xl pl-12 pr-12 py-3.5 text-lg text-white text-center font-bold outline-none" style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.6)', letterSpacing: '0.2em' }} />
                  </div>
                  <button type="submit" className="w-full mt-4 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all" style={{ background: '#E2472A', border: '1.5px solid rgba(255,255,255,0.4)', boxShadow: '3px 3px 0 rgba(0,0,0,0.2)', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '13px' }}>
                    Start Journey <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {!isLocked && (
          <>
            {isLoadingData ? (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF7F0]">
                <Loader2 size={48} className="animate-spin mb-4" style={{ color: '#E2472A' }} />
                <p className="text-stone-500 text-sm font-bold tracking-widest animate-pulse">正在同步雲端行程...</p>
              </div>
            ) : (
              <div id="main-app-container" className="bg-[#FAF7F0] min-h-screen">
                <WeatherHero isAdmin={isAdmin} onLock={() => { setIsLocked(true); setIsUnlocking(false); setInputPwd(''); setIsAdmin(false); setIsMember(false); localStorage.removeItem('tokyo2026_unlocked'); localStorage.removeItem('tokyo2026_role'); }} />
                <main className="pb-28">
                  {activeTab === 'itinerary' && (
                    <div className="pb-4">
                      <OutfitGuide />
                      <FreeItinerary isAdmin={isAdmin} isMember={isMember} />
                      <div className="text-center text-xs text-stone-400 mt-4 mb-4 italic" style={{ fontFamily: "'Noto Serif TC', serif" }}>— Journey to Tokyo —</div>
                      <div className="flex justify-center mb-8">
                        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-[10px] font-bold text-stone-400 shadow-sm bg-white"><FileText size={10} /> 匯出 PDF</button>
                      </div>
                    </div>
                  )}
                  {activeTab === 'packing' && <PackingPage isAdmin={isAdmin} isMember={isMember} />}
                  {activeTab === 'guide' && <GuidePage isAdmin={isAdmin} isMember={isMember} noticeText={noticeText} updateNoticeText={handleUpdateNotice} />}
                  {activeTab === 'utils' && <UtilsPage isAdmin={isAdmin} isMember={isMember} systemInfo={systemInfo} updateSystemInfo={updateSystemInfo} />}
                </main>
                <BackToTop />

                <nav className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-lg border-t flex justify-around py-3 pb-4 z-40 select-none" style={{ borderColor: '#EFE9DA' }}>
                  <button onClick={() => setActiveTab('itinerary')} className="flex flex-col items-center gap-1.5" style={{ color: activeTab === 'itinerary' ? '#1B1F3B' : '#B8AF9C' }}><MapPin size={20} /><span className="text-[10px] font-bold">行程</span></button>
                  <button onClick={() => setActiveTab('packing')} className="flex flex-col items-center gap-1.5" style={{ color: activeTab === 'packing' ? '#1B1F3B' : '#B8AF9C' }}><CheckCircle size={20} /><span className="text-[10px] font-bold">準備</span></button>
                  <button onClick={() => setActiveTab('guide')} className="flex flex-col items-center gap-1.5" style={{ color: activeTab === 'guide' ? '#1B1F3B' : '#B8AF9C' }}><Compass size={20} /><span className="text-[10px] font-bold">指南</span></button>
                  <button onClick={() => setActiveTab('utils')} className="flex flex-col items-center gap-1.5" style={{ color: activeTab === 'utils' ? '#1B1F3B' : '#B8AF9C' }}><Wallet size={20} /><span className="text-[10px] font-bold">工具</span></button>
                </nav>
              </div>
            )}

            <div id="print-zone" className="hidden print:block bg-white text-stone-900 p-10">
              <h1 className="text-3xl font-bold border-b-2 pb-4 mb-8 text-center" style={{ borderColor: '#E2472A', fontFamily: "'Noto Serif TC', serif" }}>TOKYO FREE TRIP 2026<br /><span className="text-sm text-stone-400 font-sans tracking-widest uppercase">佑任・睏寶・學弟・腳慢</span></h1>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{DEFAULT_ITINERARY_TEXT}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
