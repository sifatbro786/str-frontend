/**
 * One titled group of fields. Two columns on sm+, and a field can span both
 * with `className="sm:col-span-2"`.
 */
export default function FormSection({ title, hint, children }) {
  return (
    <section className="border-t border-(--line) pt-8 first:border-0 first:pt-0">
      <h2 className="label-mono text-(--text)">{title}</h2>
      {hint && <p className="mt-2 max-w-prose text-[0.8125rem] text-(--text-mute)">{hint}</p>}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}
