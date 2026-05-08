import Container from "./Container";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export default function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  return (
    <section className="relative border-b border-white/10 bg-gradient-to-r from-navy-light via-navy to-navy-light overflow-hidden">
      <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <Container className="relative py-10 sm:py-14">
        <div className="animate-fade-in-up">
          {icon && (
            <span className="text-3xl mb-2 block" aria-hidden>{icon}</span>
          )}
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-lg text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </Container>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pitch/40 to-transparent" aria-hidden />
    </section>
  );
}
