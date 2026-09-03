import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

function fail(msg){ throw new Error(msg); }
function must(re, label){ if(!re.test(html)) fail("missing "+label); }
function mustNot(re, label){ if(re.test(html)) fail("forbidden "+label); }

must(/function paintReturn\(kind, opt\)\{/, "paintReturn");
must(/function queryReturn\(\)\{/, "queryReturn");
must(/function storeBid\(raw\)\{/, "storeBid");
must(/function bidFace\(raw\)\{/, "bidFace");
must(/BID_KEY="ag-light-bid"/, "bid storage key");
must(/Watch this fight/, "next-watcher CTA");
must(/Your bid is in/, "paid confirmation heading");
must(/Your bid is at the rail/, "rail confirmation heading");
must(/function returnCopy\(kind, held, face\)\{/, "returnCopy");
must(/You're next at the rail\. Jersey lands after this fight/, "held paid return");
must(/Bid received\. Jersey lands on this fight\./, "open paid return");
must(/This fight still wears FreedomOS/, "FreedomOS stays while held");
must(/If Light \$20 clears, you're next — jersey lands after this fight/, "held pending return");
must(/If Light \$20 clears, this plate wears that jersey/, "open pending return");
must(/Card rail closed/, "cancel copy");
must(/Send another URL if you want a different plate/, "re-arm path");
must(/ctaMode==="watch"/, "watch CTA mode");
must(/q\.get\("light"\)==="1"/, "light=1 success");
must(/sid\.slice\(0,3\)==="cs_"/, "session_id cs_");
must(/client_reference_id/, "client_reference_id");
must(/canceled/, "canceled URL");
must(/visibilitychange/, "tab-return upgrade");
must(/AG_FIGHT_SPONSOR=\{name:"FreedomOS"/, "FreedomOS jersey stays");
must(/PAY_LINK="https:\/\/buy\.stripe\.com\/aFa8wR6becIZ3ZF8QM2Fa00"/, "Payment Link unchanged");
must(/id="sponsor-return"/, "sponsor-return line");
must(/is-live\.is-return \.ghost-empty/, "live plate celebrates return");
must(/House spent stays \$0\.00/, "costnote stays under the board");
must(/LIVE · NOW/, "LIVE · NOW booth left alone");

mustNot(/if\(\$plate\.classList\.contains\("is-live"\)\) return;/, "live plate must not swallow return");
mustNot(/function markBidReceived/, "old markBidReceived leftover");
mustNot(/function paidReturn/, "old paidReturn leftover");
mustNot(/prize pool/i, "no prize pool");
mustNot(/jackpot/i, "no jackpot");
mustNot(/gambling/i, "no gambling");
mustNot(/wager/i, "no wager");
mustNot(/\bTim\b/, "no Tim");
mustNot(/faith/i, "no faith");
mustNot(/grind-coach/i, "no grind-coach");
mustNot(/porn/i, "no porn leftover");

const sanitizeBid=raw=>String(raw).trim().replace(/[:/.@]/g,"-").replace(/[^A-Za-z0-9_-]/g,"").slice(0,200);
function bidFace(raw){
  const t=String(raw||"").trim().slice(0,80);
  if(!t) return "";
  if(t[0]==="@") return t.replace(/[^\w@.-]/g,"").slice(0,32);
  try {
    const href=t.includes("://")?t:"https://"+t;
    const u=new URL(href);
    if(u.protocol==="http:"||u.protocol==="https:") return u.hostname.replace(/^www\./,"").slice(0,40);
  } catch(e){}
  return sanitizeBid(t).slice(0,32);
}
assert.equal(bidFace("@acme"), "@acme");
assert.equal(bidFace("https://example.com/@acme"), "example.com");
assert.equal(bidFace("example.com"), "example.com");
assert.equal(sanitizeBid("https://example.com/@acme"), "https---example-com--acme");

function queryKind(search, hash){
  const q=new URLSearchParams(search);
  const h=String(hash||"").replace(/^#/,"").toLowerCase();
  const sid=String(q.get("session_id")||"");
  const canceled=q.get("canceled")==="1"||q.get("cancel")==="1"||q.get("redirect_status")==="canceled"||h==="canceled"||h==="cancel";
  const paid=q.get("light")==="1"||q.get("paid")==="1"||q.get("redirect_status")==="succeeded"||sid.slice(0,3)==="cs_"||h==="light"||h==="paid";
  if(canceled) return "cancel";
  if(paid) return "paid";
  return "";
}
assert.equal(queryKind("?light=1",""), "paid");
assert.equal(queryKind("?session_id=cs_live_abc",""), "paid");
assert.equal(queryKind("?session_id=not_a_session",""), "");
assert.equal(queryKind("?canceled=1",""), "cancel");
assert.equal(queryKind("", "#light"), "paid");
assert.equal(queryKind("?utm_source=stripe",""), "");
assert.equal(queryKind("", ""), "");

const stageAt=html.indexOf('id="stage"');
const sponsorAt=html.indexOf('id="sponsor"');
const returnAt=html.indexOf('id="sponsor-return"');
if(sponsorAt<0 || returnAt<0 || returnAt<sponsorAt) fail("sponsor-return must sit in the sponsor rail");
if(stageAt<0 || sponsorAt<stageAt) fail("sponsor rail stays under the fight");

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
const returnCopy=(0, eval)("("+sliceFn("returnCopy")+")");
const heldPaid=returnCopy("paid", true, "");
assert.equal(heldPaid.say, "Bid received. You're next at the rail. Jersey lands after this fight.");
assert.equal(heldPaid.plate, "Bid received. You're next at the rail. Jersey lands after this fight.");
assert.ok(heldPaid.note.includes("Jersey lands after this fight."));
assert.ok(heldPaid.note.includes("This fight still wears FreedomOS."));
assert.equal(heldPaid.plate.includes("Jersey lands on this fight"), false);
assert.equal(heldPaid.note.includes("Jersey lands on this fight"), false);
assert.equal(heldPaid.say.includes("until that paint"), false);
const heldPaidFace=returnCopy("paid", true, "acme.com");
assert.ok(heldPaidFace.plate.includes("you're next at the rail"));
assert.ok(heldPaidFace.plate.includes("Jersey lands after this fight."));
assert.equal(heldPaidFace.plate.includes("Jersey lands on this fight"), false);
assert.equal(heldPaidFace.note.includes("Jersey lands on this fight"), false);
const openPaid=returnCopy("paid", false, "");
assert.equal(openPaid.say, "Bid received. Jersey lands on this fight.");
assert.equal(openPaid.plate, "Bid received. Jersey lands on this fight.");
const heldRail=returnCopy("rail", true, "");
assert.ok(heldRail.plate.includes("If Light $20 clears, you're next"));
assert.ok(heldRail.plate.includes("jersey lands after this fight"));
assert.equal(heldRail.plate.includes("Bid received"), false);
assert.equal(heldRail.note.includes("Bid received"), false);
assert.equal(heldRail.plate.includes("Jersey lands on this fight"), false);
const openRail=returnCopy("rail", false, "acme.com");
assert.ok(openRail.plate.includes("If Light $20 clears, this plate wears that jersey"));
assert.equal(openRail.plate.includes("Bid received"), false);
assert.equal(openRail.note.includes("Bid received"), false);

console.log("paid-return: ok");
