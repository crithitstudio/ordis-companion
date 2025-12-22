interface Env { }

export const onRequest: PagesFunction<Env> = async (context) => {
    const url = new URL(context.request.url);
    const pathParam = context.params.path;
    const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;

    if (!path) {
        return new Response(JSON.stringify({ error: "Missing path" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const targetUrl = `https://api.warframe.com/cdn/${path}`;

    const newHeaders = new Headers();
    // Spoof headers to look like a request from the official site or a standard browser
    newHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    newHeaders.set('Accept', 'application/json, text/plain, */*');
    newHeaders.set('Accept-Language', 'en-US,en;q=0.9');
    newHeaders.set('Referer', 'https://www.warframe.com/');
    newHeaders.set('Origin', 'https://www.warframe.com');

    const newRequest = new Request(targetUrl, {
        method: 'GET',
        headers: newHeaders,
    });

    try {
        const response = await fetch(newRequest);

        // Create new headers to allow CORS
        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

        // Pass specific headers
        const headersToPass = ['content-type', 'cache-control', 'last-modified', 'etag', 'date', 'expires'];
        for (const header of headersToPass) {
            if (response.headers.has(header)) {
                responseHeaders.set(header, response.headers.get(header)!);
            }
        }

        // Force JSON content type if it looks like JSON but upstream says otherwise (sometimes happens with raw php)
        if (path.endsWith('.php') && !responseHeaders.get('content-type')?.includes('json')) {
            // responseHeaders.set('content-type', 'application/json'); 
            // Actually don't force it blindly, but the raw worldState.php usually returns JSON content but with text/html type sometimes? 
            // No, usually it returns application/json.
            // If we get 403, we return the 403.
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: `Proxy Error: ${err}` }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
