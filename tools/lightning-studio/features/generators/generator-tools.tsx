"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FilesBundleViewer } from "@/components/common/files-bundle-viewer";
import { StatusCallout } from "@/components/common/status-callout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateApexClassBundle } from "@/lib/generators/apex-class";
import { generateApexTriggerBundle } from "@/lib/generators/apex-trigger";
import { generateAuraBundle } from "@/lib/generators/aura";
import { generateLwcBundle, validateLwcName } from "@/lib/generators/lwc";
import { generateMessageChannelXml } from "@/lib/generators/message-channel";

const lwcSchema = z.object({
  componentName: z
    .string()
    .min(2, "Component name is required.")
    .refine(validateLwcName, "Use lowerCamelCase without spaces or symbols."),
  description: z.string().optional(),
  targets: z.array(z.string()).min(1, "Pick at least one target."),
  expose: z.boolean().default(true),
  includeCss: z.boolean().default(true),
  includeTest: z.boolean().default(false)
});

const apexClassSchema = z.object({
  className: z
    .string()
    .min(2, "Class name is required.")
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Use a valid Apex class name."),
  accessModifier: z.enum(["public", "global"]),
  sharingModel: z.enum(["with sharing", "without sharing", "inherited sharing"]),
  purpose: z.string().optional(),
  methods: z.string().optional(),
  includeTest: z.boolean().default(true)
});

function GeneratorShell({
  title,
  description,
  form,
  status,
  output
}: {
  title: string;
  description: string;
  form: ReactNode;
  status: ReactNode;
  output: ReactNode;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="h-fit border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {status}
          {form}
        </CardContent>
      </Card>
      <div>{output}</div>
    </section>
  );
}

export function LwcGeneratorTool() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const form = useForm<z.infer<typeof lwcSchema>>({
    resolver: zodResolver(lwcSchema),
    defaultValues: {
      componentName: "studioSummary",
      description: "Summary card for Lightning Studio",
      targets: ["lightning__RecordPage", "lightning__AppPage"],
      expose: true,
      includeCss: true,
      includeTest: false
    }
  });

  const values = form.watch();

  return (
    <GeneratorShell
      title="LWC Generator"
      description="Generate a production-ready Lightning Web Component bundle with HTML, JavaScript, CSS, and meta XML output."
      status={
        <StatusCallout
          tone="info"
          title="Salesforce naming validation"
          description="Use lowerCamelCase component names. Lightning Studio validates names before generating files."
        />
      }
      form={
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((data) => setFiles(generateLwcBundle(data)))}
        >
          <div className="space-y-2">
            <Label htmlFor="lwc-name">Component name</Label>
            <Input id="lwc-name" {...form.register("componentName")} />
            <p className="text-xs text-red-300">{form.formState.errors.componentName?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lwc-description">Description</Label>
            <Input id="lwc-description" {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Targets</Label>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {[
                "lightning__AppPage",
                "lightning__RecordPage",
                "lightning__HomePage",
                "lightning__UtilityBar"
              ].map((target) => (
                <label key={target} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={target}
                    checked={values.targets?.includes(target)}
                    onChange={(event) => {
                      const nextTargets = event.target.checked
                        ? [...(values.targets ?? []), target]
                        : (values.targets ?? []).filter((item) => item !== target);
                      form.setValue("targets", nextTargets, { shouldValidate: true });
                    }}
                  />
                  {target}
                </label>
              ))}
            </div>
            <p className="text-xs text-red-300">{form.formState.errors.targets?.message}</p>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("expose")} />
              Expose component
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("includeCss")} />
              Include CSS scaffold
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("includeTest")} />
              Include Jest test scaffold
            </label>
          </div>
          <Button type="submit" className="w-full">
            Generate bundle
          </Button>
        </form>
      }
      output={
        Object.keys(files).length ? (
          <FilesBundleViewer files={files} />
        ) : (
          <StatusCallout
            tone="success"
            title="Bundle output appears here"
            description="Generate the bundle to review each file, copy contents, and download individual files."
          />
        )
      }
    />
  );
}

