interface VideoPageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Video {id}</h1>
      <p className="text-muted-foreground">
        This page would display the video player for video with ID: {id}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Note: In a real implementation, you would fetch the video data using the
        ID and display the video player.
      </p>
    </div>
  );
}
