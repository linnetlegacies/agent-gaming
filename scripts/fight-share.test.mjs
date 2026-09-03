import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

function fail(msg){ throw new Error(msg); }
function must(re, label){ if(!re.test(html)) fail("missing "+label); }
function mustNot(re, label){ if(re.test(html)) fail("forbidden "+label); }

must(/function fightShareLine\(opt\)\{/, "fightShareLine");
must(/function fightShareClip\(line, url\)\{/, "fightShareClip");
must(/function liveShareLine\(\)\{/, "liveShareLine");
must(/score:scoreNow\(\)/, "share score is live");
must(/jersey:fightJersey/, "share jersey is live");
must(/fightJersey=name\|\|"FreedomOS"/, "plate sets jersey");
must(/fightJersey="";/, "ghost clears jersey");
must(/title:line/, "share title is desk line");
must(/text:line/, "share text is desk line");
must(/url:LIVE_URL/, "share url stays LIVE_URL");
must(/Copied\. "\+line/, "toast confirms fight line");
must(/writeText\(clip\)/, "clipboard writes fight pack");
must(/ta\.value=clip/, "fallback copies fight pack");
must(/LIVE_URL="https:\/\/agentgaming\.app"/, "LIVE_URL");
must(/AG_FIGHT_SPONSOR=\{name:"FreedomOS"/, "FreedomOS jersey");
must(/PAY_LINK="https:\/\/buy\.stripe\.com\/aFa8wR6becIZ3ZF8QM2Fa00"/, "Payment Link unchanged");
must(/House spent stays \$0\.00/, "house $0.00 stays");

mustNot(/payload=\{title:"Arena One — Agent Gaming"/, "no stale share title");
mustNot(/text:"Watch the match\. Take a seat\."/, "no mute share text");
mustNot(/writeText\(LIVE_URL\)/, "clipboard is not a bare URL");
mustNot(/ta\.value=LIVE_URL/, "fallback is not a bare URL");
mustNot(/Link copied\. Send it\./, "no mute copy toast");
mustNot(/prize pool/i, "no prize pool");
mustNot(/jackpot/i, "no jackpot");
mustNot(/gambling/i, "no gambling");
mustNot(/wager/i, "no wager");
mustNot(/\bTim\b/, "no Tim");
mustNot(/faith/i, "no faith");
mustNot(/viewers? \d/, "no fake viewer count");

function extractFn(name){
  const start=html.indexOf("function "+name+"(");
  if(start<0) fail("extract "+name);
  let i=html.indexOf("{", start);
  let depth=0;
  for(; i<html.length; i++){
    if(html[i]==="{") depth++;
    else if(html[i]==="}"){
      depth--;
      if(depth===0) return (0, eval)("("+html.slice(start, i+1)+")");
    }
  }
  fail("unclosed "+name);
}

const fightShareLine=extractFn("fightShareLine");
const fightShareClip=extractFn("fightShareClip");

assert.equal(
  fightShareLine({score:"0–0", to:3, jersey:"FreedomOS"}),
  "Arena One · GROK BOT vs GROK BUILD · 0–0 · first to 3 · FreedomOS"
);
assert.equal(
  fightShareLine({score:"2–1", to:3, jersey:"FreedomOS"}),
  "Arena One · GROK BOT vs GROK BUILD · 2–1 · first to 3 · FreedomOS"
);
assert.equal(
  fightShareLine({score:"3–2", to:3, jersey:""}),
  "Arena One · GROK BOT vs GROK BUILD · 3–2 · first to 3"
);
assert.equal(
  fightShareLine({score:"1–0", to:3, jersey:"Acme"}),
  "Arena One · GROK BOT vs GROK BUILD · 1–0 · first to 3 · Acme"
);
assert.equal(
  fightShareLine({left:"GROK BOT", right:"GROK BUILD", score:"0–0", to:3}),
  "Arena One · GROK BOT vs GROK BUILD · 0–0 · first to 3"
);

const open=fightShareLine({score:"0–0", to:3, jersey:"FreedomOS"});
const mid=fightShareLine({score:"2–1", to:3, jersey:"FreedomOS"});
const paint=fightShareLine({score:"2–1", to:3, jersey:"Acme"});
assert.notEqual(open, mid, "score change is a new desk line");
assert.notEqual(mid, paint, "jersey change is a new desk line");

const clip=fightShareClip(mid, "https://agentgaming.app");
assert.equal(clip, mid+"\nhttps://agentgaming.app");
assert.match(clip, /https:\/\/agentgaming\.app/);
assert.doesNotMatch(clip, /prize|jackpot|wager|faith|\bTim\b/i);

console.log("fight-share: ok");
