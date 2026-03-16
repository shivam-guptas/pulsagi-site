type MarkupBuilderInput = {
  title: string;
  includeCard: boolean;
  includeInput: boolean;
  includeButton: boolean;
  includeGrid: boolean;
  includeDatatable: boolean;
};

export function generateMarkup(input: MarkupBuilderInput) {
  const sections: string[] = [];

  if (input.includeCard) {
    sections.push(`<lightning-card title="${input.title || "Studio Card"}">\n  <div class="slds-p-around_medium">\n    <p>Generated with Lightning Studio.</p>\n  </div>\n</lightning-card>`);
  }

  if (input.includeGrid) {
    sections.push(`<div class="slds-grid slds-wrap slds-gutters">\n  <div class="slds-col slds-size_1-of-2">\n    <lightning-input label="First value"></lightning-input>\n  </div>\n  <div class="slds-col slds-size_1-of-2">\n    <lightning-input label="Second value"></lightning-input>\n  </div>\n</div>`);
  }

  if (input.includeInput) {
    sections.push(`<lightning-input label="Account Name" value={accountName}></lightning-input>`);
  }

  if (input.includeButton) {
    sections.push(`<lightning-button variant="brand" label="Save" onclick={handleSave}></lightning-button>`);
  }

  if (input.includeDatatable) {
    sections.push(`<lightning-datatable\n  key-field="id"\n  data={rows}\n  columns={columns}\n  hide-checkbox-column>\n</lightning-datatable>`);
  }

  return `<template>\n${sections.map((section) => `  ${section.replace(/\n/g, "\n  ")}`).join("\n\n")}\n</template>\n`;
}
