import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import handler from "serve-handler"
import YAML from "yaml"
import { inside } from "./vault.mjs"

const { values } = parseArgs({ options: { port: { type: "string", default: "8080" } } })
const port = Number(values.port)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Porta non valida")
const output = inside("site/public")
if (!fs.existsSync(`${output}/index.html`)) throw new Error("Eseguire prima npm run site:build")
const config = YAML.parse(fs.readFileSync(inside("site/quartz.config.yaml"), "utf8"))
const prefix = new URL(`https://${config.configuration.baseUrl}`).pathname.replace(/\/$/, "")
const server = http.createServer(async (request, response) => {
  // Support both localhost root and the GitHub Pages project subpath.
  const url = new URL(request.url, "http://localhost")
  if (prefix && url.pathname === prefix) {
    response.writeHead(302, { Location: `${prefix}/${url.search}` })
    response.end()
    return
  }
  const localPath =
    prefix && url.pathname.startsWith(`${prefix}/`)
      ? url.pathname.slice(prefix.length)
      : url.pathname
  let requested
  try {
    requested = path.resolve(output, "." + decodeURIComponent(localPath))
  } catch {
    response.writeHead(400)
    response.end("URL non valido")
    return
  }
  if (requested !== output && !requested.startsWith(output + path.sep)) {
    response.writeHead(400)
    response.end("Percorso non valido")
    return
  }
  if (fs.existsSync(requested)) {
    let canonical = null
    if (fs.statSync(requested).isDirectory() && !url.pathname.endsWith("/"))
      canonical = url.pathname + "/"
    else if (/(?:^|\/)index(?:\.html)?$/.test(localPath))
      canonical = url.pathname.replace(/index(?:\.html)?$/, "")
    else if (url.pathname.endsWith(".html")) canonical = url.pathname.slice(0, -5)
    if (canonical) {
      response.writeHead(308, { Location: canonical + url.search })
      response.end()
      return
    }
  } else if (localPath.endsWith("/index") && fs.existsSync(requested + ".html")) {
    response.writeHead(308, { Location: url.pathname.slice(0, -5) + url.search })
    response.end()
    return
  }
  request.url = localPath + url.search
  try {
    await handler(request, response, {
      public: output,
      cleanUrls: true,
      directoryListing: false,
      // Preview pages inline without a filename that can produce invalid Unicode headers.
      headers: [{ source: "**", headers: [{ key: "Content-Disposition", value: "inline" }] }],
    })
  } catch (error) {
    console.error(error)
    response.writeHead(500)
    response.end("Errore anteprima")
  }
})
server.on("error", (error) => {
  console.error(error.message)
  process.exitCode = 1
})
server.listen(port, "127.0.0.1", () => console.log(`Anteprima: http://localhost:${port}${prefix}/`))
