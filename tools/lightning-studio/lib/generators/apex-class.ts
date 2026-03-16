type ApexClassInput = {
  className: string;
  accessModifier: "public" | "global";
  sharingModel: "with sharing" | "without sharing" | "inherited sharing";
  purpose: string;
  methods: string[];
  includeTest: boolean;
};

export function generateApexClassBundle(input: ApexClassInput) {
  const classBody = input.methods.length
    ? input.methods
        .map(
          (method) =>
            `  public void ${method}() {\n    // TODO: Implement ${method}.\n  }`
        )
        .join("\n\n")
    : "  public " + input.className + "() {\n    // Default constructor.\n  }";

  const files: Record<string, string> = {
    [`${input.className}.cls`]: `${input.accessModifier} ${input.sharingModel} class ${input.className} {\n  /** ${input.purpose || "Generated with Lightning Studio."} */\n${classBody}\n}\n`
  };

  if (input.includeTest) {
    files[`${input.className}Test.cls`] = `@IsTest\nprivate class ${input.className}Test {\n  @IsTest\n  static void coversGeneratedClass() {\n    Test.startTest();\n    ${input.className} subject = new ${input.className}();\n    System.assertNotEquals(null, subject);\n    Test.stopTest();\n  }\n}\n`;
  }

  return files;
}
