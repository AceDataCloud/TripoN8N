import type {
  IDataObject,
  IExecuteFunctions,
  INodeProperties,
} from "n8n-workflow";
import { operations, optionalFields } from "./properties";

const endpoints = {
  generation: "generations",
  model: "models",
  animation: "animations",
  task: "tasks",
};
const apiName = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => "_" + letter.toLowerCase());

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "")
    throw new Error(label + " is required");
  return value.trim();
}
function https(value: unknown, label: string): string {
  const url = text(value, label);
  if (!url.startsWith("https://") || !URL.canParse(url))
    throw new Error(label + " must be a public HTTPS URL");
  return url;
}
function array(value: unknown, label: string, max?: number): unknown[] {
  const items = typeof value === "string" ? JSON.parse(value) : value;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    (max && items.length > max)
  ) {
    throw new Error(
      "Provide a nonempty array for " +
        label +
        (max ? " with at most " + max + " entries" : ""),
    );
  }
  return items;
}
function field(
  name: string,
  value: unknown,
  property?: INodeProperties,
): IDataObject[string] {
  if (name === "imageUrls") {
    const views = array(value, "Image URLs", 4).map((v) =>
      v === null ? null : https(v, "Image URL"),
    );
    if (!views[0] || views.filter(Boolean).length < 2)
      throw new Error("Provide a front image and at least one additional view");
    return views;
  }
  if (name === "animations" || name === "partNames") {
    return array(value, name, name === "animations" ? 5 : undefined).map((v) =>
      text(v, name),
    );
  }
  if (name.endsWith("Url")) return https(value, name);
  if (property && (property.type === "boolean" || property.type === "number")) {
    if (typeof value !== property.type)
      throw new Error("Invalid value for " + property.displayName);
    return value as boolean | number;
  }
  return text(value, name);
}
export function buildRequest(context: IExecuteFunctions, index: number) {
  const get = (name: string, fallback?: string) =>
    context.getNodeParameter(name, index, fallback);
  const resource = get("resource") as keyof typeof endpoints;
  const operation = String(get("operation"));
  if (
    !Object.prototype.hasOwnProperty.call(endpoints, resource) ||
    !operations[resource].some((op) => op.value === operation)
  ) {
    throw new Error("Select a supported resource and operation");
  }
  const endpoint = "/tripo/" + endpoints[resource];
  if (resource === "task") {
    const batch = operation === "getMany";
    const trace = get("lookup", "id") === "trace_id";
    const key = trace ? "trace_id" : "id";
    const name = trace ? "traceId" : "taskId";
    const body: IDataObject = batch
      ? {
          action: "retrieve_batch",
          [key + "s"]: array(get(name + "s"), "IDs", 100).map((v) =>
            text(v, "ID"),
          ),
        }
      : { action: "retrieve", [key]: text(get(name), "ID") };
    return { endpoint, body };
  }
  const body: IDataObject = { action: operation, async: true };
  const add = (name: string) => {
    body[apiName(name)] = field(name, get(name));
  };
  if (resource === "generation") {
    const input = get("generationInput", "prompt");
    if (!["prompt", "imageUrl", "imageUrls"].includes(String(input)))
      throw new Error("Select a generation input");
    add(String(input));
  } else if (operation === "import") {
    add("modelUrl");
  } else if (operation === "retarget") {
    add("modelId");
    add(
      get("animationSource", "animation") === "animations"
        ? "animations"
        : "animation",
    );
  } else {
    add(get("modelSource", "modelId") === "modelUrl" ? "modelUrl" : "modelId");
    if (operation === "convert") add("format");
  }
  const options = context.getNodeParameter("options", index, {}) as IDataObject;
  for (const property of optionalFields[operation]) {
    if (Object.prototype.hasOwnProperty.call(options, property.name))
      body[apiName(property.name)] = field(
        property.name,
        options[property.name],
        property,
      );
  }
  return { endpoint, body };
}
