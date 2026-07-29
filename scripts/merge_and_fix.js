const fs = require('fs');
const path = require('path');

// 1. Read seed data (with full details for 40+ flagship models)
const seedPath = path.join(__dirname, 'seed-data.js');
const seedContent = fs.readFileSync(seedPath, 'utf8');

// Load build/data.json (which has 399+ models)
const buildDataPath = path.join(__dirname, '..', 'build', 'data.json');
const buildData = JSON.parse(fs.readFileSync(buildDataPath, 'utf8'));

// Load curated seed data by running a mini-eval or requiring seed-data structure
// Let's create a curated seed object directly:
const curatedDataPath = path.join(__dirname, '..', 'public', 'data.json');
const curatedData = JSON.parse(fs.readFileSync(curatedDataPath, 'utf8'));

console.log("Curated models count:", Object.values(curatedData.companies).reduce((s, c) => s + c.models.length, 0));
console.log("Build models count:", Object.values(buildData.companies).reduce((s, c) => s + c.models.length, 0));

// Determine true company key for any model based on ID / name / vendor
function getTrueCompanyKey(model, currentCompanyKey) {
  const id = (model.id || "").toLowerCase();
  const name = (model.name || "").toLowerCase();
  const dev = (model.features?.Developer || "").toLowerCase();

  if (id.startsWith("google/") || name.includes("google") || name.includes("gemma") || name.includes("gemini") || dev.includes("google")) {
    if (id.includes("gemma") || name.includes("gemma")) return "google-open";
    return "google";
  }
  if (id.startsWith("openai/") || name.includes("openai") || name.includes("gpt") || id.includes("o1-") || id.includes("o3-") || name.includes("o1-") || name.includes("o3-")) {
    return "openai";
  }
  if (id.startsWith("anthropic/") || name.includes("anthropic") || name.includes("claude")) {
    return "anthropic";
  }
  if (id.startsWith("meta-llama/") || id.startsWith("meta/") || name.includes("llama") || name.includes("meta")) {
    return "meta";
  }
  if (id.startsWith("deepseek/") || id.startsWith("deepseek-ai/") || name.includes("deepseek")) {
    return "deepseek";
  }
  if (id.startsWith("mistralai/") || name.includes("mistral") || name.includes("mixtral") || name.includes("codestral") || name.includes("pixtral")) {
    return "mistral";
  }
  if (id.startsWith("qwen/") || name.includes("qwen") || name.includes("qwq")) {
    return "qwen";
  }
  if (id.startsWith("tiiuae/") || name.includes("falcon")) {
    return "falcon";
  }
  if (id.startsWith("microsoft/") || name.includes("phi-")) {
    return "microsoft";
  }
  if (id.startsWith("x-ai/") || id.startsWith("xai/") || name.includes("grok")) {
    return "xai";
  }
  if (id.startsWith("ai21/") || name.includes("jamba")) {
    return "ai21";
  }
  if (id.startsWith("cohere/") || name.includes("command-r")) {
    return "cohere";
  }
  if (id.startsWith("z-ai/") || name.includes("glm")) {
    return "zai";
  }
  if (id.startsWith("nanbeige/")) {
    return "nanbeige";
  }

  return currentCompanyKey || "other";
}

// Map of canonical models by id and alias
const modelMap = new Map();

// Helper to register/update a model
function addOrUpdateModel(model, companyKey) {
  const trueCompKey = getTrueCompanyKey(model, companyKey);
  const key = model.id;
  
  if (!modelMap.has(key)) {
    modelMap.set(key, { ...model, companyKey: trueCompKey });
  } else {
    // Merge: prefer curated values if present
    const existing = modelMap.get(key);
    const merged = {
      ...existing,
      ...model,
      companyKey: trueCompKey,
      features: { ...existing.features, ...model.features },
      architecture_specs: { ...existing.architecture_specs, ...model.architecture_specs },
      benchmarks: (model.benchmarks && model.benchmarks.length > 0) ? model.benchmarks : existing.benchmarks,
      pricing: (model.pricing && model.pricing.length > 0) ? model.pricing : existing.pricing,
      why: model.why || existing.why
    };
    modelMap.set(key, merged);
  }
}

// First, collect all build models
for (const [ck, comp] of Object.entries(buildData.companies)) {
  for (const m of comp.models || []) {
    addOrUpdateModel(m, ck);
  }
}

// Second, overlay all curated models (takes precedence for high quality data)
for (const [ck, comp] of Object.entries(curatedData.companies)) {
  for (const m of comp.models || []) {
    addOrUpdateModel(m, ck);
  }
}

// Now rebuild standard companies structure
const finalCompanies = { ...buildData.companies, ...curatedData.companies };
// Clear out model arrays
for (const ck of Object.keys(finalCompanies)) {
  finalCompanies[ck].models = [];
}

// Re-assign each model to its correct company
for (const m of modelMap.values()) {
  const ck = m.companyKey;
  if (!finalCompanies[ck]) {
    finalCompanies[ck] = {
      name: ck.charAt(0).toUpperCase() + ck.slice(1),
      image: "./images/gpt.png",
      models: []
    };
  }
  // Delete transient companyKey field before storing in data.json
  const modelToStore = { ...m };
  delete modelToStore.companyKey;
  finalCompanies[ck].models.push(modelToStore);
}

const finalData = {
  ...buildData,
  last_updated: "2026-07-29",
  companies: finalCompanies
};

const totalFinalModels = Object.values(finalCompanies).reduce((s, c) => s + c.models.length, 0);
console.log("Total final models merged & categorized:", totalFinalModels);

// Write to public/data.json
const pubOut = path.join(__dirname, '..', 'public', 'data.json');
fs.writeFileSync(pubOut, JSON.stringify(finalData, null, 2));
console.log("Wrote merged data to:", pubOut);

// Also sync build/data.json if present
if (fs.existsSync(buildDataPath)) {
  fs.writeFileSync(buildDataPath, JSON.stringify(finalData, null, 2));
  console.log("Wrote merged data to:", buildDataPath);
}
