# Health Factory

[Read the magazine](https://alexg7707.github.io/health-factory/) · [Try the weekly journal](https://alexg7707.github.io/health-factory/journal.html) · [See the build and test runs](https://github.com/Alexg7707/health-factory/actions)

Health Factory is an independent English-language magazine about food, movement, relationships and the things people do for the pleasure of doing them. The first issue opens on a Chicago running track, with a guide to taking a walk break on purpose.

[![Health Factory cover with a runner on a Chicago track](https://alexg7707.github.io/health-factory/previews/desktop.png)](https://alexg7707.github.io/health-factory/)

## Read the issue

- [Your first run starts with a walk](https://alexg7707.github.io/health-factory/running.html) explores Jeff Galloway’s approach and the opening session of NHS Couch to 5K.
- [Nutrition](https://alexg7707.github.io/health-factory/nutrition.html) offers breakfast, lunch, dinner and snack ideas with everyday substitutions.
- [Sex & Relationships](https://alexg7707.github.io/health-factory/relationships.html) gives readers words for starting a conversation about intimacy, boundaries and protection.
- [One cup, three sketches](https://alexg7707.github.io/health-factory/hobbies.html) takes readers from a blank page to a small drawing project.
- [The winter calendar](https://alexg7707.github.io/health-factory/events.html) links directly to the organizers of three outdoor events.

## How it works

The articles are static HTML and CSS. They open directly from a link and remain readable with JavaScript disabled. Two interactive features use strict TypeScript.

| Feature | Implementation | A design decision |
| --- | --- | --- |
| Meal and habit picker | [Planner](src/planner.ts) and [browser controls](src/app.ts) | Validate saved selections when reading them back. |
| Weekly journal | [Calendar and storage model](src/journal-model.ts) and [journal UI](src/journal.ts) | Store each date separately in the browser. Readers can clear one entry while keeping the rest of the week. |
| Production container | [Dockerfile](Dockerfile) and [nginx configuration](docker/nginx.conf) | Compile in a Node.js build stage, then serve static files as a non-root user. |
| Delivery | [Pages workflow](.github/workflows/pages.yml) and [container smoke test](.github/workflows/container.yml) | Exercise the interface in Chromium and check HTML, JavaScript and a photograph in a running container. |

The journal requires no account. Entries stay on the device and are removed if the reader clears the site’s storage.

## Run locally

With Node.js 22 or later:

```sh
npm ci
npm test
npm run build
node scripts/check-site.mjs
```

Serve the resulting `public/` directory with a local HTTP server. With Python installed, run `python -m http.server 8000 --directory public` and visit `http://localhost:8000`. The first build fetches the credited photographs and verifies their SHA-256 digests. Subsequent builds can reuse the local files. [Photography credits](images/SOURCES.md)

To run the same production image used in the smoke test:

```sh
docker build -t health-factory .
docker run --rm --read-only --tmpfs /tmp -p 127.0.0.1:8080:8080 health-factory
```

Open `http://localhost:8080`. For an end-to-end test run, install Chromium with `npx playwright install chromium`, then run `npm run test:browser`. Tests open the cover story, save and clear a meal selection, navigate the weekly journal and check each page at five viewport widths. The deployed [desktop](https://alexg7707.github.io/health-factory/previews/desktop.png) and [mobile](https://alexg7707.github.io/health-factory/previews/mobile.png) previews come from the same browser checks.
