export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const familyFilter = url.searchParams.get('family');
  const companyFilter = url.searchParams.get('company');
  const disclosureFilter = url.searchParams.get('disclosure');

  try {
    const dataUrl = new URL('/data.json', request.url);
    const resp = await fetch(dataUrl.toString());
    const data = await resp.json();

    let models = [];
    Object.entries(data.companies || {}).forEach(([cKey, cVal]) => {
      (cVal.models || []).forEach(m => {
        models.push({
          id: m.id,
          name: m.name,
          company: cVal.name || cKey,
          family: m.family,
          disclosure: m.disclosure,
          confidence: m.confidence || 'undisclosed',
          architecture_specs: m.architecture_specs,
          benchmarks: m.benchmarks,
          pricing: m.pricing
        });
      });
    });

    if (familyFilter) {
      models = models.filter(m => m.family && m.family.toLowerCase() === familyFilter.toLowerCase());
    }
    if (companyFilter) {
      models = models.filter(m => m.company && m.company.toLowerCase() === companyFilter.toLowerCase());
    }
    if (disclosureFilter) {
      models = models.filter(m => m.disclosure && m.disclosure.toLowerCase() === disclosureFilter.toLowerCase());
    }

    return new Response(JSON.stringify({
      version: "v1",
      count: models.length,
      last_updated: data.last_updated,
      models: models
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
