const express = require("express");
const https   = require("https");
const zlib    = require("zlib");
const fs      = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const router = express.Router();

/* ================= TELEGRAM ================= */
const BOT_TOKEN = "8761350036:AAFE114oD9tMgcU90-1U1ht__awlykj4GzU";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const MONITOR_IDS = ["8382316368", "-1003414638512"];
const sentCache = new Set();

/* ================= CONFIG ================= */
const BASE_URL  = "https://www.ivasms.com";

let COOKIES = {
"XSRF-TOKEN": "eyJpdiI6IjNIQmRtNzRjc3pnSmJwNmN5UUVLUXc9PSIsInZhbHVlIjoiVk5nd1d0cHFiRzBWem5tOVk2TUVtWXp0ZnYvL1F3MTY0VDMrRzVyUE5XaHdod254eUxWOGhSWGNMdjhpSXE4U1FmZ3lkbDExOEdCbUFFaDRPMHRERmZlMXZUTUN0emZzL0wvSFN2ZURVeTFzblkyOG5HWldQZGM4dXU5ck5nZ0ciLCJtYWMiOiIzN2FjOWY3ODFkYmQ0YmI2MGU3YWI1ZDY3NzA4NWFjNzEwNjlkZjQzNTYxZjNiZjA1NDc4YTZkYTRlNmJkMDUyIiwidGFnIjoiIn0%3D",
"ivas_sms_session": "eyJpdiI6IjJORXNUM2ZjaUFBV0R3SHdsSUhmRkE9PSIsInZhbHVlIjoidnQ1VVAzZ2VpNUxodlJpeUpaWnlkS1RRM05WVnI2cG1lR3pOcEJIZ1RUNU9TQlA2dEJobkVmNDVXaXhIdkhTR28vM2lDb3dZckZQZnJqMjVXbC9wTUxJMTRYTDI4Z29XUWxHckVKd1JySEt2ZU1vTHJGUmxXYm44b3REa0RBeTEiLCJtYWMiOiI4ODY5YTY2Y2EwM2RiZTRmZmY4ZjYzZWM2YTZmYmIzMjNiOTA0NDQ4MzkwNWY1ZDBiYmY2ZDk2YTU1M2QwNDM4IiwidGFnIjoiIn0%3D",
"cf_clearance":
"a0NVFCmvAeBlrHSz5FCF.G3uYxPdLJB.kCJcVC3Z2zs-1778432726-1.2.1.1-HVC3eyRbJrcC89lxOp26EP.9PKBUfhqHLxR76KkSFjVymM3YYzAFzsmOkudhCrz1.4X5FodXD3SE4G1wuPVloVnyOJSMfwHXOgx8cmOdHkTir8C8GI1E42Mj6AmahiuEyIizIHT8kQtfuVd8vC8GBKKJjRuYsDgOGaIkEbUGO58hqwStiamsBF3V7wxSyljXV0JyvKPwaEp8ZaE_BkJ6UwfrVDwNou5N1FrXzry5kgNBt_V5I6oeZf8HtsH6BZZsCOIemm9eK5ph62ZmKkIRMHOdnnVNkf1zJ3sHAgtmJ0K8pYlk1IOISwCUM6LOk5xuYB3bnT1EmuHHpFKsntREXg",
};

let cachedToken = null;
let tokenExpiry = 0;

