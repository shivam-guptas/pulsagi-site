type AuraGeneratorInput = {
  bundleName: string;
  description: string;
  includeController: boolean;
  includeHelper: boolean;
  includeStyle: boolean;
  includeRenderer: boolean;
  includeDocumentation: boolean;
};

export function generateAuraBundle(input: AuraGeneratorInput) {
  const files: Record<string, string> = {
    [`${input.bundleName}.cmp`]: `<aura:component description="${input.description || input.bundleName}" implements="flexipage:availableForAllPageTypes,force:appHostable">\n  <lightning:card title="${input.bundleName}">\n    <p class="slds-p-horizontal_medium">${input.description || "Generated with Lightning Studio."}</p>\n  </lightning:card>\n</aura:component>\n`
  };

  if (input.includeController) {
    files[`${input.bundleName}Controller.js`] = `({\n  doInit: function(component, event, helper) {\n    helper.initialize(component);\n  }\n})\n`;
  }

  if (input.includeHelper) {
    files[`${input.bundleName}Helper.js`] = `({\n  initialize: function(component) {\n    // Add helper logic here.\n  }\n})\n`;
  }

  if (input.includeStyle) {
    files[`${input.bundleName}.css`] = `.THIS {\n  display: block;\n}\n`;
  }

  if (input.includeRenderer) {
    files[`${input.bundleName}Renderer.js`] = `({\n  rerender: function(component, helper) {\n    this.superRerender();\n  }\n})\n`;
  }

  if (input.includeDocumentation) {
    files[`${input.bundleName}.auradoc`] = `<aura:documentation>\n  <aura:description>${input.description || "Aura bundle generated with Lightning Studio."}</aura:description>\n</aura:documentation>\n`;
  }

  return files;
}
