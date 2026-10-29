import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".csv": "text/csv; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};
export function createFrontendServer({
  apiOrigin = process.env.API_ORIGIN ||
    "https://invent-io-backend-production.up.railway.app",
  fetcher = fetch,
} = {}) {
  const upstream = new URL(apiOrigin);
  if (
    upstream.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(upstream.hostname)
  )
    throw new Error("API_ORIGIN must use HTTPS.");
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname.startsWith("/api/v1/")) {
        if (
          !["GET", "POST", "PATCH", "DELETE", "PUT"].includes(request.method)
        ) {
          response.writeHead(405);
          return response.end();
        }
        const chunks = [];
        let size = 0;
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 2.2 * 1024 * 1024) {
            response.writeHead(413);
            return response.end(
              JSON.stringify({ message: "File is too large." }),
            );
          }
          chunks.push(chunk);
        }
        const target = new URL(upstream.origin);
        target.pathname = url.pathname.slice(4);
        target.search = url.search;
        const headers = { Accept: "application/json" };
        for (const header of ["authorization", "content-type"])
          if (request.headers[header])
            headers[header] = request.headers[header];
        let result;
        try {
          result = await fetcher(target, {
            method: request.method,
            headers,
            redirect: "error",
            signal: AbortSignal.timeout(60000),
            ...(!["GET", "HEAD"].includes(request.method)
              ? { body: Buffer.concat(chunks) }
              : {}),
          });
        } catch {
          response.writeHead(502, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });
          return response.end(
            JSON.stringify({
              message: "The backend is unavailable. Please try again.",
            }),
          );
        }
        response.writeHead(result.status, {
          "Content-Type":
            result.headers.get("content-type") || "application/json",
          "Cache-Control": "no-store",
          ...(result.headers.get("x-railway-request-id")
            ? {
                "x-railway-request-id": result.headers.get(
                  "x-railway-request-id",
                ),
              }
            : {}),
        });
        return response.end(Buffer.from(await result.arrayBuffer()));
      }
      if (!["GET", "HEAD"].includes(request.method)) {
        response.writeHead(405, { Allow: "GET, HEAD" });
        return response.end();
      }
      const pathname = decodeURIComponent(url.pathname),
        target = resolve(
          root,
          `.${pathname === "/" ? "/index.html" : pathname}`,
        ),
        inside = relative(root, target);
      if (inside.startsWith("..") || isAbsolute(inside)) {
        response.writeHead(403);
        return response.end("Forbidden");
      }
      const content = await readFile(target);
      response.writeHead(200, {
        "Content-Type": types[extname(target)] || "application/octet-stream",
        "Cache-Control": "no-store",
        ...(pathname === "/sw.js" ? { "Service-Worker-Allowed": "/" } : {}),
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404);
      response.end(error instanceof URIError ? "Bad request" : "Not found");
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4173),
    host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
  createFrontendServer().listen(port, host, () =>
    console.log(`Invent IO frontend listening on http://${host}:${port}`),
  );
}
