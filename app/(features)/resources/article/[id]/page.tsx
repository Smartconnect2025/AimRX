interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Article {id}</h1>
      <p className="text-muted-foreground">
        This page would display the full article content for article with ID:{" "}
        {id}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Note: In a real implementation, you would fetch the article data using
        the ID and display the full content.
      </p>
    </div>
  );
}
