import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FAQSection({
  title = "Frequently asked questions",
  items
}: {
  title?: string;
  items: Array<{ question: string; answer: string }>;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-primary">FAQ</p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <Card key={item.question} className="bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg">{item.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
