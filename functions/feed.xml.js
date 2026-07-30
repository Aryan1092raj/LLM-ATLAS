export async function onRequest(context) {
  const { request } = context;

  try {
    const dataUrl = new URL('/data.json', request.url);
    const resp = await fetch(dataUrl.toString());
    const data = await resp.json();

    const siteUrl = new URL('/', request.url).toString().replace(/\/$/, '');
    const now = new Date().toUTCString();

    let items = [];
    Object.values(data.companies || {}).forEach(c => {
      (c.models || []).forEach(m => {
        if (m._added_at) {
          items.push({
            title: `New Model Discovered: ${m.name} (${c.name})`,
            link: `${siteUrl}/model/${encodeURIComponent(m.id)}`,
            pubDate: new Date(m._added_at).toUTCString(),
            description: `Auto-catalogued model: ${m.name}. Family: ${m.family}. Disclosure: ${m.disclosure}.`
          });
        }
      });
    });

    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    items = items.slice(0, 30);

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>LLM Atlas — Ingestion & Model Updates</title>
  <link>${siteUrl}</link>
  <description>Automated daily ingestion feed for newly catalogued LLM architectures, benchmark scores, and pricing.</description>
  <lastBuildDate>${now}</lastBuildDate>
  ${items.map(item => `
  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${item.link}</link>
    <pubDate>${item.pubDate}</pubDate>
    <description>${escapeXml(item.description)}</description>
  </item>`).join('')}
</channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    return new Response(`<error>${err.message}</error>`, { status: 500 });
  }
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
