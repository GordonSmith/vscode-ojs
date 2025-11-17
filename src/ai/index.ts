import { ExtensionContext, lm } from "vscode";
import { PlotExpertTool } from "./plot-tool";
import { DataflowExpertTool } from "./dataflow-tool";

export function toolsActivate(context: ExtensionContext) {
    context.subscriptions.push(lm.registerTool("observable-plot-expert", new PlotExpertTool()));
    context.subscriptions.push(lm.registerTool("hpcc-dataflow-expert", new DataflowExpertTool()));
}
