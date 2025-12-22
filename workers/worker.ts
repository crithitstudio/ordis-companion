/// <reference types="@cloudflare/workers-types" />

interface Env {
    ASSETS: Fetcher;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // Proxy /api/warframe/dynamic/* to https://api.warframe.com/cdn/*
        if (url.pathname.startsWith('/api/warframe/dynamic/')) {
            const newPath = url.pathname.replace('/api/warframe/dynamic/', '/cdn/');
            const targetUrl = 'https://api.warframe.com' + newPath;

            // Reconstruct Request
            const newRequest = new Request(targetUrl, {
                method: request.method,
                headers: request.headers,
                body: request.body,
                redirect: 'follow',
            });

            // Fetch from Warframe
            const response = await fetch(newRequest);

            // Add CORS headers to allow browser to read it
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Access-Control-Allow-Origin', '*');

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            });
        }

        // SPA Fallback logic for assets
        try {
            const response = await env.ASSETS.fetch(request);

            // If not found and not an API call, serve index.html
            if (response.status === 404 && !url.pathname.startsWith('/api/')) {
                return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
            }

            return response;
        } catch (e) {
            return new Response('Not Found', { status: 404 });
        }
    },
} satisfies ExportedHandler<Env>;
