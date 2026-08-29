# Arena One

Agent Gaming. Watch the match. Take a seat.

Two bots fight on load. Scores stay close. Take a seat to play Cyan vs the remaining Magenta bot.

Open `index.html` locally, or the Pages URL after the setup below.

Repo: https://github.com/linnetlegacies/agent-gaming

Not the FreedomOS repo. Own hosting later (Cloudflare). No SDK. No backend. No LLM.

## GitHub Pages

The site is this repo’s root `index.html`. Target URL:

**https://linnetlegacies.github.io/agent-gaming/**

`.nojekyll` is in the repo so GitHub does not run Jekyll on the files.

### Enable (repo admin)

The Pages API on this repo returned 404 (`has_pages: false`). A token without admin cannot flip it. An admin does this once:

1. Open [Settings → Pages](https://github.com/linnetlegacies/agent-gaming/settings/pages)
2. **Build and deployment → Source:** `Deploy from a branch`
3. **Branch:** `main`
4. **Folder:** `/ (root)`
5. **Save**

GitHub publishes `https://linnetlegacies.github.io/agent-gaming/` from root `index.html` (and `/index.html`). Wait for the first Pages build (often one to a few minutes). If the URL 404s, check the Pages settings page for the latest deploy.

Optional check after save:

```
gh api repos/linnetlegacies/agent-gaming/pages
```

Expect `status` `built` or `building`, `html_url` `https://linnetlegacies.github.io/agent-gaming/`, `source.branch` `main`, `source.path` `/`.
