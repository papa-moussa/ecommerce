interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps): JSX.Element {
  // MED-07 (Audit-2): escape </ to prevent </script> from breaking out of the JSON-LD context
  const safeJson = JSON.stringify(data).replace(/<\//g, '<\\/');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />;
}
