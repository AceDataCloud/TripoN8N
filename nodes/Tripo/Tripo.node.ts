import {
  NodeApiError,
  NodeConnectionTypes,
  NodeOperationError,
} from "n8n-workflow";
import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from "n8n-workflow";
import { properties } from "./properties";
import { buildRequest } from "./request";
import metadata from "./Tripo.node.json";

export class Tripo implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Tripo 3D by Ace Data Cloud",
    name: "tripo",
    icon: { light: "file:icon.png", dark: "file:icon.png" },
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      "Generate 3D assets, process and animate models, and retrieve Tripo tasks through Ace Data Cloud",
    defaults: { name: "Tripo 3D by Ace Data Cloud" },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [{ name: "aceDataTripoApi", required: true }],
    codex: {
      alias: metadata.alias,
      categories: metadata.categories,
      resources: metadata.resources,
    },
    properties,
  };
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const result: INodeExecutionData[] = [];
    for (let index = 0; index < this.getInputData().length; index++) {
      let sending = false;
      try {
        const { endpoint, body } = buildRequest(this, index);
        sending = true;
        const response = (await this.helpers.httpRequestWithAuthentication.call(
          this,
          "aceDataTripoApi",
          {
            method: "POST",
            url: "https://api.acedata.cloud" + endpoint,
            body,
            json: true,
            timeout: 60000,
          },
        )) as IDataObject;
        result.push({ json: response, pairedItem: { item: index } });
      } catch (error) {
        if (this.continueOnFail()) {
          result.push({
            json: { error: (error as Error).message },
            pairedItem: { item: index },
          });
        } else if (sending) {
          throw new NodeApiError(this.getNode(), error as JsonObject, {
            itemIndex: index,
          });
        } else {
          throw new NodeOperationError(this.getNode(), error as Error, {
            itemIndex: index,
          });
        }
      }
    }
    return [result];
  }
}
