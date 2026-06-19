interface VideoPlayerProps {
  embedUrl: string;
  title: string;
}

export function VideoPlayer({ embedUrl, title }: VideoPlayerProps) {
  return (
    <div className="relative aspect-video w-full bg-black">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
