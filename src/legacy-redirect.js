// Only this visor's legacy Worker redirects; no account-wide subdomain change.
export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const destination = new URL('https://idecam-redes-electricas.pages.dev/');
    destination.pathname = incoming.pathname;
    destination.search = incoming.search;
    return new Response(null, {
      status: 302,
      headers: {
        Location: destination.href,
        'Cache-Control': 'public, max-age=300',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};
