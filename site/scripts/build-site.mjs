import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { prepareContent } from "./prepare-content.mjs"

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const { outputRoot } = await prepareContent()
const quartzArgs = [
  "quartz/bootstrap-cli.mjs",
  "build",
  "--directory",
  outputRoot,
  ...process.argv.slice(2),
]

const child = spawn(process.execPath, quartzArgs, {
  cwd: siteRoot,
  stdio: "inherit",
})

child.on("error", (error) => {
  console.error(`Impossibile avviare Quartz: ${error.message}`)
  process.exitCode = 1
})

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Quartz terminato dal segnale ${signal}`)
    process.exitCode = 1
    return
  }

  process.exitCode = code ?? 1
})
