import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

function fail(msg){ throw new Error(msg); }
function must(re, label){ if(!re.test(html)) fail("missing "+label); }
function mustNot(re, label){ if(re.test(html)) fail("forbidden "+label); }

must(/function openPlateCopy\(\)\{/, "openPlateCopy");
must(/function setFightSponsor\(s\)\{/, "setFightSponsor");
must(/function paintGhost\(\)\{/, "paintGhost");
must(/function finishMatch\(reason, alreadyStung\)\{/, "finishMatch");
must(/NEXT LIGHT OPEN/, "next-light kicker on held plate");
must(/\$20 names the next fight/, "next-light offer");
must(/id="ghost-next-bid"/, "next-light CTA on plate");
must(/id="ghost-scope"/, "this-fight scope line");
must(/>This fight<\/p>/, "This fight scope copy");
must(/\$20\.00 · paid Light · this fight/, "held money line");
must(/OPEN · NEXT LIGHT/, "open kicker when globally empty");
must(/Slot is open\. Bid takes the plate\./, "open invite");
must(/id="ghost-bid"/, "open bid control");
must(/AG_FIGHT_SPONSOR=\{name:"FreedomOS"/, "FreedomOS configured globally");
must(/light:20\}/, "FreedomOS light without local fights field");
must(/PAY_LINK="https:\/\/buy\.stripe\.com\/aFa8wR6becIZ3ZF8QM2Fa00"/, "Payment Link unchanged");
must(/openBidField\(\)/, "plate CTAs focus existing rail");
must(/window\.AG_setFightSponsor=setFightSponsor/, "operator setter");
must(/q\.get\("light"\)==="1"/, "light=1 return");
must(/data:image\/svg\+xml/, "inline SVG favicon");
must(/Built with <a href="https:\/\/x\.ai\/bot"/, "footer stays Grok Bot");
must(/House spent stays \$0\.00/, "house spend stays true");

mustNot(/ag-light-tenure/, "no sponsor tenure storage key");
mustNot(/function consumeFightTenure/, "no local tenure consume");
mustNot(/function expireFightSponsor/, "no local tenure expire");
mustNot(/function pulseTenure/, "no local tenure pulse");
mustNot(/function parseSponsorTenure/, "no local tenure parser");
mustNot(/window\.AG_consumeFight/, "no consume hook");
mustNot(/window\.AG_expireSponsor/, "no expire hook");
mustNot(/consumeFightTenure\(\)/, "match end must not mutate sponsor");
mustNot(/slot opens next/, "no fake local countdown copy");
mustNot(/fights left on the card/, "no fake fight countdown");
mustNot(/left on this run/, "no fake time countdown");
mustNot(/prize pool/i, "no prize pool");
mustNot(/jackpot/i, "no jackpot");
mustNot(/gambling/i, "no gambling");
mustNot(/wager/i, "no wager");
mustNot(/\bTim\b/, "no Tim");
mustNot(/faith/i, "no faith");

function sliceFn(name){
  const start=html.indexOf("function "+name+"(");
  if(start<0) fail("extract "+name);
  let i=html.indexOf("{", start);
  let depth=0;
  for(; i<html.length; i++){
    if(html[i]==="{") depth++;
    else if(html[i]==="}"){
      depth--;
      if(depth===0) return html.slice(start, i+1);
    }
  }
  fail("unclosed "+name);
}

const openPlateCopy=(0, eval)("("+sliceFn("openPlateCopy")+")");
const open=openPlateCopy();
assert.equal(open.kicker, "OPEN · NEXT LIGHT");
assert.equal(open.offer, "$20 · name and logo on this fight");
assert.equal(open.empty, "Slot is open. Bid takes the plate.");
assert.equal(open.bid, "Sponsor this fight · $20");

const finishMatch=sliceFn("finishMatch");
assert.doesNotMatch(finishMatch, /consumeFightTenure|expireFightSponsor|pulseTenure|writeTenurePersist|readTenurePersist/);

function sponsorConfigured(s){
  const name=s && typeof s.name==="string" ? s.name.trim().slice(0,80) : "";
  const logo=s && s.logo ? String(s.logo).trim() : "";
  return !!(name || logo);
}

assert.equal(sponsorConfigured({name:"FreedomOS",url:"https://getfreedomos.com",logo:"https://getfreedomos.com/logo/f/f-logo-64x64.png",light:20}), true);
assert.equal(sponsorConfigured(null), false);
assert.equal(sponsorConfigured({}), false);
assert.equal(sponsorConfigured({name:"",logo:""}), false);

const heldHtml=html.match(/<aside id="fight-sponsor"[\s\S]*?<\/aside>/);
if(!heldHtml) fail("fight-sponsor markup");
assert.match(heldHtml[0], /FreedomOS/);
assert.match(heldHtml[0], /\$20\.00 · paid Light · this fight/);
assert.match(heldHtml[0], />This fight</);
assert.match(heldHtml[0], /NEXT LIGHT OPEN/);
assert.match(heldHtml[0], /\$20 names the next fight/);
assert.match(heldHtml[0], /Sponsor next fight · \$20/);

const initBlock=html.slice(html.indexOf("window.AG_FIGHT_SPONSOR"), html.indexOf("window.AG_setFightSponsor"));
assert.match(initBlock, /setFightSponsor\(window\.AG_FIGHT_SPONSOR\)/);
assert.match(initBlock, /else paintGhost\(\)/);

console.log("jersey-tenure: ok");
