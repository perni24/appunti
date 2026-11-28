import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { before, after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const home = "https://esempi.test/appunti/lezioni/index.html";
let browser;
before(async () => {
  const channel = process.env.BROWSER_CHANNEL || "chrome";
  browser =
    channel === "firefox"
      ? await firefox.launch({ headless: true })
      : await chromium.launch({ headless: true, channel });
});
after(async () => {
  await browser?.close();
});

async function pageFor(
  t,
  name,
  width = 800,
  { section, deviceScaleFactor = 1, promemoria = false, fixture } = {},
) {
  const { tree } = parseNote(
    "Programmazione/HTML e CSS/" +
      (promemoria ? "Promemoria/" : "") +
      "Pagine/" +
      name +
      ".md",
  );
  let blocks = tree.children;
  if (section) {
    const start = blocks.findIndex(
      (n) => n.type === "heading" && n.children[0]?.value === section,
    );
    assert.ok(start >= 0, "Sezione mancante: " + section);
    const following = blocks.slice(start + 1);
    const end = following.findIndex(
      (n) => n.type === "heading" && n.depth <= blocks[start].depth,
    );
    blocks = end < 0 ? following : following.slice(0, end);
  }
  const snippet = (lang) =>
    blocks.find((n) => n.type === "code" && n.lang === lang)?.value;
  const markup = snippet("html") ?? fixture,
    css = blocks
      .filter((n) => n.type === "code" && n.lang === "css")
      .slice(0, promemoria ? undefined : 1)
      .map((n) => n.value)
      .join("\n");
  assert.ok(markup, name);
  const html = markup.startsWith("<!doctype")
    ? markup
    : '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="./stile.css"></head><body>' +
      markup +
      "</body></html>";
  const ctx = await browser.newContext({
    viewport: { width, height: 800 },
    deviceScaleFactor,
  });
  t.after(() => ctx.close());
  await ctx.route("**/*", async (route) => {
    const url = route.request().url();
    if (url === home)
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: html,
      });
    if (url === new URL("./stile.css", home).href)
      return route.fulfill({
        contentType: "text/css; charset=utf-8",
        body: css,
      });
    const fixtures = {
      "confronto.png": [960, 540],
      "campus-480.png": [480, 270],
      "campus-960.png": [960, 540],
      "ingresso-480.png": [480, 360],
    };
    const file = url.slice(new URL("./immagini/", home).href.length);
    if (
      url.startsWith(new URL("./immagini/", home).href) &&
      Object.hasOwn(fixtures, file)
    ) {
      const [width, height] = fixtures[file];
      const body = await require("sharp")({
        create: { width, height, channels: 3, background: "white" },
      })
        .png()
        .toBuffer();
      return route.fulfill({ contentType: "image/png", body });
    }
    return route.abort();
  });
  const p = await ctx.newPage();
  await p.goto(home);
  return p;
}
const rect = async (locator) =>
  locator.evaluate((el) => {
    const { x, y, width, height } = el.getBoundingClientRect();
    return { x, y, width, height };
  });

test("Dimensioni intrinseche: parola, frase e limiti di fit-content", async (t) => {
  const page = await pageFor(t, "Dimensionamento intrinseco in CSS");
  const parent = page.locator(".campione");
  const ch = (await rect(parent)).width / 10;
  for (const [available, fitted] of [
    [10, 10],
    [20, 15],
    [5, 7],
  ]) {
    await parent.evaluate(
      (el, n) => (el.style.inlineSize = n + "ch"),
      available,
    );
    for (const [cls, expected] of [
      [".minimo", 7],
      [".massimo", 15],
      [".adattato", fitted],
    ]) {
      assert.ok(
        Math.abs((await rect(page.locator(cls))).width - expected * ch) < 1,
        cls,
      );
    }
  }
  const min = page.locator(".minimo");
  await min.evaluate((el) => (el.style.whiteSpace = "nowrap"));
  assert.ok(Math.abs((await rect(min)).width - 15 * ch) < 1);
  await min.evaluate((el) => {
    el.style.whiteSpace = "normal";
    el.style.overflowWrap = "break-word";
  });
  assert.ok(Math.abs((await rect(min)).width - 7 * ch) < 1);
  await min.evaluate((el) => (el.style.overflowWrap = "anywhere"));
  assert.ok(Math.abs((await rect(min)).width - ch) < 1);
});

test("Overflow: distinguere il minimo del layout dal testo, con a capo o scorrimento locale", async (t) => {
  const name = "Diagnosticare overflow in Flexbox e Grid";
  const p = await pageFor(t, name, 360);
  const css = parseNote("Programmazione/HTML e CSS/Pagine/" + name + ".md")
    .tree.children.filter((n) => n.type === "code" && n.lang === "css")
    .map((n) => n.value);
  assert.equal(css.length, 4);
  const measures = () =>
    p.locator(".dati").evaluateAll((els) =>
      els.map((el) => ({
        item: el.clientWidth,
        content: el.scrollWidth,
        parent: el.parentElement.clientWidth,
        total: el.parentElement.scrollWidth,
      })),
    );
  for (const m of await measures()) {
    assert.equal(m.parent, 320);
    assert.ok(m.item > 224 && m.total > m.parent);
  }
  await p.addStyleTag({ content: css[1] });
  for (const m of await measures()) {
    assert.equal(m.item, 224);
    assert.ok(m.content > m.item && m.total > m.parent);
  }
  const wrap = await p.addStyleTag({ content: css[2] });
  for (const viewport of [360, 320]) {
    await p.setViewportSize({ width: viewport, height: 800 });
    for (const m of await measures()) {
      assert.equal(m.item, m.parent - 96);
      assert.equal(m.content, m.item);
      assert.equal(m.total, m.parent);
    }
  }
  await wrap.evaluate((el) => el.remove());
  await p.addStyleTag({ content: css[3] });
  for (const m of await measures()) {
    assert.ok(m.content > m.item);
    assert.equal(m.total, m.parent);
  }
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  const reachedEnd = await p.locator(".dati").evaluateAll((els) =>
    els.every((el) => {
      el.scrollLeft = el.scrollWidth;
      return (
        el.scrollLeft > 0 &&
        Math.abs(el.scrollLeft + el.clientWidth - el.scrollWidth) <= 1
      );
    }),
  );
  assert.equal(reachedEnd, true);
});

