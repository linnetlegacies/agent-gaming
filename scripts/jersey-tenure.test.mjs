import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

function fail(msg){ throw new Error(msg); }
function must(re, label){ if(!re.test(html)) fail("missing "+label); }
function mustNot(re, label){ if(re.test(html)) fail("forbidden "+label); }

must(/function parseSponsorTenure\(s\)\{/, "parseSponsorTenure");
must(/function tenureHeldLine\(fightsLeft, untilMs, now\)\{/, "tenureHeldLine");
must(/function tenureIsLive\(t, now\)\{/, "tenureIsLive");
must(/function tenureOpenCopy\(\)\{/, "tenureOpenCopy");
must(/function nextTenure\(t\)\{/, "nextTenure");
must(/function consumeFightTenure\(\)\{/, "consumeFightTenure");
must(/function expireFightSponsor\(\)\{/, "expireFightSponsor");
must(/consumeFightTenure\(\);/, "match end consumes tenure");
must(/This fight · slot opens next/, "held copy names this fight");
must(/OPEN · NEXT LIGHT/, "open kicker");
must(/\$20 · name and logo on this fight/, "open offer");
must(/Slot is open\. Bid takes the plate\./, "open invite");
must(/id="ghost-bid"/, "open bid control on the plate");
must(/id="ghost-tenure"/, "tenure line");
must(/AG_FIGHT_SPONSOR=\{name:"FreedomOS"/, "FreedomOS jersey stays");
must(/light:20,fights:1/, "FreedomOS tenure is one fight");
must(/PAY_LINK="https:\/\/buy\.stripe\.com\/aFa8wR6becIZ3ZF8QM2Fa00"/, "Payment Link unchanged");
must(/q\.get\("light"\)==="1"/, "light=1 return");
must(/sid\.slice\(0,3\)==="cs_"/, "session_id cs_");
must(/window\.AG_setFightSponsor=setFightSponsor/, "operator setter");
must(/window\.AG_consumeFight=consumeFightTenure/, "hidden consume hook");
must(/window\.AG_expireSponsor=expireFightSponsor/, "hidden expire hook");
must(/TENURE_DEFAULT_FIGHTS=1/, "default tenure is one fight");
must(/data:image\/svg\+xml/, "inline SVG favicon");
must(/Built with <a href="https:\/\/x\.ai\/bot"/, "footer stays Grok Bot");
must(/House spent stays \$0\.00/, "house spend stays true");

mustNot(/prize pool/i, "no prize pool");
mustNot(/jackpot/i, "no jackpot");
mustNot(/gambling/i, "no gambling");
mustNot(/wager/i, "no wager");
mustNot(/\bTim\b/, "no Tim");
mustNot(/faith/i, "no faith");
mustNot(/grind-coach/i, "no grind-coach");
mustNot(/getfreedomos\.com chrome/i, "no FO chrome leftover");
mustNot(/id="tenure-debug"/, "no visible test control");
mustNot(/Fast-forward tenure/, "no visible fast-forward");

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

const tenureFns=(0, eval)("(function(){ const TENURE_DEFAULT_FIGHTS=1; "+
  ["parseSponsorTenure","tenureClock","tenureHeldLine","tenureIsLive","tenureOpenCopy","nextTenure"].map(sliceFn).join("\n")+
  "; return {parseSponsorTenure,tenureClock,tenureHeldLine,tenureIsLive,tenureOpenCopy,nextTenure}; })()");
const {parseSponsorTenure, tenureClock, tenureHeldLine, tenureIsLive, tenureOpenCopy, nextTenure}=tenureFns;

assert.deepEqual(parseSponsorTenure({name:"FreedomOS",url:"https://getfreedomos.com",logo:"https://getfreedomos.com/logo/f/f-logo-64x64.png",light:20}), {fights:1, until:0, cap:true}, "today's setter shape defaults to one fight");
assert.doesNotThrow(()=>parseSponsorTenure(null));
assert.doesNotThrow(()=>parseSponsorTenure("FreedomOS"));
assert.doesNotThrow(()=>parseSponsorTenure({name:"Acme", fights:"nope", until:"later"}));
assert.equal(parseSponsorTenure(null).fights, 1);
assert.equal(parseSponsorTenure({fights:3}).fights, 3);
assert.equal(parseSponsorTenure({tenure:{fights:4}}).fights, 4);
assert.equal(parseSponsorTenure({fights:"2"}).fights, 2);
assert.equal(parseSponsorTenure({fights:0}).fights, 0);
assert.equal(parseSponsorTenure({until:1700000000000}).cap, false);
assert.equal(parseSponsorTenure({until:1700000000000}).fights, 0);
assert.equal(parseSponsorTenure({until:1700000000}).until, 1700000000000);
assert.ok(parseSponsorTenure({until:"2030-01-01T00:00:00Z"}).until > 0);

assert.equal(tenureHeldLine(1, 0, 0), "This fight · slot opens next");
assert.equal(tenureHeldLine(2, 0, 0), "2 fights left on the card");
assert.equal(tenureHeldLine(3, 0, 0), "3 fights left on the card");
assert.equal(tenureHeldLine(0, 0, 0), "");
assert.match(tenureHeldLine(1, 1_000_000, 880_000), /This fight · 2:00 left on this run/);
assert.match(tenureHeldLine(2, 1_000_000, 880_000), /2 fights left on the card · 2:00 left on this run/);
assert.match(tenureClock(1_000_000, 40_000), /16:00 left on this run/);

assert.equal(tenureIsLive({fights:1, until:0, cap:true}, 0), true);
assert.equal(tenureIsLive({fights:0, until:0, cap:true}, 0), false);
assert.equal(tenureIsLive({fights:2, until:50, cap:true}, 100), false);
assert.equal(tenureIsLive({fights:0, until:200, cap:false}, 100), true);
assert.equal(tenureIsLive({fights:0, until:50, cap:false}, 100), false);
assert.equal(tenureIsLive({fights:0, until:200, cap:true}, 100), false, "fight cap exhausted even if time remains");

assert.deepEqual(nextTenure({fights:2, until:0, cap:true}), {fights:1, until:0, cap:true});
assert.deepEqual(nextTenure({fights:1, until:0, cap:true}), {fights:0, until:0, cap:true});
assert.equal(tenureIsLive(nextTenure({fights:1, until:0, cap:true}), 0), false);
assert.deepEqual(nextTenure({fights:0, until:9, cap:false}), {fights:0, until:9, cap:false});

let left={fights:3, until:0, cap:true};
left=nextTenure(left);
assert.equal(tenureHeldLine(left.fights, 0, 0), "2 fights left on the card");
left=nextTenure(left);
assert.equal(tenureHeldLine(left.fights, 0, 0), "This fight · slot opens next");
left=nextTenure(left);
assert.equal(tenureIsLive(left, 0), false);

const open=tenureOpenCopy();
assert.equal(open.kicker, "OPEN · NEXT LIGHT");
assert.equal(open.offer, "$20 · name and logo on this fight");
assert.equal(open.empty, "Slot is open. Bid takes the plate.");
assert.equal(open.bid, "Sponsor this fight · $20");
assert.match(open.aria, /\$20/);
assert.doesNotMatch(JSON.stringify(open), /prize|jackpot|wager|faith|\bTim\b|grind/i);

console.log("jersey-tenure: ok");
