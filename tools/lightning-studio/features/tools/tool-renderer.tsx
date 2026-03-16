import { ApexFormatterTool, JsonFormatterTool, JsonToApexTool, SoqlFormatterTool, XmlFormatterTool } from "@/features/formatters/formatter-tools";
import { ApexClassGeneratorTool, ApexTriggerGeneratorTool, AuraGeneratorTool, LightningMessageChannelGeneratorTool, LwcGeneratorTool } from "@/features/generators/generator-tools";
import { GovernorLimitAnalyzerTool, LogInspectorTool, MetadataDiffTool } from "@/features/analyzers/analysis-tools";
import { GraphqlExplorerTool, RestApiExplorerTool } from "@/features/explorers/explorer-tools";
import { SalesforceMarkupBuilderTool } from "@/features/builders/markup-builder-tool";

export function ToolRenderer({ slug }: { slug: string }) {
  switch (slug) {
    case "apex-formatter":
      return <ApexFormatterTool />;
    case "soql-formatter":
      return <SoqlFormatterTool />;
    case "json-formatter":
      return <JsonFormatterTool />;
    case "xml-formatter":
      return <XmlFormatterTool />;
    case "json-to-apex":
      return <JsonToApexTool />;
    case "lwc-generator":
      return <LwcGeneratorTool />;
    case "aura-generator":
      return <AuraGeneratorTool />;
    case "apex-class-generator":
      return <ApexClassGeneratorTool />;
    case "apex-trigger-generator":
      return <ApexTriggerGeneratorTool />;
    case "lightning-message-channel-generator":
      return <LightningMessageChannelGeneratorTool />;
    case "log-inspector":
      return <LogInspectorTool />;
    case "governor-limit-analyzer":
      return <GovernorLimitAnalyzerTool />;
    case "metadata-diff":
      return <MetadataDiffTool />;
    case "rest-api-explorer":
      return <RestApiExplorerTool />;
    case "graphql-explorer":
      return <GraphqlExplorerTool />;
    case "salesforce-markup-builder":
      return <SalesforceMarkupBuilderTool />;
    default:
      return null;
  }
}
