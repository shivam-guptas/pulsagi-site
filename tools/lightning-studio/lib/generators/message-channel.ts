type MessageChannelField = {
  name: string;
  description: string;
};

export function generateMessageChannelXml(name: string, description: string, fields: MessageChannelField[]) {
  const fieldXml = fields
    .map(
      (field) =>
        `    <lightningMessageFields>\n        <description>${field.description || field.name}</description>\n        <fieldName>${field.name}</fieldName>\n    </lightningMessageFields>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">\n    <masterLabel>${name}</masterLabel>\n    <description>${description || "Generated with Lightning Studio."}</description>\n${fieldXml}\n    <isExposed>true</isExposed>\n</LightningMessageChannel>\n`;
}
