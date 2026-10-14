import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }

  const filePath = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  let isFile;
  try {
    isFile = statSync(filePath).isFile();
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      response.writeHead(404).end("Not Found");
      return;
    }
    response.writeHead(500).end("Internal Server Error");
    console.error(error);
    return;
  }

  if (!isFile) {
    response.writeHead(404).end("Not Found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": `${contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream"}; charset=utf-8`,
  });

  if (request.method === "HEAD") {
    response.end();
  } else {
    const stream = createReadStream(filePath);
    stream.on("error", (error) => {
      console.error(error);
      if (response.headersSent) {
        response.destroy(error);
      } else {
        response.writeHead(500).end("Internal Server Error");
      }
    });
    stream.pipe(response);
  }
}).listen(Number(process.env.PORT) || 5500, "127.0.0.1", () => {
  console.log(`Frontend available at http://localhost:${Number(process.env.PORT) || 5500}`);
});
