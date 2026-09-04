type SectionPageProps = {
  title: string;
  description: string;
};

export function SectionPage({ title, description }: SectionPageProps) {
  return (
    <section className="section-page">
      <span className="eyebrow eyebrow--gold">СТАРШИЙ БРАТ</span>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
    </section>
  );
}
