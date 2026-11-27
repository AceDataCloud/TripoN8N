import type { INodeProperties, INodePropertyOptions } from "n8n-workflow";

export const operations = {
  generation: [
    { name: "Generate", value: "generate", action: "Generate a 3D model" },
  ],
  model: [
    { name: "Convert", value: "convert", action: "Convert a model" },
    { name: "Import", value: "import", action: "Import a model" },
    { name: "Texture", value: "texture", action: "Texture a model" },
  ],
  animation: [
    {
      name: "Check Rigging",
      value: "rig_check",
      action: "Check whether a model can be rigged",
    },
    { name: "Retarget", value: "retarget", action: "Retarget animations" },
    { name: "Rig", value: "rig", action: "Rig a model" },
  ],
  task: [
    { name: "Get", value: "get", action: "Get a task" },
    { name: "Get Many", value: "getMany", action: "Get multiple tasks" },
  ],
};

const choice = (
  displayName: string,
  name: string,
  values: string[],
  initial = values[0],
): INodeProperties => ({
  displayName,
  name,
  type: "options",
  default: initial,
  options: values.map((value) => ({ name: value, value })),
});
const text = (
  displayName: string,
  name: string,
  description?: string,
): INodeProperties => ({
  displayName,
  name,
  type: "string",
  default: "",
  description,
});
const list = (
  displayName: string,
  name: string,
  description: string,
): INodeProperties => ({
  displayName,
  name,
  type: "json",
  default: "[]",
  description,
});
const flag = (
  displayName: string,
  name: string,
  description: string,
): INodeProperties => ({
  displayName,
  name,
  type: "boolean",
  default: false,
  description,
});
const number = (
  displayName: string,
  name: string,
  initial: number,
): INodeProperties => ({
  displayName,
  name,
  type: "number",
  default: initial,
});
const requireWhen = (
  field: INodeProperties,
  show: Record<string, string[]>,
): INodeProperties => ({
  ...field,
  required: true,
  displayOptions: { show },
});
function selector(
  displayName: string,
  name: string,
  options: INodePropertyOptions[],
  show: Record<string, string[]>,
) {
  const initial = options[0].value;
  return requireWhen(
    {
      displayName,
      name,
      type: "options",
      noDataExpression: true,
      options,
      default: initial,
    },
    show,
  );
}
const callback = text(
  "Callback URL",
  "callbackUrl",
  "HTTPS URL to receive the final result",
);
const format = choice("Format", "format", ["GLB", "FBX"]);
const animate = flag(
  "Animate in Place",
  "animateInPlace",
  "Whether the animation stays at the origin",
);
const bake = flag("Bake", "bake", "Whether to bake textures");
const image = text(
  "Image URL",
  "imageUrl",
  "Public HTTPS URL of a PNG or JPEG up to 20 MiB",
);
const views = list(
  "Image URLs",
  "imageUrls",
  "Array of front, left, back and right HTTPS URLs. Provide the front and at least one other view. Use null to skip an optional view.",
);
const parts = list("Part Names", "partNames", "JSON array of model part names");
const prompt = text("Prompt", "prompt");
export const optionalFields: Record<string, INodeProperties[]> = {
  generate: [
    callback,
    choice("Model", "model", [
      "v3.1-20260211",
      "v3.0-20250812",
      "v2.5-20250123",
      "P1-20260311",
      "P2-20260801",
    ]),
    choice("Texture", "texture", ["standard", "none"]),
  ],
  import: [callback],
  texture: [
    callback,
    bake,
    flag("Delight", "delight", "Whether to remove baked lighting"),
    choice("Compress", "compress", ["geometry"]),
    image,
    views,
    choice("Model", "model", [
      "v3.5-20260815",
      "v3.0-20250812",
      "v2.5-20250123",
    ]),
    parts,
    flag(
      "PBR",
      "pbr",
      "Whether to generate physically based rendering textures",
    ),
    prompt,
    text("Style Image URL", "styleImageUrl"),
    choice("Texture Alignment", "textureAlignment", [
      "original_image",
      "geometry",
    ]),
    choice(
      "Texture Quality",
      "textureQuality",
      ["fast", "standard", "detailed", "extreme"],
      "standard",
    ),
    number("Texture Seed", "textureSeed", 0),
  ],
  convert: [
    callback,
    animate,
    bake,
    choice("Export Orientation", "exportOrientation", ["+x", "-x", "+y", "-y"]),
    flag(
      "Export Vertex Colors",
      "exportVertexColors",
      "Whether to export vertex colors",
    ),
    number("Face Limit", "faceLimit", 10000),
    choice("FBX Preset", "fbxPreset", [
      "blender",
      "3dsmax",
      "mixamo",
      "bake_scale",
    ]),
    flag(
      "Flatten Bottom",
      "flattenBottom",
      "Whether to flatten the bottom of the mesh",
    ),
    number("Flatten Bottom Threshold", "flattenBottomThreshold", 0),
    flag("Force Symmetry", "forceSymmetry", "Whether to force symmetry"),
    flag("Pack UV", "packUv", "Whether to pack UV maps"),
    parts,
    flag(
      "Pivot to Center Bottom",
      "pivotToCenterBottom",
      "Whether to move the pivot to the bottom center",
    ),
    flag("Quad", "quad", "Whether to output quadrilateral faces"),
    number("Scale Factor", "scaleFactor", 1),
    choice("Texture Format", "textureFormat", ["JPEG", "PNG", "WEBP", "BMP"]),
    choice("Texture Packaging", "texturePackaging", ["embedded", "zip"]),
    number("Texture Size", "textureSize", 1024),
    flag("With Animation", "withAnimation", "Whether to include animation"),
  ],
  rig_check: [callback],
  rig: [
    callback,
    format,
    choice("Model", "model", [
      "v1.0-20240301",
      "v2.5-20260210",
      "v3.0-20260909",
    ]),
    choice("Rig Type", "rigType", [
      "biped",
      "quadruped",
      "hexapod",
      "octopod",
      "avian",
      "serpentine",
      "aquatic",
      "others",
    ]),
    choice("Spec", "spec", [
      "tripo",
      "mixamo",
      "actorcore",
      "unity",
      "unreal",
      "vrm",
    ]),
  ],
  retarget: [
    callback,
    animate,
    flag(
      "Export With Geometry",
      "exportWithGeometry",
      "Whether to include the source geometry",
    ),
    format,
  ],
};
const modelSource = { operation: ["texture", "convert", "rig_check", "rig"] };
const taskSource = { resource: ["task"] };
const modelId = text(
  "Model ID",
  "modelId",
  "ID of a model in your Ace Data Cloud account",
);
const modelUrl = text(
  "Model URL",
  "modelUrl",
  "Public HTTPS URL to a supported model file up to 150 MiB",
);
export const properties: INodeProperties[] = [
  {
    displayName: "Resource",
    name: "resource",
    type: "options",
    noDataExpression: true,
    default: "generation",
    options: [
      { name: "Animation", value: "animation" },
      { name: "Generation", value: "generation" },
      { name: "Model", value: "model" },
      { name: "Task", value: "task" },
    ],
  },
  ...Object.entries(operations).map(([resource, options]) =>
    selector("Operation", "operation", options, { resource: [resource] }),
  ),
  selector(
    "Input",
    "generationInput",
    [
      { name: "Text Prompt", value: "prompt" },
      { name: "Image URL", value: "imageUrl" },
      { name: "Multiple Views", value: "imageUrls" },
    ],
    { operation: ["generate"] },
  ),
  ...[prompt, image, views].map((field) =>
    requireWhen(field, {
      operation: ["generate"],
      generationInput: [field.name],
    }),
  ),
  selector(
    "Model Source",
    "modelSource",
    [
      { name: "Model ID", value: "modelId" },
      { name: "Model URL", value: "modelUrl" },
    ],
    modelSource,
  ),
  requireWhen(modelId, { ...modelSource, modelSource: ["modelId"] }),
  requireWhen(modelUrl, { ...modelSource, modelSource: ["modelUrl"] }),
  requireWhen(modelUrl, { operation: ["import"] }),
  requireWhen(modelId, { operation: ["retarget"] }),
  requireWhen(
    choice("Format", "format", ["GLTF", "FBX", "USDZ", "OBJ", "STL", "3MF"]),
    { operation: ["convert"] },
  ),
  selector(
    "Animation Source",
    "animationSource",
    [
      { name: "Single Preset", value: "animation" },
      { name: "Multiple Presets", value: "animations" },
    ],
    { operation: ["retarget"] },
  ),
  requireWhen(
    text("Animation", "animation", "Animation preset such as preset:walk"),
    { operation: ["retarget"], animationSource: ["animation"] },
  ),
  requireWhen(
    list("Animations", "animations", "Array of one to five animation presets"),
    { operation: ["retarget"], animationSource: ["animations"] },
  ),
  selector(
    "Look Up By",
    "lookup",
    [
      { name: "Task ID", value: "id" },
      { name: "Trace ID", value: "trace_id" },
    ],
    taskSource,
  ),
  requireWhen(text("Task ID", "taskId"), {
    operation: ["get"],
    lookup: ["id"],
  }),
  requireWhen(text("Trace ID", "traceId"), {
    operation: ["get"],
    lookup: ["trace_id"],
  }),
  requireWhen(list("Task IDs", "taskIds", "JSON array of up to 100 task IDs"), {
    operation: ["getMany"],
    lookup: ["id"],
  }),
  requireWhen(
    list("Trace IDs", "traceIds", "JSON array of up to 100 trace IDs"),
    { operation: ["getMany"], lookup: ["trace_id"] },
  ),
  ...Object.entries(optionalFields).map(
    ([operation, fields]): INodeProperties => ({
      displayName: "Options",
      name: "options",
      type: "collection",
      placeholder: "Add Option",
      default: {},
      options: [...fields].sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      ),
      displayOptions: { show: { operation: [operation] } },
    }),
  ),
];
