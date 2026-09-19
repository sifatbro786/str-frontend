"use client";

import { useEffect, useState } from "react";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, Counter } from "@/components/admin/Fields";
import TagInput from "@/components/admin/TagInput";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import ImageField from "@/components/admin/ImageField";

/**
 * Mirrors the PageMeta.pageIdentifier enum on the API, in nav order.
 *
 * ⚑ THREE PLACES MOVE TOGETHER. This list, IDENTIFIERS in
 * str-backend/src/validators/pageMeta.validator.js, and the schema enum in
 * str-backend/src/models/PageMeta.js. Add an id here only and the PUT is
 * rejected with a 400; add it to the validator only and Mongoose refuses the
 * write.
 *
 * ⚑ "overview" was dropped from all three. The route still exists — see
 * app/(public)/overview/page.js — but it renders the same page as /packages and
 * calls buildMetadata with identifier "packages", so it has no <head> of its
 * own to edit. Its stored row is now orphaned; the migration that goes with
 * this change is in that file's header.
 */
const IDENTIFIERS = [
  "home",
  "about",
  "services",
  "projects",
  "graphics",
  "packages",
  "blogs",
  "contact",
];

const PATHS = {
  home: "/",
  about: "/about",
  services: "/services",
  projects: "/projects",
  // Not in the navbar by design; reachable by direct URL and via the sitemap.
  graphics: "/graphics",
  // ⚑ This row also drives /overview, which renders the same page under the
  // old address and canonicalises here. One row, two routes — there is no
  // second row to edit, and there should not be.
  // ⚑ Whatever is stored here was written for the old bilingual BDT catalogue.
  // It still wins over the code fallbacks, so it needs rewriting for the page
  // that is actually on this route now.
  packages: "/packages",
  blogs: "/blogs",
  contact: "/contact",
};

/**
 * What the public site will actually put in <title>.
 *
 * ⚑ Mirrors withBrand() in lib/seo.js. The field the author types into is NOT
 * the title: seo.js appends " | STR Solutions" unless the value already names
 * the brand. Showing the raw field in the preview below is how a 76-character
 * title used to pass a form that said it was fine, so the preview renders this
 * instead and the counter caps the FIELD at 44 (44 + 16 = 60).
 *
 * If TITLE_BRAND changes in lib/seo.js, change TITLE_MAX here and the
 * isLength cap in str-backend/src/validators/pageMeta.validator.js with it.
 */
const TITLE_BRAND = site.name;
const TITLE_MAX = 44;
const SERP_TITLE_MAX = 60;

function brandedTitle(value) {
  const v = String(value ?? "").trim();
  if (!v) return `${site.legalName} — ${site.tagline}`;
  return v.toLowerCase().includes(TITLE_BRAND.toLowerCase()) ? v : `${v} | ${TITLE_BRAND}`;
}

const EMPTY = {
  metaTitle: "", metaDescription: "", keywords: [], ogImage: "",
  dynamicHeroHeadline: "", dynamicHeroSubtitle: "",
};