test("Selettore relazionale: la label segue la casella solo se la relazione corrisponde", async (t) => {
  const p = await pageFor(
    t,
    "Selettori relazionali e specificità in CSS",
    800,
    {
      section: "Evidenziare la voce che contiene una casella selezionata",
    },
  );
  const labels = p.locator("label");
  const colors = () =>
    labels.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).borderInlineStartColor),
    );
  const green = "rgb(20, 97, 59)",
    clear = "rgba(0, 0, 0, 0)";
  assert.deepEqual(await colors(), [green, clear]);
  const email = p.getByRole("checkbox", { name: "Email" }),
    recap = p.getByRole("checkbox", { name: "Riepilogo" });
  await email.focus();
  await p.keyboard.press("Space");
  await p.keyboard.press("Tab");
  await p.keyboard.press("Space");
  assert.deepEqual(await colors(), [clear, green]);
  await recap.evaluate((el) => {
    const span = document.createElement("span");
    el.replaceWith(span);
    span.append(el);
  });
  assert.equal(await recap.isChecked(), true);
  assert.deepEqual(await colors(), [clear, clear]);
  assert.deepEqual(
    await labels.evaluateAll((els) =>
      els.map((el) => el.matches(".opzione:has(input:checked)")),
    ),
    [false, true],
  );
});

test("Specificità: stessi elementi per is e where, ma due vincitori diversi", async (t) => {
  const p = await pageFor(
    t,
    "Selettori relazionali e specificità in CSS",
    800,
    { section: "Stessi titoli, due colori possibili" },
  );
  const title = p.getByRole("heading", { name: "Corso CSS" });
  assert.equal(await p.locator("#archivio").count(), 0);
  assert.equal(
    await title.evaluate((el) => getComputedStyle(el).color),
    "rgb(22, 61, 112)",
  );
  const comparison = await title.evaluate((el) => {
    const rule = document.styleSheets[0].cssRules[0],
      original = rule.selectorText;
    rule.selectorText = original.replace(":is(", ":where(");
    return [
      el.matches(original),
      el.matches(rule.selectorText),
      getComputedStyle(el).color,
    ];
  });
  assert.deepEqual(comparison, [true, true, "rgb(146, 59, 21)"]);
});

test("Dialogo modale: focus, sfondo inerte e conferma distinta dall'annullamento", async (t) => {
  const p = await pageFor(t, "Dialoghi e popover nativi in HTML", 800, {
    section: "Confermare una modifica con un dialogo",
  });
  const dialog = p.getByRole("dialog", { name: "Azzerare i filtri?" });
  const filtro = p.getByRole("checkbox", { name: "Solo disponibili" });
  await p.locator("#conferma").evaluate((el) => {
    el.dataset.chiusure = "0";
    el.addEventListener("close", () => {
      el.dataset.chiusure = String(Number(el.dataset.chiusure) + 1);
    });
  });
  await p.keyboard.press("Tab");
  for (const [i, esito] of ["azzera", "", "annulla"].entries()) {
    assert.equal(await p.locator("#apri:focus").count(), 1);
    await p.keyboard.press("Enter");
    await dialog.waitFor();
    assert.ok(await dialog.evaluate((el) => el.matches(":modal")));
    await p.locator("#disponibili").evaluate((el) => el.focus());
    assert.equal(
      await p.evaluate(() => document.activeElement.value),
      "annulla",
    );
    if (esito === "azzera") await p.keyboard.press("Tab");
    await p.keyboard.press(esito === "" ? "Escape" : "Enter");
    await p.waitForFunction(
      (n) => document.querySelector("#conferma").dataset.chiusure === String(n),
      i + 1,
    );
    assert.equal(await dialog.isVisible(), false);
    assert.equal(
      await p.locator("#conferma").evaluate((el) => el.returnValue),
      esito,
    );
    assert.equal(await filtro.isChecked(), esito !== "azzera");
    assert.equal(await p.locator("#apri:focus").count(), 1);
    if (esito === "azzera") {
      await filtro.check();
      await p.locator("#apri").focus();
    }
  }
});

test("Popover: apertura da tastiera, ritorno del focus e clic esterno", async (t) => {
  const p = await pageFor(t, "Dialoghi e popover nativi in HTML", 800, {
    section: "Mostrare un aiuto con un popover",
  });
  const apri = p.getByRole("button", { name: "Come si calcola il totale?" });
  const chiudi = p.getByRole("button", { name: "Chiudi spiegazione" });
  const pannello = p.locator("#aiuto:popover-open");
  await p.keyboard.press("Tab");
  for (const tasto of ["Escape", "Enter"]) {
    assert.ok(await apri.evaluate((el) => el.matches(":focus")));
    await p.keyboard.press("Enter");
    await pannello.waitFor();
    assert.ok(await apri.evaluate((el) => el.matches(":focus")));
    await p.keyboard.press("Tab");
    assert.ok(await chiudi.evaluate((el) => el.matches(":focus")));
    await p.keyboard.press(tasto);
    await pannello.waitFor({ state: "hidden" });
    assert.ok(await apri.evaluate((el) => el.matches(":focus")));
  }
  await p.keyboard.press("Enter");
  await pannello.waitFor();
  const spedizione = p.getByRole("checkbox", { name: "Includi spedizione" });
  await spedizione.click();
  await pannello.waitFor({ state: "hidden" });
  assert.ok(await spedizione.isChecked());
});

test("Markup HTML: recupero del paragrafo e associazione effettiva della label", async (t) => {
  for (const [section, corretto] of [
    ["Prova con un documento errato", false],
    ["Ripeti con il documento corretto", true],
  ]) {
    const p = await pageFor(t, "Validare il markup HTML", 800, { section });
    const elenco = p.getByRole("list");
    assert.ok(
      await elenco.evaluate(
        (el) => el.previousElementSibling?.localName === "p",
      ),
    );
    assert.equal(await p.locator("body > p:empty").count(), corretto ? 0 : 1);
    const label = p.locator("label");
    assert.equal(
      await label.evaluate((el) => el.control?.id ?? null),
      corretto ? "dettagli" : null,
    );
    const casella = p.getByRole("checkbox");
    assert.equal(await casella.isChecked(), false);
    await label.click();
    assert.equal(await casella.isChecked(), corretto);
  }
});

test("Stylelint: l'eccezione per il widget cambia la cascata solo in stampa", async (t) => {
  const p = await pageFor(t, "Analizzare i fogli CSS con Stylelint", 800, {
    section: "Limitare un'eccezione a una dichiarazione",
    fixture:
      '<div class="ricevuta-widget" style="box-shadow: 0 1px 4px black">Ricevuta</div>',
  });
  const widget = p.getByText("Ricevuta");
  const ombra = () => widget.evaluate((el) => getComputedStyle(el).boxShadow);
  const inline = await ombra();
  assert.notEqual(inline, "none");
  await p.emulateMedia({ media: "print" });
  assert.equal(await ombra(), "none");
  await p.emulateMedia({ media: "screen" });
  assert.equal(await ombra(), inline);
});

