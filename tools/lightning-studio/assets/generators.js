(function () {
  function pascalCase(value) {
    return value
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join("");
  }

  function camelCase(value) {
    const normalized = pascalCase(value);
    return normalized ? normalized.charAt(0).toLowerCase() + normalized.slice(1) : "fieldValue";
  }

  function singularize(value) {
    return value.endsWith("s") ? value.slice(0, -1) : value;
  }

  function inferApexType(value) {
    if (typeof value === "string") return "String";
    if (typeof value === "boolean") return "Boolean";
    if (typeof value === "number") return Number.isInteger(value) ? "Integer" : "Decimal";
    return "Object";
  }

  function indentBlock(value, level) {
    return value
      .split("\n")
      .map((line) => `${"  ".repeat(level || 1)}${line}`)
      .join("\n");
  }

  function buildObjectMembers(className, value, seen) {
    const fields = Object.entries(value)
      .map(([key, childValue]) => {
        const propertyName = camelCase(key);

        if (Array.isArray(childValue)) {
          const firstItem = childValue.find((item) => item !== null);
          if (!firstItem) return `public List<Object> ${propertyName};`;
          if (typeof firstItem === "object" && !Array.isArray(firstItem)) {
            return `public List<${pascalCase(singularize(key)) || `${className}Item`}> ${propertyName};`;
          }
          return `public List<${inferApexType(firstItem)}> ${propertyName};`;
        }

        if (typeof childValue === "object" && childValue !== null) {
          return `public ${pascalCase(key) || `${className}Details`} ${propertyName};`;
        }

        return `public ${inferApexType(childValue)} ${propertyName};`;
      })
      .join("\n");

    const nested = [];

    Object.entries(value).forEach(([key, childValue]) => {
      if (Array.isArray(childValue)) {
        const firstItem = childValue.find((item) => item !== null);
        if (firstItem && typeof firstItem === "object" && !Array.isArray(firstItem)) {
          const childClassName = pascalCase(singularize(key)) || `${className}Item`;
          if (!seen.has(childClassName)) {
            seen.add(childClassName);
            const childBody = buildObjectMembers(childClassName, firstItem, seen);
            nested.push(
              `public class ${childClassName} {\n${indentBlock(childBody.fields)}${
                childBody.nested.length ? `\n\n${indentBlock(childBody.nested.join("\n\n"))}` : ""
              }\n}`
            );
          }
        }
      } else if (typeof childValue === "object" && childValue !== null) {
        const childClassName = pascalCase(key) || `${className}Details`;
        if (!seen.has(childClassName)) {
          seen.add(childClassName);
          const childBody = buildObjectMembers(childClassName, childValue, seen);
          nested.push(
            `public class ${childClassName} {\n${indentBlock(childBody.fields)}${
              childBody.nested.length ? `\n\n${indentBlock(childBody.nested.join("\n\n"))}` : ""
            }\n}`
          );
        }
      }
    });

    return { fields, nested };
  }

  function generateApexFromJson(className, input) {
    const normalizedClassName = pascalCase(className) || "RootResponse";
    let parsed;

    try {
      parsed = JSON.parse(input);
    } catch (error) {
      return { ok: false, error: error.message || "Invalid JSON input." };
    }

    if (Array.isArray(parsed)) {
      const firstItem = parsed.find((item) => item !== null);
      if (firstItem && typeof firstItem === "object" && !Array.isArray(firstItem)) {
        const seen = new Set([normalizedClassName]);
        const body = buildObjectMembers(normalizedClassName, firstItem, seen);
        return {
          ok: true,
          output: `public class ${normalizedClassName} {\n${indentBlock(body.fields)}\n\n  public static List<${normalizedClassName}> parse(String json) {\n    return (List<${normalizedClassName}>) JSON.deserialize(json, List<${normalizedClassName}>.class);\n  }${
            body.nested.length ? `\n\n${indentBlock(body.nested.join("\n\n"))}` : ""
          }\n}`
        };
      }

      return {
        ok: true,
        output: `public class ${normalizedClassName} {\n  public ${inferApexType(firstItem)} value;\n\n  public static List<${normalizedClassName}> parse(String json) {\n    return (List<${normalizedClassName}>) JSON.deserialize(json, List<${normalizedClassName}>.class);\n  }\n}`
      };
    }

    if (typeof parsed !== "object" || parsed === null) {
      return {
        ok: true,
        output: `public class ${normalizedClassName} {\n  public ${inferApexType(parsed)} value;\n\n  public static ${normalizedClassName} parse(String json) {\n    return (${normalizedClassName}) JSON.deserialize(json, ${normalizedClassName}.class);\n  }\n}`
      };
    }

    const seen = new Set([normalizedClassName]);
    const body = buildObjectMembers(normalizedClassName, parsed, seen);
    return {
      ok: true,
      output: `public class ${normalizedClassName} {\n${indentBlock(body.fields)}\n\n  public static ${normalizedClassName} parse(String json) {\n    return (${normalizedClassName}) JSON.deserialize(json, ${normalizedClassName}.class);\n  }${
        body.nested.length ? `\n\n${indentBlock(body.nested.join("\n\n"))}` : ""
      }\n}`
    };
  }

  function validateLwcName(name) {
    return /^[a-z][A-Za-z0-9]*$/.test(name);
  }

  function generateLwcBundle(options) {
    const className = options.componentName.charAt(0).toUpperCase() + options.componentName.slice(1);
    const targetXml = options.targets
      .map((target) => `        <target>${target}</target>`)
      .join("\n");
    const files = {
      [`${options.componentName}.html`]: `<template>\n  <lightning-card title="${options.description || options.componentName}">\n    <div class="slds-p-around_medium">\n      <p>${options.description || "Generated with Lightning Studio."}</p>\n    </div>\n  </lightning-card>\n</template>\n`,
      [`${options.componentName}.js`]: `import { LightningElement } from "lwc";\n\nexport default class ${className} extends LightningElement {}\n`,
      [`${options.componentName}.js-meta.xml`]: `<?xml version="1.0" encoding="UTF-8"?>\n<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">\n    <apiVersion>61.0</apiVersion>\n    <isExposed>${options.expose}</isExposed>\n${options.targets.length ? `    <targets>\n${targetXml}\n    </targets>\n` : ""}</LightningComponentBundle>\n`
    };

    if (options.includeCss) {
      files[`${options.componentName}.css`] = `:host {\n  display: block;\n}\n`;
    }

    if (options.includeTest) {
      files[`${options.componentName}.test.js`] = `import { createElement } from "lwc";\nimport ${className} from "c/${options.componentName}";\n\ndescribe("${options.componentName}", () => {\n  afterEach(() => {\n    while (document.body.firstChild) {\n      document.body.removeChild(document.body.firstChild);\n    }\n  });\n\n  it("renders", () => {\n    const element = createElement("c-${options.componentName}", {\n      is: ${className}\n    });\n    document.body.appendChild(element);\n    expect(element).toBeTruthy();\n  });\n});\n`;
    }

    return files;
  }

  function generateAuraBundle(options) {
    const files = {
      [`${options.bundleName}.cmp`]: `<aura:component description="${options.description || options.bundleName}" implements="flexipage:availableForAllPageTypes,force:appHostable">\n  <lightning:card title="${options.bundleName}">\n    <p class="slds-p-horizontal_medium">${options.description || "Generated with Lightning Studio."}</p>\n  </lightning:card>\n</aura:component>\n`
    };

    if (options.includeController) {
      files[`${options.bundleName}Controller.js`] = `({\n  doInit: function(component, event, helper) {\n    helper.initialize(component);\n  }\n})\n`;
    }
    if (options.includeHelper) {
      files[`${options.bundleName}Helper.js`] = `({\n  initialize: function(component) {\n    // Add helper logic here.\n  }\n})\n`;
    }
    if (options.includeStyle) {
      files[`${options.bundleName}.css`] = `.THIS {\n  display: block;\n}\n`;
    }
    if (options.includeRenderer) {
      files[`${options.bundleName}Renderer.js`] = `({\n  rerender: function(component, helper) {\n    this.superRerender();\n  }\n})\n`;
    }
    if (options.includeDocumentation) {
      files[`${options.bundleName}.auradoc`] = `<aura:documentation>\n  <aura:description>${options.description || "Aura bundle generated with Lightning Studio."}</aura:description>\n</aura:documentation>\n`;
    }

    return files;
  }

  function generateApexClassBundle(options) {
    const methods = options.methods.length
      ? options.methods
          .map(
            (method) =>
              `  public void ${method}() {\n    // TODO: Implement ${method}.\n  }`
          )
          .join("\n\n")
      : `  public ${options.className}() {\n    // Default constructor.\n  }`;

    const files = {
      [`${options.className}.cls`]: `${options.accessModifier} ${options.sharingModel} class ${options.className} {\n  /** ${options.purpose || "Generated with Lightning Studio."} */\n${methods}\n}\n`
    };

    if (options.includeTest) {
      files[`${options.className}Test.cls`] = `@IsTest\nprivate class ${options.className}Test {\n  @IsTest\n  static void coversGeneratedClass() {\n    Test.startTest();\n    ${options.className} subject = new ${options.className}();\n    System.assertNotEquals(null, subject);\n    Test.stopTest();\n  }\n}\n`;
    }

    return files;
  }

  function generateApexTriggerBundle(options) {
    const handlerName = `${options.triggerName}Handler`;
    const files = {
      [`${options.triggerName}.trigger`]: `trigger ${options.triggerName} on ${options.objectName} (${options.events.join(", ")}) {\n${options.includeHandler ? `  ${handlerName}.run(Trigger.operationType, Trigger.new, Trigger.oldMap);\n` : "  // TODO: Add trigger logic.\n"}}\n`
    };

    if (options.includeHandler) {
      files[`${handlerName}.cls`] = `public with sharing class ${handlerName} {\n  public static void run(System.TriggerOperation operationType, List<SObject> records, Map<Id, SObject> oldMap) {\n    switch on operationType {\n      when BEFORE_INSERT {\n        // TODO: before insert logic\n      }\n      when AFTER_INSERT {\n        // TODO: after insert logic\n      }\n      when else {\n        // TODO: handle other events\n      }\n    }\n  }\n}\n`;
    }

    return files;
  }

  function generateMessageChannelXml(name, description, fields) {
    const fieldXml = fields
      .map(
        (field) =>
          `    <lightningMessageFields>\n        <description>${field.description || field.name}</description>\n        <fieldName>${field.name}</fieldName>\n    </lightningMessageFields>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">\n    <masterLabel>${name}</masterLabel>\n    <description>${description || "Generated with Lightning Studio."}</description>\n${fieldXml}\n    <isExposed>true</isExposed>\n</LightningMessageChannel>\n`;
  }

  window.LightningStudioGenerators = {
    generateApexFromJson,
    validateLwcName,
    generateLwcBundle,
    generateAuraBundle,
    generateApexClassBundle,
    generateApexTriggerBundle,
    generateMessageChannelXml
  };
})();