export default function PageMetaAdminPage() {
  const [selected, setSelected] = useState("home");
  const [byId, setById] = useState({});
  const [draft, setDraft] = useState(EMPTY);
  const [status, setStatus] = useState("loading");
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // All rows load once; the left rail then switches between them with no fetch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await api.list("page-meta");
        if (cancelled) return;
        const map = Object.fromEntries((payload.data ?? []).map((r) => [r.pageIdentifier, r]));
        setById(map);
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setSummary(err.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A page that has never been saved simply has no row yet — render empty
  // fields, not an error. PUT is an upsert keyed on the identifier.
  useEffect(() => {
    setDraft({ ...EMPTY, ...(byId[selected] ?? {}) });
    setErrors({});
    setSummary("");
  }, [selected, byId]);

  const set = (key) => (v) => setDraft((prev) => ({ ...prev, [key]: v }));
  const onInput = (key) => (e) => set(key)(e.target.value);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setSummary("");

    const payload = { ...draft };
    delete payload._id;
    delete payload.pageIdentifier;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;

    try {
      // PUT, not PATCH: the endpoint is an upsert keyed on the identifier, not
      // a patch on an _id.
      const res = await api.put("page-meta", selected, payload);
      setById((prev) => ({ ...prev, [selected]: res.data }));
      revalidate("page-meta");
      toast.success(`Saved meta for /${selected === "home" ? "" : selected}.`);
    } catch (err) {
      if (Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setSummary(err.message || "Could not save this page meta.");
      toast.error(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const descLong = (draft.metaDescription ?? "").length > 160;
  const renderedTitle = brandedTitle(draft.metaTitle);
  const titleLong = renderedTitle.length > SERP_TITLE_MAX;
  const previewUrl = `${site.url.replace("https://", "")}${PATHS[selected]}`;

  if (status === "loading") {
    return <p className="label-mono text-(--text-mute)">Loading…</p>;
  }

  return (
    <div className="grid gap-px bg-(--line) lg:grid-cols-[14rem_1fr]">
      {/* Left rail: one entry per identifier in the API enum. */}
      <nav aria-label="Pages" className="bg-(--canvas)">
        <ul>
          {IDENTIFIERS.map((id) => {
            const active = id === selected;
            const saved = Boolean(byId[id]);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setSelected(id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between border-l-2 px-5 py-3 text-left text-[0.9375rem] transition-colors",
                    active
                      ? "border-signal bg-(--raised-2) font-medium text-(--text)"
                      : "border-transparent text-(--text-mute) hover:bg-(--raised-2) hover:text-(--text)"
                  )}
                >
                  <span>{PATHS[id]}</span>
                  {!saved && <span className="label-mono text-(--text-mute)">empty</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Right pane: editor for the selected identifier. */}
      <form onSubmit={save} noValidate className="space-y-8 bg-(--canvas) p-5 lg:p-8">
        {summary && (
          <p role="alert" className="label-mono border-l-2 border-signal py-1 pl-3 text-signal">
            {summary}
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Meta title"
            htmlFor="pm-title"
            error={errors.metaTitle}
            hint={<Counter value={draft.metaTitle} max={TITLE_MAX} />}
            className="sm:col-span-2"
          >
            <Input id="pm-title" value={draft.metaTitle} onChange={onInput("metaTitle")} />
          </Field>
          {titleLong && (
            <p className="label-mono -mt-2 text-signal sm:col-span-2">
              The rendered title is {renderedTitle.length} characters — Google will truncate
              past {SERP_TITLE_MAX}. Do not type the company name into this field; the site
              appends it.
            </p>
          )}
          <Field
            label="Meta description"
            htmlFor="pm-desc"
            error={errors.metaDescription}
            hint={<Counter value={draft.metaDescription} max={160} />}
            className="sm:col-span-2"
          >
            <Textarea id="pm-desc" rows={3} value={draft.metaDescription} onChange={onInput("metaDescription")} />
          </Field>
          {descLong && (
            <p className="label-mono -mt-2 text-signal sm:col-span-2">
              Over 160 characters — Google will truncate this.
            </p>
          )}
          <Field label="Keywords" htmlFor="pm-keywords" error={errors.keywords} className="sm:col-span-2">
            <TagInput id="pm-keywords" value={draft.keywords} onChange={set("keywords")} />
          </Field>
          <Field
            label="OG image"
            error={errors.ogImage}
            hint="The social share card for this page. 1200x630 renders without cropping on every platform."
            className="sm:col-span-2"
          >
            <ImageField value={draft.ogImage} onChange={set("ogImage")} folder="misc" />
          </Field>
          <Field label="Hero headline" htmlFor="pm-headline" error={errors.dynamicHeroHeadline}>
            <Input
              id="pm-headline"
              value={draft.dynamicHeroHeadline}
              onChange={onInput("dynamicHeroHeadline")}
            />
          </Field>
          <Field label="Hero subtitle" htmlFor="pm-subtitle" error={errors.dynamicHeroSubtitle}>
            <Input
              id="pm-subtitle"
              value={draft.dynamicHeroSubtitle}
              onChange={onInput("dynamicHeroSubtitle")}
            />
          </Field>
        </div>

        {/* Live SERP preview. Same tokens as the rest of the panel; static. */}
        <section className="border border-(--line) p-5">
          <h2 className="label-mono text-(--text-mute)">Search preview</h2>
          <div className="mt-4 max-w-2xl">
            <p className="label-mono text-(--text-mute)">{previewUrl}</p>
            {/* The BRANDED title, not the raw field — this is the string that
                ends up in <title>, brand suffix and all. Truncated at the same
                point Google truncates, so an over-long value is visible here
                rather than only in the SERP three weeks later. */}
            <p className="mt-1.5 text-[1.125rem] leading-snug text-brand">
              {renderedTitle.slice(0, SERP_TITLE_MAX)}
              {titleLong && "…"}
            </p>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-(--text-mute)">
              {(draft.metaDescription || site.description).slice(0, 160)}
              {descLong && "…"}
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-(--line) pt-6">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save page meta"}
          </button>
          <span className="label-mono text-(--text-mute)">
            Upsert — a page with no row yet is created on save.
          </span>
        </div>
      </form>
    </div>
  );
}
