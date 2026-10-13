import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { prepareContent } from "./prepare-content.mjs"
import { writeRedirects } from "./write-redirects.mjs"
import { checkSite } from "./check-site.mjs"

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

child.on("exit", async (code, signal) => {
  if (signal) {
    console.error(`Quartz terminato dal segnale ${signal}`)
    process.exitCode = 1
    return
  }

  process.exitCode = code ?? 1
  if (code === 0) {
    try {
      const args = process.argv.slice(2)
      const outputFlag = args.findIndex((arg) => arg === "--output" || arg === "-o")
      const output =
        outputFlag === -1
          ? path.join(siteRoot, "public")
          : path.resolve(siteRoot, args[outputFlag + 1])
      await writeRedirects(output)
      checkSite(output)
    } catch (error) {
      console.error(error)
      process.exitCode = 1
    }
  }
})
