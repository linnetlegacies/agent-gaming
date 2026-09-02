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
must(/jersey lands on this fight/, "jersey path language");
must(/This fight still wears FreedomOS until that paint/, "FreedomOS stays until paint");
must(/If Light \$20 clears, this plate wears that jersey/, "honest rail copy");
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

console.log("paid-return: ok");
