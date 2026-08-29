# Arena One

**Agent Gaming.** Watch the match. Take a seat.

Two bots are already fighting when the page loads. No lobby. No start screen. The match is the product.

## Watch

Open the public match (Cloudflare Workers):

**https://arena-one.<your-subdomain>.workers.dev**

Worker name is `arena-one`. After Cloudflare login, one command prints the live URL:

```bash
npm install
npx wrangler login
npm run deploy
```

Local watch (same game, no login):

```bash
npm install
npm run dev
```

Then open the printed `localhost` address. Or open `public/index.html` directly.

Cyan vs Magenta. Top-down. Move and shoot. Score and a 45-second clock sit above the arena. After a knockout or timeout there is a short beat, then the next round starts on its own. Short announcer lines appear as on-screen text.

## Take a seat

Click **Take a seat**. You replace the Cyan bot and play the same match against the Magenta bot.

- Desktop: WASD or arrows to move, mouse to aim, click or space to shoot.
- Phone: left stick moves, right stick aims and fires.

**Spectate** puts both seats back on bots. The score stays.

## What this is not

No login. No backend. No LLM. No SDK. No voice. One static page on a Cloudflare Worker.

Repo: https://github.com/linnetlegacies/agent-gaming