async function sostituisciNelFoglioDiProva(p, originale, sostituzione) {
  const url = new URL("./stile.css", home).href;
  const css = await p.evaluate(async (u) => (await fetch(u)).text(), url);
  assert.ok(css.includes(originale), originale);
  await p.route(url, (route) =>
    route.fulfill({
      contentType: "text/css; charset=utf-8",
      body: css.replace(originale, sostituzione),
    }),
  );
  await p.reload();
}

const notaSupports = "Fallback CSS e miglioramento progressivo con supports";
test("Fallback: una funzione colore sconosciuta non elimina il bordo di base", async (t) => {
  const p = await pageFor(t, notaSupports, 600, {
    section: "Un solo valore: bastano due dichiarazioni",
    fixture: '<p class="avviso">Avviso</p>',
  });
  const bordo = () =>
    p.locator(".avviso").evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.borderLeftWidth, s.borderLeftStyle, s.borderLeftColor];
    });
  const [larghezza, stile, colore] = await bordo();
  assert.deepEqual([larghezza, stile], ["4px", "solid"]);
  assert.match(colore, /^oklch\(/);
  await sostituisciNelFoglioDiProva(p, "oklch(", "colore-inesistente(");
  assert.deepEqual(await bordo(), ["4px", "solid", "rgb(25, 105, 78)"]);
});

test("Feature query: una colonna per poco spazio o per mancato supporto", async (t) => {
  for (const scenario of ["ampio", "stretto", "senza griglia"]) {
    const p = await pageFor(
      t,
      notaSupports,
      scenario === "stretto" ? 240 : 600,
      {
        section: "Più regole insieme: un indice che resta navigabile",
      },
    );
    if (scenario === "senza griglia") {
      await sostituisciNelFoglioDiProva(
        p,
        "(display: grid)",
        "(display: valore-inesistente)",
      );
    }
    const nav = p.getByRole("navigation", { name: "In questa pagina" });
    assert.equal(
      await nav.evaluate((el) => getComputedStyle(el).display),
      scenario === "senza griglia" ? "block" : "grid",
    );
    const primo = nav.getByRole("link", { name: "Materiali" });
    const secondo = nav.getByRole("link", { name: "Procedura" });
    const a = await rect(primo),
      b = await rect(secondo);
    if (scenario === "ampio") {
      assert.equal(a.y, b.y);
      assert.ok(b.x >= a.x + a.width);
    } else {
      assert.ok(b.y >= a.y + a.height);
    }
    await p.keyboard.press("Tab");
    assert.ok(await primo.evaluate((el) => el.matches(":focus")));
    await p.keyboard.press("Tab");
    assert.ok(await secondo.evaluate((el) => el.matches(":focus")));
    await p.keyboard.press("Enter");
    await p.waitForURL(home + "#procedura");
    assert.equal(await p.locator(":target").innerText(), "Procedura");
  }
});

const esempioFont = (t) =>
  pageFor(t, "Web font e stabilità del layout", 420, {
    section: "Esempio: il controllo sotto al testo",
  });

test("Web font non disponibile: il fallback lascia gli orari accessibili da tastiera", async (t) => {
  const p = await esempioFont(t);
  const stato = await p.evaluate(async () => {
    await document.fonts.ready;
    return Array.from(document.fonts, (face) => face.status);
  });
  assert.deepEqual(stato, ["error"]);
  assert.ok(await p.locator(".ritiro").isVisible());
  await p.keyboard.press("Tab");
  assert.equal(await p.locator("summary:focus").count(), 1);
  await p.keyboard.press("Enter");
  assert.ok(
    await p.getByText("Dal lunedì al venerdì", { exact: false }).isVisible(),
  );
});

test("Web font in ritardo: cambiano le righe, non l'interlinea", async (t) => {
  const p = await esempioFont(t);
  const bytes = await readFile(
    new URL(
      "./fixtures/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2",
      import.meta.url,
    ),
  );
  const gate = Promise.withResolvers();
  await p.route(
    "**/font/ibm-plex-mono-latin-400-normal.woff2",
    async (route) => {
      await gate.promise;
      await route.fulfill({ contentType: "font/woff2", body: bytes });
    },
  );
  const misura = () =>
    p.evaluate(() => {
      const testo = document.querySelector(".ritiro");
      return {
        h: testo.getBoundingClientRect().height,
        top: document.querySelector("summary").getBoundingClientRect().top,
        riga: parseFloat(getComputedStyle(testo).lineHeight),
      };
    });
  let prima, mono;
  try {
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForFunction(() =>
      [...document.fonts].some((f) => f.status === "loading"),
    );
    prima = await misura();
    await p.locator(".ritiro").evaluate((el) => {
      el.style.fontFamily = '"Plex prova", monospace';
    });
    mono = await misura();
    await p
      .locator(".ritiro")
      .evaluate((el) => el.style.removeProperty("font-family"));
    assert.deepEqual(await misura(), prima);
  } finally {
    gate.resolve();
  }
  const stato = await p.evaluate(async () => {
    await document.fonts.ready;
    return Array.from(document.fonts, (face) => face.status);
  });
  assert.deepEqual(stato, ["loaded"]);
  const dopo = await misura();
  assert.equal(dopo.riga, prima.riga);
  assert.ok(dopo.h - prima.h >= prima.riga);
  assert.equal(dopo.top - prima.top, dopo.h - prima.h);
  assert.ok(Math.abs(dopo.top - mono.top) < Math.abs(dopo.top - prima.top));
  t.diagnostic(
    `Righe nel campione: fallback proporzionale ${prima.h / prima.riga}, monospace ${mono.h / mono.riga}, WOFF2 ${dopo.h / dopo.riga}. Spostamento: ${dopo.top - prima.top} px.`,
  );
});

const paginaVerifica = (t) =>
  pageFor(t, "Verificare una pagina con browser e tecnologie assistive");

