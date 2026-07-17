---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, testing, visual-regression]
aliases: [Visual regression testing, Test visuali]
prerequisites: []
related: []
---

# Visual regression testing

## Sintesi

Il visual regression testing confronta screenshot o snapshot visuali per rilevare cambiamenti inattesi nella UI. E utile per design system, componenti critici, layout complessi e pagine dove piccoli cambiamenti visuali contano.

## Quando usarlo

Usalo per componenti condivisi, pagine ad alto valore, regressioni CSS, temi, responsive layout e UI documentata in Storybook.

## Come funziona

Il test produce una immagine corrente e la confronta con una baseline approvata. Se la differenza supera una soglia, il test fallisce.

```text
baseline screenshot -> nuovo screenshot -> diff visuale
```

## API / Sintassi

Con Playwright:

```ts
await expect(page).toHaveScreenshot("dashboard.png");
```

Con Storybook si possono integrare servizi o addon per snapshot visuali dei componenti.

## Esempio pratico

Procedura:

1. scegli componenti o pagine stabili;
2. cattura baseline;
3. esegui test in ambiente deterministico;
4. confronta diff;
5. approva solo cambiamenti intenzionali;
6. conserva screenshot falliti in CI.

## Varianti

- **Screenshot page-level**: pagina intera.
- **Component screenshot**: singolo componente.
- **Storybook visual tests**: ogni story come caso.
- **Cross-browser visual**: browser diversi.
- **Responsive snapshots**: viewport multipli.
- **Theme snapshots**: tema chiaro/scuro.

## Errori comuni

- Usare dati dinamici non stabilizzati.
- Non fissare viewport, font o timezone.
- Approvare diff senza revisione.
- Testare troppe pagine instabili.
- Ignorare animazioni e loading state.
- Non conservare artefatti di fallimento.

## Checklist

- La UI testata e abbastanza stabile?
- Dati, viewport e font sono controllati?
- Animazioni sono disabilitate?
- Le baseline sono revisionate?
- I diff falliti sono leggibili?
- Il test copre componenti ad alto rischio?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Storybook]]
- [[Testing Cypress e Playwright]]
- [[Design system]]
- [[Animazioni e Micro-interazioni]]
