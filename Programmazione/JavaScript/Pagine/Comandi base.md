---
tags:
  - programmazione
  - javascript
  - strumenti
argomento: Comandi Base e Toolchain
data: 2025-12-20
stato: 🟢 completato
---

# Comandi Base e Toolchain (Node.js/NPM)

## 💡 Concetto Chiave
Sebbene JS giri nel browser, lo sviluppo moderno richiede **Node.js** per il tooling (compilatori, bundler, test).
Il cuore di ogni progetto JS è il file `package.json`, gestito da **NPM** (o Yarn/PNPM).

---

## 📝 Sintassi

```bash
node script.js    # Esegue un file JS
npm init -y       # Crea package.json default
npm install <pkg> # Installa dipendenza
npm run <script>  # Esegue script custom
```

---

## 💻 Esempi Pratici

### 1. Inizializzare un progetto
```bash
mkdir mio-progetto
cd mio-progetto
npm init -y
# Crea package.json
```

### 2. Gestione Dipendenze
In JS si distingue tra dipendenze di produzione e di sviluppo (`devDependencies`).
```bash
# Dipendenza Runtime (es. React, Express)
npm install axios

# Dipendenza Dev (es. Jest, TypeScript, Eslint)
npm install --save-dev jest
```

### 3. Script Custom
Nel `package.json`, sezione `"scripts"`:
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "test": "jest"
}
```
Esecuzione:
```bash
npm run dev
npm test
```

---

## ⚙️ Funzionamento Interno

### node_modules
La cartella "buco nero" dove finiscono tutte le librerie. Mai committarla su Git!

### package-lock.json
Simile al `Cargo.lock` di Rust. Blocca le versioni esatte dell'intero albero delle dipendenze per garantire che "funzioni sul mio PC" significhi "funziona ovunque".

### npx
Strumento per eseguire binari di pacchetti npm senza installarli globalmente.
```bash
npx create-react-app my-app
```

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Gitignore:** Assicurati SEMPRE che `node_modules` sia nel `.gitignore`.
- ✅ **Versioni Node:** Usa `nvm` (Node Version Manager) per gestire versioni multiple di Node.js su diversi progetti.
- 💣 **Installazione Globale:** Evita `npm install -g` se possibile. Usa `npx` o dipendenze locali per evitare conflitti di versione tra progetti.

## 📚 Riferimenti
- [NPM Docs](https://docs.npmjs.com/)
