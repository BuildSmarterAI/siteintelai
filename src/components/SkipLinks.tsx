export function SkipLinks() {
  return (
    <div className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50">
      <a 
        href="#main-content" 
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>
    </div>
  );
}