export function AuraGeneratorTool() {
  const [bundleName, setBundleName] = useState("StudioAuraPanel");
  const [description, setDescription] = useState("Aura bundle generated with Lightning Studio.");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [options, setOptions] = useState({
    includeController: true,
    includeHelper: true,
    includeStyle: true,
    includeRenderer: false,
    includeDocumentation: true
  });

  return (
    <GeneratorShell
      title="Aura Generator"
      description="Create Aura component bundles with the controller, helper, style, renderer, and docs files you actually want."
      status={
        <StatusCallout
          tone="info"
          title="Bundle-aware output"
          description="Use this when you need a fast Aura shell for legacy orgs or incremental migrations."
        />
      }
      form={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aura-name">Bundle name</Label>
            <Input id="aura-name" value={bundleName} onChange={(event) => setBundleName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aura-description">Description</Label>
            <Textarea
              id="aura-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            {[
              ["includeController", "Include controller"],
              ["includeHelper", "Include helper"],
              ["includeStyle", "Include style"],
              ["includeRenderer", "Include renderer"],
              ["includeDocumentation", "Include documentation"]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options[key as keyof typeof options]}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      [key]: event.target.checked
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() =>
              setFiles(
                generateAuraBundle({
                  bundleName,
                  description,
                  ...options
                })
              )
            }
          >
            Generate Aura bundle
          </Button>
        </div>
      }
      output={
        Object.keys(files).length ? (
          <FilesBundleViewer files={files} />
        ) : (
          <StatusCallout
            tone="success"
            title="Aura bundle preview"
            description="Turn on or off each file type, then generate the bundle to review every artifact."
          />
        )
      }
    />
  );
}

