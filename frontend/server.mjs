import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('./dist', import.meta.url))
const port = Number(process.env.PORT) || 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function resolveInsideDist(pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const full = normalize(join(dist, relative))
  const root = normalize(dist)
  if (full !== root && !full.startsWith(root + sep)) return null
  return full
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    const pathname = decodeURIComponent(url.pathname)
    const filePath = resolveInsideDist(pathname)
    if (!filePath) {
      res.writeHead(403)
      res.end()
      return
    }

    try {
      const body = await readFile(filePath)
      const type = MIME[extname(filePath)] || 'application/octet-stream'
      const cache = extname(filePath) === '.html'
        ? 'no-cache'
        : 'public, max-age=31536000, immutable'
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache })
      res.end(body)
      return
    } catch {
      if (extname(pathname)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }
    }

    const html = await readFile(join(dist, 'index.html'))
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    })
    res.end(html)
  } catch (error) {
    console.error(error)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Falha ao servir o frontend. Rode o build antes do start.')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend em http://0.0.0.0:${port}`)
})
