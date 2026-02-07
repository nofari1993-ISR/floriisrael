const AIBouquetEmbed = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">
          בנו את הזר המושלם עם AI 🌸
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          השתמשו בכלי החכם שלנו לעיצוב זר מותאם אישית
        </p>
        <div className="rounded-2xl overflow-hidden shadow-lg border border-border/50">
          <iframe
            src="https://nupharflowersai.base44.app/AIBouquetBuilderEmbed"
            title="AI Bouquet Builder"
            className="w-full border-0"
            style={{ height: "min(800px, 80vh)" }}
            allow="clipboard-write"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default AIBouquetEmbed;
