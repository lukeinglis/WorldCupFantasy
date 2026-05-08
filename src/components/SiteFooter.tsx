import Container from "./Container";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-dark/50 py-8">
      <Container>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <span aria-hidden className="text-lg">⚽</span>
            <span className="font-heading text-sm font-semibold uppercase tracking-wide">
              World Cup 2026 Fantasy
            </span>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-500">
              USA · Mexico · Canada
            </p>
            <p className="text-xs text-gray-600 mt-1">
              June 11 to July 19, 2026
            </p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            A friendly fantasy contest among friends. Not affiliated with FIFA.
          </p>
        </div>
      </Container>
    </footer>
  );
}
