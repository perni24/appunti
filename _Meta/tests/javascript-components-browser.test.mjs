import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser componenti e scheduling: ${browser.version()}`);
});
after(async () => browser?.close());

async function fixture(t, html = "", source = "", options = {}, beforeSource) {
  const context = await browser.newContext(options);
  t.after(() => context.close());
  await context.route("**/*", (route) =>
    route.request().isNavigationRequest()
      ? route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><html><body></body></html>",
        })
      : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto("http://notes.test/");
  await page.setContent(html);
  if (beforeSource) await page.evaluate(beforeSource);
  if (source) await page.addScriptTag({ content: source });
  return page;
}
const wc = "Web Components";
const toggleHTML = snippet(wc, '<template id="note-toggle-template">', "html");
const toggleSource = snippet(wc, "class NoteToggle");
const toggleFixture = (t, options, beforeSource) =>
  fixture(t, toggleHTML, toggleSource, options, beforeSource);

test("Components: badge rende testo, aggiorna attributi e gestisce rimozioni", async (t) => {
  const page = await fixture(
    t,
    '<user-badge display-name="Luca" user-role="admin"></user-badge>',
    snippet(wc, "class UserBadge"),
  );
  assert.equal(await page.locator("user-badge").textContent(), "Luca - admin");
  const result = await page.evaluate(() => {
    const badge = document.querySelector("user-badge");
    badge.setAttribute("display-name", '<img src=x onerror="alert(1)">');
    const text = badge.textContent;
    const image = !!badge.querySelector("img");
    badge.removeAttribute("display-name");
    badge.removeAttribute("user-role");
    return { text, image, fallback: badge.textContent };
  });
  assert.deepEqual(result, {
    text: '<img src=x onerror="alert(1)"> - admin',
    image: false,
    fallback: "Utente - guest",
  });
});
test("Components: badge aggiorna dati cambiati durante la disconnessione", async (t) => {
  const page = await fixture(
    t,
    "<user-badge></user-badge>",
    snippet(wc, "class UserBadge"),
  );
  assert.equal(
    await page.evaluate(() => {
      const badge = document.querySelector("user-badge");
      badge.remove();
      badge.setAttribute("display-name", "Nuovo");
      document.body.append(badge);
      return badge.textContent;
    }),
    "Nuovo - guest",
  );
});
test("Components: registro rifiuta definizioni duplicate", async (t) => {
  const page = await toggleFixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const names = [];
      for (const name of ["note-toggle", "another-toggle"]) {
        try {
          customElements.define(name, customElements.get("note-toggle"));
        } catch (error) {
          names.push(error.name);
        }
      }
      return names;
    }),
    ["NotSupportedError", "NotSupportedError"],
  );
});
test("Components: template conserva contenuto e produce istanze indipendenti", async (t) => {
  const page = await toggleFixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const first = document.querySelector("note-toggle");
      const second = document.createElement("note-toggle");
      document.body.append(second);
      first.pressed = true;
      return [
        !!document.querySelector("template").content.querySelector("button"),
        second.pressed,
        first.shadowRoot.querySelector("button") !==
          second.shadowRoot.querySelector("button"),
      ];
    }),
    [true, false, true],
  );
});
test("Components: booleani sono basati sulla presenza e proprietà riflettono attributi", async (t) => {
  const page = await toggleFixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const el = document.querySelector("note-toggle");
      el.setAttribute("pressed", "false");
      el.setAttribute("disabled", "false");
      const button = el.shadowRoot.querySelector("button");
      const initial = [
        el.pressed,
        button.getAttribute("aria-pressed"),
        button.disabled,
      ];
      el.pressed = false;
      el.disabled = false;
      return [
        ...initial,
        el.hasAttribute("pressed"),
        el.hasAttribute("disabled"),
        button.disabled,
      ];
    }),
    [true, "true", true, false, false, false],
  );
});
test("Components: click e tastiera emettono eventi, setter non ne emette", async (t) => {
  const page = await toggleFixture(t);
  await page.evaluate(() => {
    window.events = [];
    document.addEventListener("toggle-change", (event) =>
      events.push(event.detail.pressed),
    );
    document.querySelector("note-toggle").pressed = true;
  });
  await page.getByRole("button", { name: "Preferito" }).click();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  assert.deepEqual(await page.evaluate(() => events), [false, true, false]);
});
test("Components: proprietà pre-upgrade non nascondono i setter alla connessione", async (t) => {
  const page = await toggleFixture(t, {}, () => {
    const el = document.querySelector("note-toggle");
    el.pressed = true;
    el.disabled = true;
  });
  assert.deepEqual(
    await page.evaluate(() => {
      const el = document.querySelector("note-toggle");
      return [
        Object.hasOwn(el, "pressed"),
        Object.hasOwn(el, "disabled"),
        el.pressed,
        el.shadowRoot.querySelector("button").disabled,
      ];
    }),
    [false, false, true, true],
  );
});
test("Components: riconnessioni mantengono stato senza duplicare i listener", async (t) => {
  const page = await toggleFixture(t);
  await page.evaluate(() => {
    window.events = [];
    const el = document.querySelector("note-toggle");
    for (let i = 0; i < 3; i++) {
      el.remove();
      document.body.append(el);
    }
    el.addEventListener("toggle-change", (event) =>
      events.push(event.detail.pressed),
    );
  });
  await page.getByRole("button").click();
  assert.deepEqual(await page.evaluate(() => events), [true]);
});
test("Components: disabled impedisce attivazione e aggiornare lo stato conserva focus", async (t) => {
  const page = await toggleFixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const el = document.querySelector("note-toggle");
      const button = el.shadowRoot.querySelector("button");
      button.focus();
      el.pressed = true;
      const focused = el.shadowRoot.activeElement === button;
      el.disabled = true;
      button.click();
      return [focused, el.pressed];
    }),
    [true, true],
  );
});
test("Components: evento dell'host attraversa uno shadow tree esterno", async (t) => {
  const page = await toggleFixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const wrapper = document.createElement("section");
      document.body.append(wrapper);
      const root = wrapper.attachShadow({ mode: "open" });
      const toggle = document.querySelector("note-toggle");
      root.append(toggle);
      let result;
      document.addEventListener("toggle-change", (event) => {
        result = [
          event.target === wrapper,
          event.composedPath().includes(toggle),
          event.detail.pressed,
        ];
      });
      toggle.shadowRoot.querySelector("button").click();
      return result;
    }),
    [true, true, true],
  );
});
test("Components: evento interno senza composed resta confinato", async (t) => {
  const page = await toggleFixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const el = document.querySelector("note-toggle");
      const button = el.shadowRoot.querySelector("button");
      const received = [];
      document.addEventListener("probe", (event) =>
        received.push([
          event.target === el,
          event.composedPath()[0] === button,
        ]),
      );
      button.dispatchEvent(new CustomEvent("probe", { bubbles: true }));
      button.dispatchEvent(
        new CustomEvent("probe", { bubbles: true, composed: true }),
      );
      return received;
    }),
    [[true, true]],
  );
});
test("Components: slot nominati proiettano senza spostare i nodi", async (t) => {
  const page = await fixture(
    t,
    snippet(wc, "<app-card>", "html"),
    snippet(wc, "class AppCard"),
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const card = document.querySelector("app-card");
      const title = document.querySelector("h2");
      const titleSlot = card.shadowRoot.querySelector('[name="title"]');
      const bodySlot = card.shadowRoot.querySelector("slot:not([name])");
      return [
        title.parentNode === card,
        titleSlot.assignedElements()[0] === title,
        bodySlot.assignedElements()[0].tagName,
        card.shadowRoot.querySelector("h2") === null,
      ];
    }),
    [true, true, "P", true],
  );
});
test("Components: stile esterno usa custom properties e part ma non selettori ordinari", async (t) => {
  const page = await toggleFixture(t);
  await page.addStyleTag({
    content:
      "button { background: rgb(255,0,0); } note-toggle { --toggle-background: rgb(10,20,30); color: rgb(0,80,0); } note-toggle::part(button) { border-radius: 4px; }",
  });
  assert.deepEqual(
    await page.getByRole("button").evaluate((el) => {
      const css = getComputedStyle(el);
      return [css.backgroundColor, css.color, css.borderRadius];
    }),
    ["rgb(10, 20, 30)", "rgb(0, 80, 0)", "4px"],
  );
});
test("Components: resize esterno viene rilasciato e riattivato una sola volta", async (t) => {
  const page = await fixture(
    t,
    "<viewport-width></viewport-width>",
    snippet(wc, "class ViewportWidth"),
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const el = document.querySelector("viewport-width");
      let writes = 0;
      const descriptor = Object.getOwnPropertyDescriptor(
        Node.prototype,
        "textContent",
      );
      Object.defineProperty(el, "textContent", {
        get() {
          return descriptor.get.call(this);
        },
        set(value) {
          writes++;
          descriptor.set.call(this, value);
        },
      });
      el.remove();
      window.dispatchEvent(new Event("resize"));
      const disconnected = writes;
      for (let i = 0; i < 3; i++) {
        document.body.append(el);
        el.remove();
      }
      document.body.append(el);
      writes = 0;
      window.dispatchEvent(new Event("resize"));
      return [
        disconnected,
        writes,
        el.textContent === `Larghezza: ${innerWidth}px`,
      ];
    }),
    [0, 1, true],
  );
});

const scheduling = "Scheduling Browser";
test("Scheduling browser: rAF reale completa l'animazione", async (t) => {
  const page = await fixture(
    t,
    '<div id="moving-label"></div>',
    snippet(scheduling, "function animateTranslation"),
    { reducedMotion: "no-preference" },
  );
  await page.evaluate(() =>
    animateTranslation(document.querySelector("div"), 30),
  );
  await page.waitForFunction(
    () => document.querySelector("div").style.transform === "translateX(200px)",
  );
});
test("Scheduling browser: reduced motion salta l'animazione", async (t) => {
  const page = await fixture(
    t,
    "<div></div>",
    snippet(scheduling, "function animateTranslation"),
    { reducedMotion: "reduce" },
  );
  assert.equal(
    await page.evaluate(() => {
      animateTranslation(document.querySelector("div"));
      return document.querySelector("div").style.transform;
    }),
    "translateX(200px)",
  );
});
test("Scheduling browser: batch layout applica +10 al border box", async (t) => {
  const page = await fixture(
    t,
    '<div data-grow style="height:40px;padding:5px;border:2px solid;box-sizing:border-box"></div>',
    snippet(scheduling, "const items = Array.from"),
  );
  await page.waitForFunction(
    () => document.querySelector("div").style.height === "50px",
  );
  assert.equal(await page.locator("div").evaluate((el) => el.offsetHeight), 50);
});
test("Scheduling browser: idle nativo completa la coda", async (t) => {
  const page = await fixture(t, "", snippet(scheduling, "const idleResults"));
  assert.equal(await page.evaluate(() => supportsIdle), true);
  await page.waitForFunction(() => cursor === 200);
  assert.deepEqual(
    await page.evaluate(() => [
      idleResults.length,
      idleResults[199],
      idleHandle,
    ]),
    [200, 39601, null],
  );
});
test("Scheduling browser: somma usa scheduler.yield nativo", async (t) => {
  const source =
    snippet(scheduling, "function yieldToBrowser") +
    "\n" +
    snippet(scheduling, "async function sumWithBudget");
  const page = await fixture(t, "", source);
  assert.equal(await page.evaluate(() => typeof scheduler.yield), "function");
  assert.equal(
    await page.evaluate(() =>
      sumWithBudget([10, 20, 30, 40], { batchSize: 1 }),
    ),
    100,
  );
});
test("Scheduling browser: esempio postTask restituisce il risultato", async (t) => {
  const page = await fixture(t);
  const logs = [];
  page.on("console", (message) => logs.push(message.text()));
  await page.evaluate(
    async (source) => {
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      await new AsyncFunction(source)();
    },
    snippet(scheduling, "typeof globalThis.scheduler?.postTask"),
  );
  assert.deepEqual(logs, ["42"]);
});
