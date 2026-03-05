export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-surface-2 rounded-full mb-4" />
        <div className="h-4 w-32 bg-surface-2 rounded" />
      </div>
    </div>
  );
}