test("Confronto browser: aprire, selezionare, richiudere e raggiungere le informazioni", async (t) => {
  const p = await paginaVerifica(t);
  t.diagnostic(browser.browserType().name() + " " + browser.version());
  assert.equal(await p.title(), "Preferenze di lettura");
  assert.equal(
    await p
      .getByRole("heading", { level: 1, name: "Preferenze di lettura" })
      .count(),
    1,
  );
  const summary = p.locator("summary"),
    scelta = p.getByRole("checkbox", { name: "Includi le note a margine" });
  const link = p.getByRole("link", { name: "Informazioni sulle preferenze" });
  async function focusDopo(tasto, controllo) {
    await p.keyboard.press(tasto);
    assert.ok(await controllo.evaluate((el) => el === document.activeElement));
  }
  await focusDopo("Tab", summary);
  await focusDopo("Tab", link);
  await focusDopo("Shift+Tab", summary);
  await p.keyboard.press("Enter");
  await focusDopo("Tab", scelta);
  assert.equal(await scelta.isChecked(), false);
  await p.keyboard.press("Space");
  assert.equal(await scelta.isChecked(), true);
  await focusDopo("Shift+Tab", summary);
  await focusDopo("Enter", summary);
  assert.equal(await p.locator("details").evaluate((el) => el.open), false);
  await focusDopo("Tab", link);
  await p.keyboard.press("Enter");
  await p.waitForURL(home + "#informazioni");
  assert.equal(await p.locator(":target").innerText(), "Informazioni");
});

test("Confronto browser: etichetta scollegata e casella ancora attivabile", async (t) => {
  const p = await paginaVerifica(t);
  await p.locator("summary").click();
  const label = p.getByText("Includi le note a margine", { exact: true });
  const casella = p.getByRole("checkbox");
  await label.click();
  assert.equal(await casella.isChecked(), true);
  await label.evaluate((el) => (el.htmlFor = "inesistente"));
  assert.equal(await label.evaluate((el) => el.control), null);
  assert.equal(
    await p.getByRole("checkbox", { name: "", exact: true }).count(),
    1,
  );
  await label.click();
  assert.equal(await casella.isChecked(), true);
  await casella.focus();
  await p.keyboard.press("Space");
  assert.equal(await casella.isChecked(), false);
});

const memo = (t, name, options = {}) =>
  pageFor(t, "HTML e CSS - " + name, 800, { promemoria: true, ...options });

test("Promemoria documento: metadati, immagine e intestazioni della tabella", async (t) => {
  const load = (section) =>
    memo(t, "Documento immagini e tabelle", { section });
  const doc = await load("Avviare una pagina");
  assert.equal(await doc.title(), "Catalogo corsi");
  assert.deepEqual(
    await doc.evaluate(() => [
      document.documentElement.lang,
      document.styleSheets[0].href,
    ]),
    ["it", new URL("./stile.css", home).href],
  );
  const img = (await load("Inserire un'immagine informativa")).getByRole(
    "img",
    { name: /tre colonne/ },
  );
  assert.equal(await img.evaluate((el) => el.naturalWidth), 960);
  const tab = (await load("Dare un nome a righe e colonne")).getByRole(
    "table",
    { name: "Posti disponibili" },
  );
  assert.deepEqual(await tab.getByRole("columnheader").allTextContents(), [
    "Corso",
    "Posti",
  ]);
  assert.equal(await tab.getByRole("rowheader").textContent(), "CSS");
});

test("Promemoria moduli: ricerca, opzioni radio e apertura nativa", async (t) => {
  const load = (section) => memo(t, "Moduli e controlli nativi", { section });
  const search = await load("Inviare una ricerca"),
    form = search.locator("form");
  assert.equal(await form.evaluate((f) => f.checkValidity()), false);
  await search
    .getByRole("searchbox", { name: "Cerca negli appunti" })
    .fill("grid");
  assert.deepEqual(await form.evaluate((f) => [...new FormData(f)]), [
    ["q", "grid"],
  ]);
  const choices = await load("Raccogliere una scelta esclusiva");
  const group = choices.getByRole("group", { name: "Modalità" });
  await group.evaluate((el) => {
    const f = document.createElement("form");
    el.replaceWith(f);
    f.append(el);
  });
  await group.getByRole("radio", { name: "In aula" }).check();
  await group.getByRole("radio", { name: "Online" }).check();
  assert.deepEqual(
    await choices.locator("form").evaluate((f) => [...new FormData(f)]),
    [["modalita", "online"]],
  );
  const details = await load("Mostrare dettagli senza JavaScript");
  await details.keyboard.press("Tab");
  await details.keyboard.press("Enter");
  assert.equal(
    await details.locator("details").evaluate((el) => el.open),
    true,
  );
});

test("Promemoria box e cascata: dimensioni, inline-block e tema locale", async (t) => {
  const p = await memo(t, "Box testo e cascata", {
    fixture:
      '<div class="catalogo testo"><span class="sigla">CSS</span><p class="avviso">Avviso</p></div>',
  });
  const text = p.locator(".testo"),
    warn = p.locator(".avviso");
  assert.deepEqual(
    await text.evaluate((e) => [
      getComputedStyle(e).boxSizing,
      getComputedStyle(e).lineHeight,
    ]),
    ["border-box", "24px"],
  );
  assert.equal((await rect(p.locator(".sigla"))).width, 80);
  assert.equal(
    await warn.evaluate((e) => getComputedStyle(e).color),
    "rgb(135, 40, 0)",
  );
  await text.evaluate((e) => e.style.setProperty("--inchiostro", "#125544"));
  assert.equal(
    await warn.evaluate((e) => getComputedStyle(e).color),
    "rgb(18, 85, 68)",
  );
});

test("Promemoria layout: a capo, numero di tracce e soglie di viewport e contenitore", async (t) => {
  const pair = "<div>Uno</div><div>Due</div>";
  const p = await memo(t, "Flexbox Grid e layout responsive", {
    fixture:
      '<div class="azioni" style="width:4rem"><button>Apri</button><button>Chiudi</button></div>' +
      '<div class="elenco" style="width:32rem">' +
      pair +
      '</div><div class="pagina">' +
      pair +
      "</div>" +
      '<div class="spazio" style="width:448px"><div class="scheda">' +
      pair +
      "</div></div>",
  });
  const columns = (cls) =>
    p
      .locator(cls)
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
  const buttons = p.locator("button");
  assert.ok((await rect(buttons.last())).y > (await rect(buttons.first())).y);
  assert.equal(await columns(".elenco"), 2);
  assert.equal(await columns(".pagina"), 2);
  assert.equal(await columns(".scheda"), 2);
  await p.locator(".spazio").evaluate((e) => (e.style.width = "447px"));
  assert.equal(await columns(".scheda"), 1);
  await p.setViewportSize({ width: 600, height: 800 });
  assert.equal(await columns(".pagina"), 1);
});

