export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-gray-500">Coming soon — {title.toLowerCase()} management arrives in a later phase.</p>
    </div>
  );
}