/* ================= COMPLETE COUNTRY FLAGS LIST ================= */
const COUNTRY_FLAGS = {
  afghanistan:"🇦🇫", albania:"🇦🇱", algeria:"🇩🇿", angola:"🇦🇴", argentina:"🇦🇷", armenia:"🇦🇲", australia:"🇦🇺", 
  austria:"🇦🇹", azerbaijan:"🇦🇿", bahrain:"🇧🇭", bangladesh:"🇧🇩", belarus:"🇧🇾", belgium:"🇧🇪", benin:"🇧🇯", 
  bolivia:"🇧🇴", bosnia:"🇧🇦", botswana:"🇧🇼", brazil:"🇧🇷", brunei:"🇧🇳", bulgaria:"🇧🇬", burkina:"🇧🇫", 
  burundi:"🇧🇮", cambodia:"🇰🇭", cameroon:"🇨🇲", canada:"🇨🇦", chad:"🇹🇩", chile:"🇨🇱", china:"🇨🇳", 
  colombia:"🇨🇴", congo:"🇨🇬", costa_rica:"🇨🇷", croatia:"🇭🇷", cuba:"🇨🇺", cyprus:"🇨🇾", czech:"🇨🇿", 
  denmark:"🇩🇰", djibouti:"🇩🇯", dominican:"🇩🇴", ecuador:"🇪🇨", egypt:"🇪🇬", el_salvador:"🇸🇻", 
  estonia:"🇪🇪", ethiopia:"🇪🇹", finland:"🇫🇮", france:"🇫🇷", gabon:"🇬🇦", gambia:"🇬🇲", georgia:"🇬🇪", 
  germany:"🇩🇪", ghana:"🇬🇭", greece:"🇬🇷", guatemala:"🇬🇹", guinea:"🇬🇳", haiti:"🇭🇹", honduras:"🇭🇳", 
  hong_kong:"🇭🇰", hungary:"🇭🇺", iceland:"🇮🇸", india:"🇮🇳", indonesia:"🇮🇩", iran:"🇮🇷", iraq:"🇮🇶", 
  ireland:"🇮🇪", israel:"🇮🇱", italy:"🇮🇹", jamaica:"🇯🇲", japan:"🇯🇵", jordan:"🇯🇴", kazakhstan:"🇰🇿", 
  kenya:"🇰🇪", kuwait:"🇰🇼", kyrgyzstan:"🇰🇬", laos:"🇱🇦", latvia:"🇱🇻", lebanon:"🇱🇧", libya:"🇱🇾", 
  lithuania:"🇱🇹", luxembourg:"🇱🇺", madagascar:"🇲🇬", malawi:"🇲🇼", malaysia:"🇲🇾", maldives:"🇲🇻", 
  mali:"🇲🇱", malta:"🇲🇹", mauritania:"🇲🇷", mauritius:"🇲🇺", mexico:"🇲🇽", moldova:"🇲🇩", mongolia:"🇲🇳", 
  montenegro:"🇲🇪", morocco:"🇲🇦", mozambique:"🇲🇿", myanmar:"🇲🇲", namibia:"🇳🇦", nepal:"🇳🇵", 
  netherlands:"🇳🇱", new_zealand:"🇳🇿", nicaragua:"🇳🇮", niger:"🇳🇪", nigeria:"🇳🇬", north_korea:"🇰🇵", 
  norway:"🇳🇴", oman:"🇴🇲", pakistan:"🇵🇰", palestine:"🇵🇸", panama:"🇵🇦", paraguay:"🇵🇾", peru:"🇵🇪", 
  philippines:"🇵🇭", poland:"🇵🇱", portugal:"🇵🇹", qatar:"🇶🇦", romania:"🇷🇴", russia:"🇷🇺", rwanda:"🇷🇼", 
  saudi:"🇸🇦", senegal:"🇸🇳", serbia:"🇷🇸", sierra_leone:"🇸🇱", singapore:"🇸🇬", slovakia:"🇸🇰", 
  slovenia:"🇸🇮", somalia:"🇸🇴", south_africa:"🇿🇦", south_korea:"🇰🇷", spain:"🇪🇸", sri_lanka:"🇱🇰", 
  sudan:"🇸🇩", sweden:"🇸🇪", switzerland:"🇨🇭", syria:"🇸🇾", taiwan:"🇹🇼", tajikistan:"🇹🇯", 
  tanzania:"🇹🇿", thailand:"🇹🇭", togo:"🇹🇬", trinidad:"🇹🇹", tunisia:"🇹🇳", turkey:"🇹🇷", 
  turkmenistan:"🇹🇲", uganda:"🇺🇬", ukraine:"🇺🇦", uae:"🇦🇪", united_kingdom:"🇬🇧", uk:"🇬🇧", 
  usa:"🇺🇸", united_states:"🇺🇸", uruguay:"🇺🇾", uzbekistan:"🇺🇿", venezuela:"🇻🇪", vietnam:"🇻🇳", 
  yemen:"🇾🇪", zambia:"🇿🇲", zimbabwe:"🇿🇼"
};

function getFlag(country) {
  const c = (country || "").toLowerCase().trim();
  for (const [k, v] of Object.entries(COUNTRY_FLAGS)) {
    if (c.includes(k.replace("_", " "))) return v;
  }
  return "🌍";
}

/* ================= EXTRACTION HELPERS ================= */
function extractOTP(text) {
  let m = text.match(/\b(\d{3}[-\s]\d{3})\b/) || text.match(/\bG-(\d{4,8})\b/) || text.match(/(?:code|otp|pin|verif|confirm|passcode|token)[^0-9]{0,20}(\d{4,8})/i) || text.match(/[:=]\s*(\d{4,8})\b/);
  if (m) return m[1] || m[0];
  const nums = [...text.matchAll(/\b(\d{4,8})\b/g)].map(x => x[1]);
  for (const n of nums) { if (!/^(19|20)\d{2}$/.test(n)) return n; }
  return "NO OTP";
}

function maskNumber(n) {
  n = String(n).replace(/\D/g, "");
  return n.length >= 8 ? n.slice(0,3) + "****" + n.slice(-3) : n;
}