test("Promemoria posizione: riferimento, bordo sticky e velo che non intercetta il click", async (t) => {
  const p = await memo(t, "Posizione e sovrapposizione", {
    fixture:
      '<div class="pannello"><span class="stato">OK</span></div>' +
      '<div class="risultati"><div class="intestazione">Indice</div><p style="height:40rem">Testo</p></div>' +
      '<div class="anteprima"><button>Apri</button><span class="velo"></span></div>',
  });
  const a = await rect(p.locator(".pannello")),
    b = await rect(p.locator(".stato"));
  assert.equal(b.y - a.y, 8);
  assert.equal(a.x + a.width - b.x - b.width, 12);
  const title = p.locator(".intestazione"),
    start = (await rect(title)).y;
  await p.locator(".risultati").evaluate((e) => (e.scrollTop = 80));
  assert.equal((await rect(title)).y, start);
  const btn = p.locator("button");
  assert.equal(
    await btn.evaluate((e) => {
      const b = e.getBoundingClientRect();
      return (
        document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) === e
      );
    }),
    true,
  );
  assert.equal(
    await p.locator(".velo").evaluate((e) => getComputedStyle(e).zIndex),
    "1",
  );
});

test("Promemoria interazione: tastiera, decorazione e preferenza di movimento", async (t) => {
  const p = await memo(t, "Focus decorazioni e movimento", {
    fixture:
      '<a class="azione voce" href="#corso">Vai al corso</a><h2 class="titolo" id="corso">Corso</h2><details class="istruzioni"><summary>Apri</summary><p>Leggi il corso.</p></details>',
  });
  const a = p.locator("a"),
    body = p.locator("details p");
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.keyboard.press("Tab");
  assert.deepEqual(
    await a.evaluate((e) => {
      const s = getComputedStyle(e);
      return [s.outlineWidth, s.color, s.transitionDuration];
    }),
    ["3px", "rgb(0, 90, 117)", "0s"],
  );
  assert.equal(
    await p
      .locator("h2")
      .evaluate((e) => getComputedStyle(e, "::after").borderBlockStartWidth),
    "2px",
  );
  await p.keyboard.press("Tab");
  await p.keyboard.press("Enter");
  assert.equal(await body.isVisible(), true);
  assert.equal(
    await body.evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await p.emulateMedia({ reducedMotion: "no-preference" });
  assert.equal(
    await body.evaluate((e) => getComputedStyle(e).animationName),
    "entra",
  );
  assert.equal(
    await a.evaluate((e) => getComputedStyle(e).transitionDuration),
    "0.18s",
  );
});

test("Documento: modalità standard, lingua, titolo e foglio relativo alla pagina", async (t) => {
  const p = await pageFor(t, "Struttura di un documento HTML");
  assert.equal(await p.title(), "Catalogo degli appunti");
  assert.deepEqual(
    await p.evaluate(() => [
      document.compatMode,
      document.documentElement.lang,
      document.styleSheets[0].href,
      getComputedStyle(document.body).lineHeight,
    ]),
    ["CSS1Compat", "it", new URL("stile.css", home).href, "24px"],
  );
});
test("Navigazione: il secondo link si raggiunge da tastiera e punta a un titolo esistente", async (t) => {
  const p = await pageFor(t, "HTML semantico e navigazione");
  assert.equal(
    await p.getByRole("navigation", { name: "Argomenti" }).count(),
    1,
  );
  await p.keyboard.press("Tab");
  await p.keyboard.press("Tab");
  assert.equal(await p.locator(":focus").innerText(), "CSS");
  await p.keyboard.press("Enter");
  await p.waitForURL(home + "#css");
  assert.equal(await p.locator(":target").innerText(), "CSS");
});
test("Immagine: alternativa testuale e riduzione proporzionale nella colonna", async (t) => {
  const p = await pageFor(t, "Immagini e alternative testuali", 320);
  const img = p.getByRole("img", { name: /tre colonne/ });
  assert.equal(await img.evaluate((el) => el.naturalWidth), 960);
  const { width, height } = await rect(img);
  assert.ok(width > 0 && width < 320);
  assert.ok(Math.abs(height - (width * 540) / 960) < 1);
});
test("Form: label, required e invio della chiave name, non dell'id", async (t) => {
  const p = await pageFor(t, "Moduli HTML nativi"),
    field = p.getByRole("searchbox", { name: "Argomento" });
  assert.equal(await field.evaluate((el) => el.validity.valueMissing), true);
  await field.fill("box model");
  assert.equal(
    await p
      .locator("form")
      .evaluate((form) => new URLSearchParams(new FormData(form)).toString()),
    "q=box+model",
  );
  assert.equal(await field.evaluate((el) => el.form.checkValidity()), true);
});
test("Cascata: specificità sul titolo, colore ereditato ma bordo non ereditato", async (t) => {
  const p = await pageFor(t, "Selettori, cascata ed ereditarietà");
  assert.deepEqual(
    await p.evaluate(() => [
      getComputedStyle(document.querySelector("h2")).color,
      getComputedStyle(document.querySelector("p")).color,
      getComputedStyle(document.querySelector("p")).borderTopStyle,
    ]),
    ["rgb(20, 62, 104)", "rgb(37, 70, 49)", "none"],
  );
});
test("Box: 276px con content-box, 240px con border-box", async (t) => {
  const p = await pageFor(t, "Box model e dimensionamento"),
    box = p.locator(".misura");
  assert.equal((await rect(box)).width, 276);
  await box.evaluate((el) => (el.style.boxSizing = "border-box"));
  assert.equal((await rect(box)).width, 240);
});
test("Flexbox: il link chiude la riga e va a capo se manca spazio", async (t) => {
  const p = await pageFor(t, "Layout con Flexbox"),
    bar = p.locator(".barra"),
    link = bar.locator("a");
  const container = await rect(bar),
    item = await rect(link);
  assert.ok(Math.abs(container.x + container.width - item.x - item.width) < 1);
  await bar.evaluate((el) => (el.style.width = "160px"));
  assert.ok((await rect(link)).y > (await rect(bar.locator("strong"))).y);
});
test("Grid: a 460px una traccia, a 480px due tracce da 232px", async (t) => {
  const p = await pageFor(t, "Layout con CSS Grid"),
    grid = p.locator(".catalogo");
  for (const [w, tracks] of [
    [460, "460px"],
    [480, "232px 232px"],
  ]) {
    assert.equal(
      await grid.evaluate((el, w) => {
        el.style.width = w + "px";
        return getComputedStyle(el).gridTemplateColumns;
      }, w),
      tracks,
    );
  }
});
test("Responsive: ordine conservato e nessun overflow a 320px e ai lati del breakpoint", async (t) => {
  const p = await pageFor(t, "Layout responsive e media query", 320),
    nav = p.locator("nav"),
    main = p.locator("main");
  await main
    .locator("p")
    .evaluate((el) => (el.textContent = "documentazione".repeat(30)));
  for (const width of [320, 767, 768, 1200]) {
    await p.setViewportSize({ width, height: 800 });
    const a = await rect(nav),
      b = await rect(main);
    assert.ok(width < 768 ? b.y > a.y : b.x > a.x);
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
  }
});

test("Tabella: didascalia e due intestazioni per il dato del pomeriggio", async (t) => {
  const p = await pageFor(t, "Tabelle dati accessibili in HTML");
  const tabella = p.getByRole("table", {
    name: "Posti disponibili per laboratorio e turno",
  });
  assert.deepEqual(await tabella.getByRole("columnheader").allTextContents(), [
    "Laboratorio",
    "Mattina",
    "Pomeriggio",
  ]);
  assert.deepEqual(await tabella.getByRole("rowheader").allTextContents(), [
    "HTML",
    "CSS",
  ]);
  const cella = tabella.getByRole("cell", { name: "6", exact: true });
  assert.deepEqual(
    await cella.evaluate((td) => {
      const row = td.parentElement.querySelector('th[scope="row"]');
      const col = td.closest("table").tHead.rows[0].cells[td.cellIndex];
      return [row.textContent, col.scope, col.textContent];
    }),
    ["HTML", "col", "Pomeriggio"],
  );
});

test("Tipografia: rem, em e interlinea scalano e il testo va a capo senza tagli", async (t) => {
  const p = await pageFor(t, "Tipografia e spaziatura in CSS", 320);
  const dimensions = () =>
    p.locator(".estratto").evaluate((el) => {
      const title = getComputedStyle(el.querySelector("h2"));
      const body = getComputedStyle(el.querySelector("p"));
      return [title.fontSize, body.fontSize, body.lineHeight];
    });
  assert.deepEqual(await dimensions(), ["24px", "16px", "24px"]);
  const before = await rect(p.locator(".estratto"));
  await p.addStyleTag({
    content:
      "html { font-size: 20px } .estratto p { letter-spacing: 0.12em; word-spacing: 0.16em; }",
  });
  assert.deepEqual(await dimensions(), ["30px", "20px", "30px"]);
  assert.ok((await rect(p.locator(".estratto"))).height > before.height);
  assert.equal(
    await p
      .locator(".estratto p")
      .evaluate(
        (el) =>
          el.scrollHeight <= el.clientHeight &&
          el.scrollWidth <= el.clientWidth,
      ),
    true,
  );
});

test("Contrasto: rapporto della coppia effettiva e stato comprensibile senza il colore", async (t) => {
  const p = await pageFor(t, "Colori e contrasto del testo");
  const msg = p.locator(".esito");
  const ratio = () =>
    msg.evaluate((el) => {
      const luminance = (rgb) => {
        const [r, g, b] = rgb
          .match(/\d+/g)
          .map(Number)
          .map((n) => n / 255)
          .map((n) =>
            n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
          );
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const cs = getComputedStyle(el);
      const a = luminance(cs.color),
        b = luminance(cs.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  assert.ok(Math.abs((await ratio()) - 7) < 0.02);
  await msg.evaluate((el) => (el.style.color = "#777777"));
  assert.ok(Math.abs((await ratio()) - 4.48) < 0.01);
  await p.addStyleTag({
    content: ".esito { border: 0; color: black !important; }",
  });
  assert.match(await msg.innerText(), /^Da correggere: manca il titolo/);
});

test("Focus: hover senza focus, selezione persistente e reset da tastiera", async (t) => {
  const p = await pageFor(t, "Focus visibile e stati interattivi");
  const box = p.getByRole("checkbox", {
    name: "Ricevi il riepilogo settimanale",
  });
  const button = p.getByRole("button", { name: "Ripristina preferenze" });
  await button.hover();
  assert.deepEqual(
    await button.evaluate((el) => [
      el.matches(":focus"),
      getComputedStyle(el).textDecorationLine,
    ]),
    [false, "underline"],
  );
  await p.keyboard.press("Tab");
  assert.deepEqual(
    await box.evaluate((el) => [
      el.matches(":focus-visible"),
      getComputedStyle(el).outlineWidth,
      getComputedStyle(el).outlineStyle,
    ]),
    [true, "3px", "solid"],
  );
  await p.keyboard.press("Space");
  assert.equal(await box.isChecked(), true);
  await p.keyboard.press("Tab");
  assert.equal(
    await button.evaluate((el) => el.matches(":focus-visible")),
    true,
  );
  assert.equal(await box.isChecked(), true);
  await p.keyboard.press("Enter");
  assert.equal(await box.isChecked(), false);
  await p.keyboard.press("Shift+Tab");
  assert.equal(await box.evaluate((el) => el.matches(":focus-visible")), true);
});

test("Position: riferimento locale, inset logici e spazio lasciato nel flusso", async (t) => {
  const p = await pageFor(t, "Posizionamento relativo e assoluto in CSS");
  const card = p.locator(".scheda"),
    label = p.locator(".stato"),
    next = p.locator(".scheda + p");
  const c = await rect(card),
    a = await rect(label),
    n = await rect(next);
  assert.equal(a.y - c.y, 2 + 8);
  assert.equal(c.x + c.width - a.x - a.width, 2 + 12);
  await card.evaluate((el) => (el.dir = "rtl"));
  assert.equal((await rect(label)).x - c.x, 2 + 12);
  await card.evaluate((el) => {
    el.dir = "ltr";
    el.style.top = "16px";
  });
  assert.equal((await rect(label)).y, a.y + 16);
  assert.equal((await rect(next)).y, n.y);
  await card.evaluate((el) => (el.style.position = "static"));
  const initial = await rect(label);
  assert.equal(initial.y, 8);
  assert.equal(initial.x + initial.width, 800 - 12);
  await card.evaluate((el) => {
    el.style.position = "relative";
    el.style.top = "";
  });
  await label.evaluate((el) => (el.style.position = "static"));
  assert.ok((await rect(next)).y > n.y);
});

test("Sticky: il primo titolo si ferma e poi cede il posto; senza inset scorre", async (t) => {
  const p = await pageFor(t, "Posizionamento sticky e fixed in CSS");
  const panel = p.locator(".calendario"),
    titles = panel.locator("h3");
  const start = (await rect(titles.first())).y;
  const scroll = (top) =>
    panel.evaluate((el, top) => {
      el.scrollTop = top;
    }, top);
  await scroll(48);
  assert.equal((await rect(titles.first())).y, start);
  await titles.first().evaluate((el) => (el.style.insetBlockStart = "auto"));
  assert.equal((await rect(titles.first())).y, start - 48);
  await titles.first().evaluate((el) => (el.style.insetBlockStart = ""));
  await panel.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const first = await rect(titles.first()),
    second = await rect(titles.last());
  assert.ok(first.y + first.height <= start);
  assert.equal(second.y, start);
});

test("Fixed: il riferimento passa dalla finestra al blocco trasformato", async (t) => {
  const p = await pageFor(t, "Posizionamento sticky e fixed in CSS");
  const link = p.locator(".torna");
  await p.addStyleTag({
    content: "body { min-height: 200vh; position: relative; }",
  });
  const start = await rect(link);
  await p.evaluate(() => window.scrollTo(0, 120));
  assert.equal(await p.evaluate(() => scrollY), 120);
  assert.deepEqual(await rect(link), start);
  await p.addStyleTag({ content: "body { transform: translateY(0); }" });
  const captured = await rect(link);
  await p.evaluate(() => window.scrollTo(0, 220));
  assert.equal((await rect(link)).y, captured.y - 100);
});

test("Z-index: 999 resta sotto 2 finché il genitore crea un contesto", async (t) => {
  const p = await pageFor(t, "Z-index e contesti di sovrapposizione");
  const label = p.locator(".etichetta"),
    parent = p.locator(".anteprima");
  const a = await rect(label),
    b = await rect(p.locator(".strumenti"));
  const point = [a.x + a.width / 2, a.y + a.height / 2];
  assert.ok(
    point[0] > b.x &&
      point[0] < b.x + b.width &&
      point[1] > b.y &&
      point[1] < b.y + b.height,
  );
  for (const [level, front] of [
    ["1", "strumenti"],
    ["0", "strumenti"],
    ["auto", "etichetta"],
  ]) {
    await parent.evaluate((el, value) => (el.style.zIndex = value), level);
    assert.deepEqual(await rect(label), a);
    assert.equal(
      await p.evaluate(
        ([x, y]) => document.elementFromPoint(x, y).className,
        point,
      ),
      front,
    );
  }
});

test("Custom properties: override locale, ereditarietà, fallback e tipo incompatibile", async (t) => {
  const p = await pageFor(t, "Proprietà personalizzate e var in CSS");
  const colors = () =>
    p
      .locator(".etichetta")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
  const green = "rgb(20, 83, 45)",
    blue = "rgb(29, 78, 216)";
  const setToken = (selector, value) =>
    p.evaluate(
      ([selector, value]) => {
        const rule = [...document.styleSheets[0].cssRules].find(
          (r) => r.selectorText === selector,
        );
        rule.style.setProperty("--accento", value);
      },
      [selector, value],
    );
  assert.deepEqual(await colors(), [green, "rgb(154, 52, 18)"]);
  await setToken(".bozze", "");
  assert.deepEqual(await colors(), [green, green]);
  await setToken(".catalogo", "");
  assert.deepEqual(await colors(), [blue, blue]);
  await setToken(".catalogo", "#14532d");
  await setToken(".bozze", "12px");
  assert.deepEqual(await colors(), [green, "rgb(34, 34, 34)"]);
});

test("Layer: precedenza prima della specificità, regole fuori layer e ordine invertito per important", async (t) => {
  const p = await pageFor(t, "Livelli della cascata con layer");
  const color = () =>
    p.locator(".stato").evaluate((el) => getComputedStyle(el).color);
  const green = "rgb(20, 83, 45)",
    gray = "rgb(51, 65, 85)";
  assert.equal(await color(), green);
  const css = await p.evaluate(() => {
    const sheet = document.styleSheets[0];
    const text = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
    sheet.disabled = true;
    return text;
  });
  const check = async (rules, expected) => {
    const style = await p.addStyleTag({ content: rules });
    assert.equal(await color(), expected);
    await style.evaluate((el) => el.remove());
  };
  await check(css.replace("@layer base, tema;", "@layer tema, base;"), gray);
  await check(css + ".stato { color: #9a3412; }", "rgb(154, 52, 18)");
  const important = css.replace(/(color:[^;}]+);/g, "$1 !important;");
  await check(important + ".stato { color: #9a3412 !important; }", gray);
});

test("Container query: due layout nella stessa viewport e soglia inclusiva sul contenitore", async (t) => {
  const p = await pageFor(t, "Container query per componenti responsive");
  const slots = p.locator(".slot");
  const columns = () =>
    p
      .locator(".scheda")
      .evaluateAll((els) =>
        els.map(
          (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
        ),
      );
  assert.deepEqual(await columns(), [2, 1]);
  for (const [width, count] of [
    [447, 1],
    [448, 2],
  ]) {
    await slots
      .first()
      .evaluate((el, width) => (el.style.inlineSize = width + "px"), width);
    assert.deepEqual(await columns(), [count, 1]);
    assert.equal(await p.evaluate(() => innerWidth), 800);
  }
  await slots.first().evaluate((el) => (el.style.inlineSize = ""));
  await p.setViewportSize({ width: 320, height: 800 });
  assert.deepEqual(await columns(), [1, 1]);
});

test("Flusso: lo span cambia riga e larghezza; i margini dei fratelli collassano solo nel layout a blocchi della prova", async (t) => {
  const p = await pageFor(t, "Flusso normale e display in CSS");
  const label = p.locator(".stato"),
    tail = p.locator(".seguito");
  let a = await rect(label),
    b = await rect(tail);
  assert.ok(a.width > 0 && a.width < 120 && b.x >= a.x + a.width);
  assert.equal(a.y, b.y);
  await label.evaluate((el) => (el.style.display = "inline-block"));
  a = await rect(label);
  b = await rect(tail);
  assert.equal(a.width, 120);
  assert.ok(b.x >= a.x + a.width && b.y < a.y + a.height);
  await label.evaluate((el) => (el.style.display = "block"));
  a = await rect(label);
  b = await rect(tail);
  assert.equal(a.width, 120);
  assert.ok(b.y >= a.y + a.height);
  await label.evaluate((el) => (el.style.display = ""));
  const gap = async () => {
    const first = await rect(p.locator(".prima")),
      second = await rect(p.locator(".seconda"));
    return second.y - first.y - first.height;
  };
  assert.equal(await gap(), 24);
  await p
    .locator(".appunto")
    .evaluate((el) => (el.style.display = "flow-root"));
  assert.equal(await gap(), 24);
  await p.locator(".appunto").evaluate((el) => (el.style.display = "grid"));
  assert.equal(await gap(), 40);
});

test("Iscrizione: nomi accessibili, vincoli e sole coppie effettivamente scelte", async (t) => {
  const p = await pageFor(t, "Moduli HTML nativi", 800, {
    section: "Esempio: iscrizione con scelte esclusive",
  });
  const group = p.getByRole("group", { name: "Modalità di frequenza" });
  const email = p.getByRole("textbox", { name: "Email di conferma" });
  const turno = p.getByRole("combobox", { name: "Turno" });
  const aula = group.getByRole("radio", { name: "In aula" }),
    online = group.getByRole("radio", { name: "Online" });
  const valid = () => p.locator("form").evaluate((f) => f.checkValidity());
  assert.equal(await email.getAttribute("autocomplete"), "email");
  assert.equal(await online.evaluate((el) => el.validity.valueMissing), true);
  assert.equal(await turno.evaluate((el) => el.validity.valueMissing), true);
  await email.fill("persona@example.org");
  await aula.check();
  await online.check();
  assert.equal(await aula.isChecked(), false);
  assert.equal(await valid(), false);
  await turno.selectOption({ label: "Pomeriggio" });
  assert.equal(await valid(), true);
  assert.deepEqual(
    await p.locator("form").evaluate((f) => [...new FormData(f)]),
    [
      ["email", "persona@example.org"],
      ["modalita", "online"],
      ["turno", "pm"],
    ],
  );
});

test("Picture: ritaglio sotto soglia e candidati distinti a parità di larghezza CSS", async (t) => {
  for (const [width, dpr, file, ratio] of [
    [360, 1, "ingresso-480.png", 4 / 3],
    [480, 1, "campus-480.png", 16 / 9],
    [480, 2, "campus-960.png", 16 / 9],
    [800, 1, "campus-960.png", 16 / 9],
  ]) {
    const p = await pageFor(t, "Immagini e alternative testuali", width, {
      section: "Esempio: selezionare il file, non solo ridimensionarlo",
      deviceScaleFactor: dpr,
    });
    const img = p.getByRole("img", {
      name: "Ingresso del laboratorio sul lato nord del cortile.",
    });
    await img.evaluate((el) => el.decode());
    assert.equal(
      await img.evaluate((el) => el.currentSrc),
      new URL("./immagini/" + file, home).href,
    );
    const box = await rect(img);
    assert.ok(Math.abs(box.width - Math.min(width * 0.9, 576)) < 1);
    assert.ok(Math.abs(box.height - box.width / ratio) < 1);
  }
});

test("Pseudo-elementi: due linee senza figli DOM e titolo leggibile senza CSS", async (t) => {
  const p = await pageFor(t, "Pseudo-elementi before e after in CSS");
  const h = p.getByRole("heading", { level: 2, name: "Fonti", exact: true });
  const shape = () =>
    h.evaluate((el) =>
      ["::before", "::after"].map((pseudo) => {
        const s = getComputedStyle(el, pseudo);
        return [s.content, s.borderBlockStartWidth];
      }),
    );
  assert.deepEqual(await shape(), [
    ['""', "1px"],
    ['""', "1px"],
  ]);
  assert.equal(await h.evaluate((el) => el.childElementCount), 0);
  await p.addStyleTag({ content: ".divisore::after { content: none; }" });
  assert.deepEqual(
    (await shape()).map((s) => s[0]),
    ['""', "none"],
  );
  await p.evaluate(() => {
    for (const s of document.styleSheets) s.disabled = true;
  });
  assert.equal(await h.innerText(), "Fonti");
});

test("Transizione: solo lo sfondo interpola, anche al ritorno; con reduce lo stato cambia subito", async (t) => {
  const p = await pageFor(t, "Transizioni CSS tra stati");
  await p.emulateMedia({ reducedMotion: "no-preference" });
  const box = p.getByRole("checkbox", { name: "Evidenzia l'anteprima" });
  const normal = "rgb(255, 255, 255)",
    checked = "rgb(221, 243, 235)";
  for (const [from, to] of [
    [normal, checked],
    [checked, normal],
  ]) {
    const values = await box.evaluate((input) => {
      const el = document.querySelector(".anteprima");
      const read = () => getComputedStyle(el).backgroundColor;
      const before = read();
      input.click();
      const effects = el.getAnimations();
      const [effect] = effects;
      effect.pause();
      effect.currentTime = effect.effect.getTiming().duration / 2;
      const mid = read(),
        border = getComputedStyle(el).borderInlineStartColor;
      effect.finish();
      return {
        before,
        mid,
        after: read(),
        border,
        props: effects.map((e) => e.transitionProperty),
      };
    });
    assert.deepEqual(values.props, ["background-color"]);
    assert.equal(values.before, from);
    assert.notEqual(values.mid, from);
    assert.notEqual(values.mid, to);
    assert.equal(values.after, to);
    assert.equal(
      values.border,
      to === checked ? "rgb(7, 90, 73)" : "rgba(0, 0, 0, 0)",
    );
  }
  await p.emulateMedia({ reducedMotion: "reduce" });
  await box.focus();
  await p.keyboard.press("Space");
  assert.equal(await box.isChecked(), true);
  assert.deepEqual(
    await p
      .locator(".anteprima")
      .evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        el.getAnimations().length,
      ]),
    [checked, 0],
  );
});

test("Keyframes: tre posizioni, una sola esecuzione e apertura nativa anche senza movimento", async (t) => {
  const p = await pageFor(
    t,
    "Animazioni CSS con keyframes e movimento ridotto",
  );
  await p.emulateMedia({ reducedMotion: "no-preference" });
  const details = p.locator("details"),
    text = details.locator("p");
  const samples = await details.evaluate((el) => {
    el.open = true;
    const body = el.querySelector("p");
    const [animation] = body.getAnimations();
    animation.pause();
    const timing = animation.effect.getTiming();
    const positions = [0, 180, 299].map((ms) => {
      animation.currentTime = ms;
      return new DOMMatrixReadOnly(getComputedStyle(body).transform).m42;
    });
    animation.finish();
    return {
      name: animation.animationName,
      duration: timing.duration,
      iterations: timing.iterations,
      positions,
      end: getComputedStyle(body).transform,
    };
  });
  assert.equal(samples.name, "entra");
  assert.equal(samples.duration, 300);
  assert.equal(samples.iterations, 1);
  assert.equal(samples.positions[0], 8);
  assert.ok(
    Math.abs(samples.positions[1] - 2) < 0.01 && samples.positions[2] < 0.1,
  );
  assert.equal(samples.end, "none");
  await details.evaluate((el) => (el.open = false));
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.keyboard.press("Tab");
  await p.keyboard.press("Enter");
  assert.equal(await text.isVisible(), true);
  assert.equal(await text.evaluate((el) => el.getAnimations().length), 0);
  await p.evaluate(() => {
    document.styleSheets[0].disabled = true;
  });
  await p.keyboard.press("Enter");
  assert.equal(await text.isVisible(), false);
  await p.keyboard.press("Enter");
  assert.equal(await text.innerText(), "Indica il numero d'ordine sul modulo.");
});
