import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

function fail(msg){ throw new Error(msg); }
function must(re, label){ if(!re.test(html)) fail("missing "+label); }
function mustNot(re, label){ if(re.test(html)) fail("forbidden "+label); }

must(/function snapshotBoard\(\)\{/, "snapshotBoard");
must(/matchPerson=null/, "clear matchPerson on newMatch");
must(/spentN:\(\(last && Number\(last\.spentN\)\)\|\|0\)\+played\.spentN/, "fold person spent");
must(/wins:\(\(last && Number\(last\.wins\)\)\|\|0\)\+played\.wins/, "fold person wins");
must(/board\.botWins\[0\]\+=rounds\[0\]/, "fold bot 0");
must(/board\.botWins\[1\]\+=rounds\[1\]/, "fold bot 1");
must(/spentN:\(\(last && Number\(last\.spentN\)\)\|\|0\)\+\(played\?played\.spentN:0\)/, "liveYou session+live spent");
must(/wins:\(\(last && Number\(last\.wins\)\)\|\|0\)\+\(played\?played\.wins:0\)/, "liveYou session+live wins");
must(/rows\.push\(\{ kind:"model", who:"GROK BOT", spentN:0/, "house GROK BOT $0");
must(/rows\.push\(\{ kind:"bot", who:"GROK BUILD", spentN:0/, "house GROK BUILD $0");
must(/const cost=house \? money0 : money\(r\.spentN\)/, "house spent column $0.00");
must(/const cpw=house \? money0 : \(r\.wins \? money\(r\.spentN\/r\.wins\) : "—"\)/, "house cost/win $0.00");
must(/Light <b>"\+money2\(fightLight\)/, "Light $ on stakes");
must(/leaders house <b>"\+money0/, "house $0.00 on stakes");
must(/AG_FIGHT_SPONSOR=\{name:"FreedomOS"/, "FreedomOS jersey");
must(/PAY_LINK="https:\/\/buy\.stripe\.com\/aFa8wR6becIZ3ZF8QM2Fa00"/, "Payment Link");
must(/function iceBottom\(\)/, "iceBottom");
must(/punch=\{x,y,t:0,dur:PUNCH\}/, "last-hit punch");
must(/LIVE · NOW/, "LIVE · NOW booth");
must(/You're watching/, "watchers framing");
must(/Next match is live/, "next match broadcast");
must(/Opening card\./, "opening card hist");
must(/House spent stays \$0\.00/, "relocated costnote");
mustNot(/board\.you=you/, "hud must not write liveYou onto board.you");
mustNot(/board\.you=liveYou\(\)/, "takeSeat/spectate must not bake liveYou into session");
mustNot(/\bTim\b/, "no Tim");
mustNot(/faith/i, "no faith");
mustNot(/grind-coach/i, "no grind-coach");
mustNot(/per-frame LLM/, "no LLM explainer on the page");
mustNot(/House compute is already on/, "no compute leftover");
mustNot(/sponsor-gated/, "no sponsor-gated leftover");
mustNot(/viewers? \d/, "no fake viewer count");

const stageAt=html.indexOf('id="stage"');
const costAt=html.indexOf('id="costnote"');
const boothAt=html.indexOf('id="booth"');
const boardAt=html.indexOf('id="board"');
if(boothAt<0 || boothAt>stageAt) fail("booth must sit above the fight");
if(costAt<0 || costAt<stageAt || costAt<boardAt) fail("costnote must sit under the board, not above the fight");

function personJersey(side){
  return { who:side===0?"YOU · GROK BOT":"YOU · GROK BUILD", cls:side===0?"cyan":"mag" };
}

function simulate(){
  let human=null, rounds=[0,0], spent=[0,0], matchPerson=null;
  let board={ you:null, botWins:[0,0] };
  const currentPerson=()=>{
    if(human===0||human===1){
      const j=personJersey(human);
      return { side:human, spentN:spent[human], wins:rounds[human], who:j.who, cls:j.cls };
    }
    return matchPerson;
  };
  const liveYou=()=>{
    const last=board.you;
    const played=currentPerson();
    if(!last && !played) return null;
    return {
      kind:"person",
      who:(played && played.who) || (last && last.who) || "YOU · GROK BOT",
      spentN:((last && Number(last.spentN))||0)+(played?played.spentN:0),
      wins:((last && Number(last.wins))||0)+(played?played.wins:0),
      cls:(played && played.cls) || (last && last.cls) || "cyan"
    };
  };
  const snapshotBoard=()=>{
    const played=currentPerson();
    if(!(rounds[0]||rounds[1]||(played && played.spentN))) return;
    if(played){
      const last=board.you;
      board.you={
        kind:"person",
        who:played.who,
        spentN:((last && Number(last.spentN))||0)+played.spentN,
        wins:((last && Number(last.wins))||0)+played.wins,
        cls:played.cls
      };
    }
    const personSide=played?played.side:human;
    if(personSide!==0) board.botWins[0]+=rounds[0];
    if(personSide!==1) board.botWins[1]+=rounds[1];
  };
  const newMatch=()=>{
    snapshotBoard();
    matchPerson=null;
    rounds=[0,0]; spent=[0,0];
  };
  const rows=(filter)=>{
    const out=[];
    const you=liveYou();
    if(you && filter!=="bots") out.push(you);
    if(filter!=="people"){
      const live0=human!==0?rounds[0]:0;
      const live1=human!==1?rounds[1]:0;
      out.push({ kind:"model", who:"GROK BOT", spentN:0, wins:board.botWins[0]+live0 });
      out.push({ kind:"bot", who:"GROK BUILD", spentN:0, wins:board.botWins[1]+live1 });
    }
    return out;
  };

  newMatch();
  assert.deepEqual(board.botWins, [0,0]);
  assert.equal(liveYou(), null);

  rounds=[3,1];
  newMatch();
  assert.deepEqual(board.botWins, [3,1], "house match folds bot wins");
  let house=rows("bots");
  assert.equal(house.find(r=>r.who==="GROK BOT").wins, 3);
  assert.equal(house.find(r=>r.who==="GROK BUILD").wins, 1);
  assert.equal(house.find(r=>r.who==="GROK BOT").spentN, 0);
  assert.equal(house.find(r=>r.who==="GROK BUILD").spentN, 0);

  rounds=[2,3];
  newMatch();
  house=rows("bots");
  assert.equal(house.find(r=>r.who==="GROK BOT").wins, 5);
  assert.equal(house.find(r=>r.who==="GROK BUILD").wins, 4);

  human=0;
  rounds=[2,3];
  spent=[0.042,0];
  const mid=liveYou();
  assert.equal(mid.wins, 2);
  assert.equal(mid.spentN, 0.042);
  newMatch();
  const you=liveYou();
  assert.equal(you.wins, 2, "seated wins survive Next match");
  assert.ok(Math.abs(you.spentN-0.042)<1e-9, "seated spent survives Next match");
  assert.equal(you.wins?you.spentN/you.wins:0, 0.021);
  const people=rows("people");
  assert.equal(people.length, 1);
  assert.equal(people[0].wins, 2);
  const all=rows("all");
  assert.equal(all.find(r=>r.who==="GROK BOT").wins, 5, "seated cyan wins stay on the person row");
  assert.equal(all.find(r=>r.who==="GROK BUILD").wins, 7);
  assert.equal(all.find(r=>r.who==="GROK BOT").spentN, 0);
  assert.equal(all.find(r=>r.kind==="person").spentN, 0.042);

  rounds=[1,3];
  spent=[0.018,0];
  newMatch();
  assert.equal(liveYou().wins, 3);
  assert.ok(Math.abs(liveYou().spentN-0.060)<1e-9);
  assert.equal(rows("bots").find(r=>r.who==="GROK BUILD").wins, 10);

  matchPerson={ side:0, spentN:0.01, wins:1, who:"YOU · GROK BOT", cls:"cyan" };
  human=null;
  rounds=[1,2];
  spent=[0,0];
  newMatch();
  assert.equal(liveYou().wins, 4, "spectate before Next match still folds the seat");
  assert.equal(rows("bots").find(r=>r.who==="GROK BOT").wins, 5);
  assert.equal(rows("bots").find(r=>r.who==="GROK BUILD").wins, 12);
}

simulate();
console.log("board-continuity: ok");