function detectService(text) {
  const keywords = ["whatsapp","telegram","facebook","instagram","google","microsoft","apple","paypal","binance","uber","amazon","netflix","tiktok","twitter","snapchat","bybit","okx","kucoin","discord","linkedin","signal","viber","wechat","yahoo","gmail","coinbase","crypto"];
  const t = text.toLowerCase();
  for (const k of keywords) { if (t.includes(k)) return k.toUpperCase(); }
  return "UNKNOWN";
}

/* ================= SYSTEM CORE ================= */
function getToday() { return new Date().toISOString().slice(0,10); }
function cookieString() { return Object.entries(COOKIES).map(([k,v])=>`${k}=${v}`).join("; "); }
function getXsrf() { try { return decodeURIComponent(COOKIES["XSRF-TOKEN"]); } catch { return COOKIES["XSRF-TOKEN"]; } }
function safeJSON(t){ try{return JSON.parse(t);}catch{return null;} }

function makeRequest(method,path,body,contentType,extraHeaders={}) {
  return new Promise((resolve,reject)=>{
    const headers={
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept":"application/json, text/javascript, */*; q=0.01",
      "Accept-Encoding":"gzip, deflate, br",
      "Cookie":cookieString(),
      "X-CSRF-TOKEN":getXsrf(),
      "X-Requested-With":"XMLHttpRequest",
      "Origin":BASE_URL,
      "Referer":`${BASE_URL}/portal`,
      ...extraHeaders
    };
    if(method==="POST" && body){ headers["Content-Type"]=contentType; headers["Content-Length"]=Buffer.byteLength(body); }
    const req=https.request(BASE_URL+path,{method,headers},res=>{  
      let chunks=[];
      if(res.headers["set-cookie"]){ res.headers["set-cookie"].forEach(c=>{ const [pair]=c.split(";"); const [k,v]=pair.split("="); COOKIES[k]=v; }); }
      res.on("data",d=>chunks.push(d));
      res.on("end",()=>{  
        let buf=Buffer.concat(chunks);
        try{ if(res.headers["content-encoding"]==="gzip") buf=zlib.gunzipSync(buf); if(res.headers["content-encoding"]==="br") buf=zlib.brotliDecompressSync(buf); }catch{}
        resolve({status:res.statusCode,body:buf.toString("utf-8")});
      });
    });
    req.on("error",reject);
    if(body) req.write(body);
    req.end();
  });
}

async function fetchToken(){
  if(cachedToken && Date.now()<tokenExpiry) return cachedToken;
  const r=await makeRequest("GET","/portal");
  const m=r.body.match(/name="_token"\s+value="([^"]+)"/);
  cachedToken=m?m[1]:null;
  tokenExpiry=Date.now()+300000;
  return cachedToken;
}

function parseSMS(html,range,number,date){
  const rows=[];
  const clean=t=>(t||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
  const senders=[...html.matchAll(/cli-tag[^>]*>([^<]+)/g)].map(m=>clean(m[1]));
  const msgs=[...html.matchAll(/msg-text[^>]*>([\s\S]*?)<\/div>/g)].map(m=>clean(m[1]));
  const times=[...html.matchAll(/time-cell[^>]*>([\s\S]*?)<\/span>/g)].map(m=>clean(m[1]));
  msgs.forEach((msg,i)=>{ if(!msg) return; rows.push({ time: `${date} ${times[i]||"00:00"}`, range, number, sender: senders[i]||"SMS", message: msg }); });
  return rows;
}

async function getSMS(token,date){
  const r1=await makeRequest("POST","/portal/sms/received/getsms", `_token=${token}&from=${date}&to=${date}`, "application/x-www-form-urlencoded");
  const ranges = [...new Set([...r1.body.matchAll(/toggleRange\('([^']+)'/g)].map(m=>m[1]))];
  const out=[];
  for(const range of ranges){
    const r2=await makeRequest("POST","/portal/sms/received/getsms/number", `_token=${token}&range=${range}&start=${date}`, "application/x-www-form-urlencoded");
    const nums = [...new Set([...r2.body.matchAll(/toggleNum\w*\('([^']+)'/g)].map(m=>m[1].split('_')[0]))];
    for(const n of nums){
      const r3=await makeRequest("POST","/portal/sms/received/getsms/number/sms", `_token=${token}&Number=${n}&Range=${range}&start=${date}&end=${date}`, "application/x-www-form-urlencoded");
      out.push(...parseSMS(r3.body, range, n, date));
    }
  }
  return out;
}

/* ================= MONITOR LOOP ================= */
async function monitorLoop(){
  while(true){
    try{
      const t=await fetchToken(); if(!t) { await new Promise(r=>setTimeout(r,2000)); continue; }
      const data=await getSMS(t,getToday());  
      for(const r of data){  
        const key=Buffer.from(r.number + r.message).toString('base64');  
        if(!sentCache.has(key)){  
          sentCache.add(key);  
          const otp=extractOTP(r.message);
          const service=detectService(r.sender + " " + r.message);
          const flag=getFlag(r.range);
          const masked=maskNumber(r.number);
          const iso=r.range.replace(/[^A-Z]/g, "").slice(0, 2) || "SMS";

          const text = `<b>┊°°°✅ 𝐎𝐓𝐏 𝐑𝐄𝐂𝐄𝐈𝐕𝐄𝐃 ✅°°°┊</b>\n<blockquote>${flag} <b>#${iso}</b>  <code>+${masked}</code>\n🟢 <b>#CLI</b>  ${service}</blockquote>`;
          const markup = { inline_keyboard: [[{ text: `🔑  ${otp}  🔑`, copy_text: { text: otp } }],[{ text: "📞 NUMBERS", url: "https://t.me/ZeroTraceNums" }, { text: "🔰 BACKUP", url: "https://t.me/ZeroTraceNums1" }]] };
          for(const id of MONITOR_IDS) bot.sendMessage(id, text, { parse_mode: "HTML", reply_markup: markup });
        }  
      }  
      if(sentCache.size>5000) sentCache.clear();  
      await new Promise(r=>setTimeout(r,1500));  
    }catch(e){ await new Promise(r=>setTimeout(r,2000)); }
  }
}

/* ================= BOT COMMANDS (ANALYSIS UPDATED) ================= */
bot.onText(/\/start/,msg=>{ bot.sendMessage(msg.chat.id, "🚀 *IVAS TURBO ACTIVE*\n\n📊 /analysis\n➕ /add ID\n📂 /fetch\n🗑️ /delete_all\n📅 /date YYYY-MM-DD", { parse_mode: "Markdown" }); });

bot.onText(/\/analysis/, async (msg) => {
    const ts=Date.now();
    const r=await makeRequest("GET", `/portal/sms/test/sms?app=WhatsApp&draw=1&columns[0][data]=range&columns[1][data]=termination.test_number&start=0&length=100&_=${ts}`);
    const json=safeJSON(r.body);
    if (!json?.data?.length) return bot.sendMessage(msg.chat.id, "❌ No data found.");
    
    const stats = {};
    json.data.forEach(item => {
        if (!stats[item.range]) stats[item.range] = { hits: 0, id: item.termination_id || "N/A" };
        stats[item.range].hits += 1;
    });

    const sorted = Object.entries(stats).sort((a,b)=>b[1].hits - a[1].hits);
    const best = sorted[0];

    bot.sendMessage(msg.chat.id, `🔥 *WINNING RANGE FOUND* 🔥\n\n🛰️ *Range:* \`${best[0]}\`\n📈 *Hits:* \`${best[1].hits}\`\n🆔 *ID:* \`${best[1].id}\`\n\n_Use /add ${best[1].id} to start!_`, { parse_mode: "Markdown" });
});

bot.onText(/\/date (.+)/, async (msg, match) => {
    const date=match[1]; const t=await fetchToken();
    try { const data=await getSMS(t, date); for(const r of data.slice(0,10)){ bot.sendMessage(msg.chat.id, `📱 ${r.number}\n💬 ${r.message}`); } } 
    catch(e){ bot.sendMessage(msg.chat.id, "❌ Error"); }
});

bot.onText(/\/fetch/,async msg=>{
  const t=await fetchToken();
  const r=await makeRequest("GET", `/portal/numbers?draw=1&columns[1][data]=Number&start=0&length=5000`);
  const j=safeJSON(r.body); if(!j?.data) return;
  const file="numbers.txt"; fs.writeFileSync(file, j.data.map(x=>x.Number).join("\n"));
  await bot.sendDocument(msg.chat.id,file); fs.unlinkSync(file);
});

bot.onText(/\/delete_all/,async msg=>{
  const t=await fetchToken();
  const r=await makeRequest("POST", "/portal/numbers/return/allnumber/bluck", `_token=${t}`, "application/x-www-form-urlencoded");
  bot.sendMessage(msg.chat.id, safeJSON(r.body)?.message||"Done");
});

bot.onText(/\/add (.+)/,async (msg,match)=>{
  const t=await fetchToken();
  await makeRequest("POST", "/portal/numbers/termination/number/add", `_token=${t}&id=${match[1]}`, "application/x-www-form-urlencoded");
  bot.sendMessage(msg.chat.id,`📥 Range ID ${match[1]} Added!`);
});

monitorLoop();
module.exports=router;