export function ApexClassGeneratorTool() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const form = useForm<z.infer<typeof apexClassSchema>>({
    resolver: zodResolver(apexClassSchema),
    defaultValues: {
      className: "InvoiceService",
      accessModifier: "public",
      sharingModel: "with sharing",
      purpose: "Coordinates invoice generation and persistence.",
      methods: "buildInvoices\nsyncPayments",
      includeTest: true
    }
  });

  return (
    <GeneratorShell
      title="Apex Class Generator"
      description="Build an Apex class shell with sharing rules, method stubs, and an optional test scaffold."
      status={
        <StatusCallout
          tone="info"
          title="Template for real projects"
          description="Use this for service, domain, utility, or integration classes and keep the generated output as a starting point."
        />
      }
      form={
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((data) =>
            setFiles(
              generateApexClassBundle({
                ...data,
                methods: data.methods
                  ?.split(/\r?\n/)
                  .map((value) => value.trim())
                  .filter(Boolean) ?? []
              })
            )
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="class-name">Class name</Label>
            <Input id="class-name" {...form.register("className")} />
            <p className="text-xs text-red-300">{form.formState.errors.className?.message}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="access-modifier">Access</Label>
              <Select id="access-modifier" {...form.register("accessModifier")}>
                <option value="public">public</option>
                <option value="global">global</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sharing-model">Sharing</Label>
              <Select id="sharing-model" {...form.register("sharingModel")}>
                <option value="with sharing">with sharing</option>
                <option value="without sharing">without sharing</option>
                <option value="inherited sharing">inherited sharing</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-purpose">Purpose</Label>
            <Textarea id="class-purpose" {...form.register("purpose")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-methods">Methods, one per line</Label>
            <Textarea id="class-methods" {...form.register("methods")} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" {...form.register("includeTest")} />
            Include test class
          </label>
          <Button type="submit" className="w-full">
            Generate Apex class
          </Button>
        </form>
      }
      output={
        Object.keys(files).length ? (
          <FilesBundleViewer files={files} language="java" />
        ) : (
          <StatusCallout
            tone="success"
            title="Class scaffold preview"
            description="Generate the class to review the Apex template and optional test file together."
          />
        )
      }
    />
  );
}

export function ApexTriggerGeneratorTool() {
  const [objectName, setObjectName] = useState("Account");
  const [triggerName, setTriggerName] = useState("AccountTrigger");
  const [events, setEvents] = useState(["before insert", "before update"]);
  const [includeHandler, setIncludeHandler] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>({});

  const availableEvents = useMemo(
    () => [
      "before insert",
      "before update",
      "before delete",
      "after insert",
      "after update",
      "after delete",
      "after undelete"
    ],
    []
  );

  return (
    <GeneratorShell
      title="Apex Trigger Generator"
      description="Generate a trigger shell with optional handler pattern scaffolding and selected trigger events."
      status={
        <StatusCallout
          tone="warning"
          title="Keep handlers focused"
          description="The generator gives you a clean starting point, but business logic should still live outside the trigger body."
        />
      }
      form={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigger-object">SObject API name</Label>
            <Input id="trigger-object" value={objectName} onChange={(event) => setObjectName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trigger-name">Trigger name</Label>
            <Input id="trigger-name" value={triggerName} onChange={(event) => setTriggerName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {availableEvents.map((eventName) => (
                <label key={eventName} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={events.includes(eventName)}
                    onChange={(event) =>
                      setEvents((current) =>
                        event.target.checked
                          ? [...current, eventName]
                          : current.filter((item) => item !== eventName)
                      )
                    }
                  />
                  {eventName}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeHandler}
              onChange={(event) => setIncludeHandler(event.target.checked)}
            />
            Include handler class
          </label>
          <Button
            type="button"
            className="w-full"
            onClick={() =>
              setFiles(
                generateApexTriggerBundle({
                  objectName,
                  triggerName,
                  events,
                  includeHandler
                })
              )
            }
          >
            Generate trigger
          </Button>
        </div>
      }
      output={
        Object.keys(files).length ? (
          <FilesBundleViewer files={files} language="java" />
        ) : (
          <StatusCallout
            tone="success"
            title="Trigger files appear here"
            description="Generate the trigger to review both the trigger body and the optional handler scaffold."
          />
        )
      }
    />
  );
}

export function LightningMessageChannelGeneratorTool() {
  const [name, setName] = useState("StudioMessage");
  const [description, setDescription] = useState("Message channel for Lightning Studio components.");
  const [fieldText, setFieldText] = useState("recordId:Primary record id\nstatus:Status change payload");
  const [files, setFiles] = useState<Record<string, string>>({});

  return (
    <GeneratorShell
      title="Lightning Message Channel Generator"
      description="Generate the metadata XML for a Lightning Message Channel with the fields your components need."
      status={
        <StatusCallout
          tone="info"
          title="Cross-framework messaging"
          description="Use message channels to coordinate LWC, Aura, and Visualforce without tightly coupling components."
        />
      }
      form={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lmc-name">Channel name</Label>
            <Input id="lmc-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lmc-description">Description</Label>
            <Textarea id="lmc-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lmc-fields">Fields, one per line as name:description</Label>
            <Textarea id="lmc-fields" value={fieldText} onChange={(event) => setFieldText(event.target.value)} />
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() =>
              setFiles({
                [`${name}.messageChannel-meta.xml`]: generateMessageChannelXml(
                  name,
                  description,
                  fieldText
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [fieldName, fieldDescription] = line.split(":");
                      return {
                        name: fieldName.trim(),
                        description: fieldDescription?.trim() || fieldName.trim()
                      };
                    })
                )
              })
            }
          >
            Generate channel XML
          </Button>
        </div>
      }
      output={
        Object.keys(files).length ? (
          <FilesBundleViewer files={files} language="xml" />
        ) : (
          <StatusCallout
            tone="success"
            title="Metadata XML preview"
            description="Generate the message channel to inspect the exact XML file before adding it to your Salesforce project."
          />
        )
      }
    />
  );
}
