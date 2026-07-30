/**
 * Cloudflare Pages Function to inject per-route Open Graph and SEO meta tags
 * using Cloudflare HTMLRewriter.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Let static assets (JS, CSS, images, JSON, manifests) pass through directly
  if (path.includes('.') && !path.endsWith('.html')) {
    return env.ASSETS.fetch(request);
  }

  // Fetch root static asset from Cloudflare Pages ASSETS binding
  const assetUrl = new URL('/', request.url);
  const response = await env.ASSETS.fetch(
    new Request(assetUrl, {
      method: request.method,
      headers: request.headers
    })
  );

  // Safeguard: If assets fetch returns a redirect, pass request directly to prevent 308 loop
  if (response.status >= 300 && response.status < 400) {
    return env.ASSETS.fetch(request);
  }


  let title = "LLM Atlas — Architecture & Benchmarks, Honestly";
  let description = "Every LLM, explained honestly. Architecture, raw benchmarks, and cost — side by side, never blended.";

  if (path.startsWith('/timeline')) {
    title = "LLM Timeline & Milestones — LLM Atlas";
    description = "Chronological milestone release history of frontier LLM architectures from 2023 to present.";
  } else if (path.startsWith('/family/')) {
    const familyId = path.split('/family/')[1];
    const famName = familyId ? familyId.replace(/_/g, ' ').toUpperCase() : 'Architecture';
    title = `${famName} Architecture Explainer — LLM Atlas`;
    description = `Deep dive into ${famName} LLM architecture trade-offs, active vs total parameters, and efficiency.`;
  } else if (path.startsWith('/families')) {
    title = "Architecture Families — LLM Atlas";
    description = "Compare Dense, MoE, Hybrid SSM, Looped, and Multimodal LLM architecture families.";
  } else if (path.startsWith('/compare')) {
    title = "Compare LLMs Side-by-Side — LLM Atlas";
    description = "Side-by-side comparison of LLM architecture parameters, context windows, benchmark ELO, and pricing.";
  } else if (path.startsWith('/methodology')) {
    title = "Methodology & Scoring — LLM Atlas";
    description = "Transparent methodology explaining Arena ELO, active parameter efficiency score, and value frontier calculation.";
  } else if (path.startsWith('/changelog')) {
    title = "Ingestion Pipeline Log & Changelog — LLM Atlas";
    description = "Live log of daily ingestion pipeline runs, model additions, and benchmark updates.";
  } else if (path.startsWith('/model/')) {
    const modelId = decodeURIComponent(path.replace('/model/', ''));
    title = `${modelId} — LLM Atlas Specs & Benchmarks`;
    description = `Detailed architecture specs, benchmark scores, context window, and pricing for ${modelId}.`;
  }

  return new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(title);
      }
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', title);
      }
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute('content', title);
      }
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', description);
      }
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', description);
      }
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', description);
      }
    })
    .transform(response);
}
