const assert = require("node:assert/strict");
const { test } = require("node:test");
const { Tripo } = require("../dist/nodes/Tripo/Tripo.node.js");

const modelId = "93b10ea5-e423-4893-a1f9-0852864ce0d4";
const modelUrl = "https://example.com/model.glb";
const imageUrl = "https://example.com/front.png";
const imageUrls = [imageUrl, null, "https://example.com/back.png"];
const submit = { task_id: modelId };
async function execute(items, response = submit, continueOnFail = false) {
  const calls = [];
  const ctx = {
    getInputData: () => items,
    getNodeParameter: (key, i, fallback) => items[i][key] ?? fallback,
    getNode: () => ({
      name: "Tripo",
      type: "tripo",
      parameters: {},
      position: [0, 0],
      typeVersion: 1,
    }),
    continueOnFail: () => continueOnFail,
    helpers: {
      async httpRequestWithAuthentication(credential, options) {
        assert.equal(credential, "aceDataTripoApi");
        assert.equal(options.method, "POST");
        calls.push({
          endpoint: new URL(options.url).pathname,
          body: options.body,
        });
        if (response instanceof Error) throw response;
        return response;
      },
    },
  };
  const [results] = await new Tripo().execute.call(ctx);
  return { calls, results };
}
const cases = [
  ["generation", "generate", { prompt: "A chair" }, { prompt: "A chair" }],
  [
    "generation",
    "generate",
    { generationInput: "imageUrl", imageUrl },
    { image_url: imageUrl },
  ],
  [
    "generation",
    "generate",
    {
      generationInput: "imageUrls",
      imageUrls: JSON.stringify(imageUrls),
      options: { texture: "none" },
    },
    { image_urls: imageUrls, texture: "none" },
  ],
  ["model", "import", { modelUrl }, { model_url: modelUrl }],
  [
    "model",
    "texture",
    {
      modelId,
      options: { pbr: false, textureSeed: 0, textureQuality: "extreme" },
    },
    {
      model_id: modelId,
      pbr: false,
      texture_seed: 0,
      texture_quality: "extreme",
    },
  ],
  [
    "model",
    "convert",
    {
      modelSource: "modelUrl",
      modelUrl,
      format: "FBX",
      options: { fbxPreset: "blender", scaleFactor: 1 },
    },
    {
      model_url: modelUrl,
      format: "FBX",
      fbx_preset: "blender",
      scale_factor: 1,
    },
  ],
  ["animation", "rig_check", { modelId }, { model_id: modelId }],
  [
    "animation",
    "rig",
    { modelId, options: { rigType: "biped" } },
    { model_id: modelId, rig_type: "biped" },
  ],
  [
    "animation",
    "retarget",
    { modelId, animation: "preset:walk" },
    { model_id: modelId, animation: "preset:walk" },
  ],
  [
    "animation",
    "retarget",
    {
      modelId,
      animationSource: "animations",
      animations: ["preset:walk", "preset:run"],
    },
    { model_id: modelId, animations: ["preset:walk", "preset:run"] },
  ],
];
for (const [resource, operation, params, expected] of cases) {
  test(
    resource + " " + operation + " " + Object.keys(expected).join(" "),
    async () => {
      const { calls, results } = await execute([
        { resource, operation, ...params },
      ]);
      assert.deepEqual(calls, [
        {
          endpoint:
            "/tripo/" +
            {
              generation: "generations",
              model: "models",
              animation: "animations",
            }[resource],
          body: { action: operation, async: true, ...expected },
        },
      ]);
      assert.deepEqual(results, [{ json: submit, pairedItem: { item: 0 } }]);
    },
  );
}
test("lookup preserves complete raw records, missing tasks, batch positions and count", async () => {
  const record = {
    id: modelId,
    progress: 100,
    response: {
      success: true,
      cost: { amount: 2, currency: "credit" },
      data: [{ id: modelId, model_url: modelUrl, format: "GLB" }],
    },
  };
  for (const [operation, params, body, response] of [
    ["get", { taskId: modelId }, { action: "retrieve", id: modelId }, record],
    [
      "get",
      { lookup: "trace_id", traceId: "missing" },
      { action: "retrieve", trace_id: "missing" },
      {},
    ],
    [
      "getMany",
      { taskIds: [modelId] },
      { action: "retrieve_batch", ids: [modelId] },
      { items: [record], count: 1 },
    ],
    [
      "getMany",
      { lookup: "trace_id", traceIds: '["first","missing"]' },
      { action: "retrieve_batch", trace_ids: ["first", "missing"] },
      { items: [record, null], count: 2 },
    ],
  ]) {
    const { calls, results } = await execute(
      [{ resource: "task", operation, ...params }],
      response,
    );
    assert.deepEqual(calls, [{ endpoint: "/tripo/tasks", body }]);
    assert.deepEqual(results[0].json, response);
  }
});
test("input pairing continues after an invalid URL and malformed list without sending them", async () => {
  const { calls, results } = await execute(
    [
      {
        resource: "model",
        operation: "import",
        modelUrl: "http://example.com/file.glb",
      },
      {
        resource: "generation",
        operation: "generate",
        generationInput: "imageUrls",
        imageUrls: [null, imageUrl],
      },
      {
        resource: "task",
        operation: "getMany",
        taskIds: Array(101).fill(modelId),
      },
      {
        resource: "model",
        operation: "import",
        modelUrl,
        options: { callbackUrl: "https://example.com/done" },
      },
    ],
    submit,
    true,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.callback_url, "https://example.com/done");
  assert.deepEqual(
    results.map((r) => r.pairedItem.item),
    [0, 1, 2, 3],
  );
  assert.ok(results.slice(0, 3).every((r) => typeof r.json.error === "string"));
});
test("a failed creation request is never resubmitted", async () => {
  const { calls, results } = await execute(
    [{ resource: "generation", operation: "generate", prompt: "chair" }],
    new Error("request timeout"),
    true,
  );
  assert.equal(calls.length, 1);
  assert.match(results[0].json.error, /timeout/);
});
