# Tripo 3D for n8n

Create a 3D asset from text or reference views, convert a model, or rig and animate it in n8n using Ace Data Cloud.

## Installation

In self-hosted n8n, open **Settings → Community nodes → Install**, enter `@acedatacloud/n8n-nodes-tripo`, then add **Tripo 3D** to a workflow.

## Credentials

Enable the [Tripo 3D service](https://platform.acedata.cloud/documents/tripo) for your application. Create the **Tripo 3D API** credential and paste your token from [Ace Data Cloud Applications](https://platform.acedata.cloud/console/applications) into **API Token**. The credential test queries a placeholder task ID.

## Use the node

| Resource | Operations |
| --- | --- |
| Generation | Generate from a text prompt, one image URL, or multiple views. For multiple views, provide front, left, back and right images in order. Use `null` to skip a view. |
| Model | Import a public HTTPS model URL, texture a model, or convert to GLTF, FBX, USDZ, OBJ, STL or 3MF. |
| Animation | Check rigging suitability, rig a model, or retarget one to five animation presets onto a rigged model. |
| Task | Get a task by ID or trace ID. Get Many accepts up to 100 task IDs or trace IDs. |

Each submission sends one asynchronous request per input item and returns the API's `task_id`. Set an optional HTTPS callback URL or poll **Task → Get** with that ID. A task is complete when `response.success` is a boolean. On success, use `response.data` for model download URLs, optional preview images, or rig-check results. A failed task contains `response.error`. Get Many keeps the original response with ordered `items`, including `null` for missing records, and `count`. Prices and available models are listed on the [Tripo service page](https://platform.acedata.cloud/documents/tripo).

Import [Query existing task](examples/query-existing-task.json) to retrieve a result. [Generate and wait](examples/generate-and-wait.json) submits one billable generation per input item and polls that task for up to 30 minutes. Select your credential on each Tripo node before running a workflow.

## Development

Run `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run lint`, and `pnpm test`. Run `bash scripts/smoke-docker.sh` to install the packed node into n8n and exercise a credential-free lookup.
