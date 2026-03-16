type ApexTriggerInput = {
  objectName: string;
  triggerName: string;
  events: string[];
  includeHandler: boolean;
};

export function generateApexTriggerBundle(input: ApexTriggerInput) {
  const eventList = input.events.join(", ");
  const handlerName = `${input.triggerName}Handler`;

  const files: Record<string, string> = {
    [`${input.triggerName}.trigger`]: `trigger ${input.triggerName} on ${input.objectName} (${eventList}) {\n${input.includeHandler ? `  ${handlerName}.run(Trigger.operationType, Trigger.new, Trigger.oldMap);\n` : "  // TODO: Add trigger logic.\n"}}\n`
  };

  if (input.includeHandler) {
    files[`${handlerName}.cls`] = `public with sharing class ${handlerName} {\n  public static void run(System.TriggerOperation operationType, List<SObject> records, Map<Id, SObject> oldMap) {\n    switch on operationType {\n      when BEFORE_INSERT {\n        // TODO: before insert logic\n      }\n      when AFTER_INSERT {\n        // TODO: after insert logic\n      }\n      when else {\n        // TODO: handle other events\n      }\n    }\n  }\n}\n`;
  }

  return files;
}
