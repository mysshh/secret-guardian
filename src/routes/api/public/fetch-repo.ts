import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/fetch-repo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");
        const ref = url.searchParams.get("ref");

        if (!owner || !repo || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
          return new Response("Invalid owner/repo", { status: 400 });
        }

        const suffix = ref ? `/${encodeURIComponent(ref)}` : "";
        const ghUrl = `https://api.github.com/repos/${owner}/${repo}/zipball${suffix}`;

        const headers: Record<string, string> = {
          "User-Agent": "verdant-sentinel-scanner",
          Accept: "application/vnd.github+json",
        };
        const token = process.env.GITHUB_TOKEN;
        if (token) headers.Authorization = `Bearer ${token}`;

        let upstream: Response;
        try {
          upstream = await fetch(ghUrl, { headers, redirect: "follow" });
        } catch (err) {
          return new Response(`Upstream fetch failed: ${(err as Error).message}`, { status: 502 });
        }

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(
            `GitHub responded ${upstream.status}: ${text.slice(0, 300) || upstream.statusText}`,
            { status: upstream.status === 404 ? 404 : 502 },
          );
        }

        // Cap payload at ~25 MB to protect the worker
        const MAX = 25 * 1024 * 1024;
        const cl = Number(upstream.headers.get("content-length") || 0);
        if (cl && cl > MAX) {
          return new Response(`Repository too large (${cl} bytes, max ${MAX})`, { status: 413 });
        }

        const buf = await upstream.arrayBuffer();
        if (buf.byteLength > MAX) {
          return new Response(`Repository too large (${buf.byteLength} bytes)`, { status: 413 });
        }

        return new Response(buf, {
          status: 200,
          headers: {
            "content-type": "application/zip",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
