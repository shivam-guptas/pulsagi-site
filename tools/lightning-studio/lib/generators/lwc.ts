type LwcGeneratorInput = {
  componentName: string;
  description: string;
  targets: string[];
  expose: boolean;
  includeCss: boolean;
  includeTest: boolean;
};

export function validateLwcName(name: string) {
  return /^[a-z][A-Za-z0-9]*$/.test(name);
}

export function generateLwcBundle(input: LwcGeneratorInput) {
  const xmlTargets = input.targets
    .map((target) => `        <target>${target}</target>`)
    .join("\n");

  const files: Record<string, string> = {
    [`${input.componentName}.html`]: `<template>\n  <lightning-card title="${input.description || input.componentName}">\n    <div class="slds-p-around_medium">\n      <p>${input.description || "Generated with Lightning Studio."}</p>\n    </div>\n  </lightning-card>\n</template>\n`,
    [`${input.componentName}.js`]: `import { LightningElement } from "lwc";\n\nexport default class ${input.componentName.charAt(0).toUpperCase() + input.componentName.slice(1)} extends LightningElement {}\n`,
    [`${input.componentName}.js-meta.xml`]: `<?xml version="1.0" encoding="UTF-8"?>\n<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">\n    <apiVersion>61.0</apiVersion>\n    <isExposed>${input.expose}</isExposed>\n${input.targets.length ? `    <targets>\n${xmlTargets}\n    </targets>\n` : ""}</LightningComponentBundle>\n`
  };

  if (input.includeCss) {
    files[`${input.componentName}.css`] = `:host {\n  display: block;\n}\n`;
  }

  if (input.includeTest) {
    files[`${input.componentName}.test.js`] = `import { createElement } from "lwc";\nimport ${input.componentName.charAt(0).toUpperCase() + input.componentName.slice(1)} from "c/${input.componentName}";\n\ndescribe("${input.componentName}", () => {\n  afterEach(() => {\n    while (document.body.firstChild) {\n      document.body.removeChild(document.body.firstChild);\n    }\n  });\n\n  it("renders", () => {\n    const element = createElement("c-${input.componentName}", {\n      is: ${input.componentName.charAt(0).toUpperCase() + input.componentName.slice(1)}\n    });\n\n    document.body.appendChild(element);\n    expect(element).toBeTruthy();\n  });\n});\n`;
  }

  return files;
}
