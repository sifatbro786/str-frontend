"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, Select, NumberInput, Toggle, Counter } from "./Fields";
import TagInput from "./TagInput";
import MultiSelect from "./MultiSelect";
import RepeatableRows, { stripKeys } from "./RepeatableRows";
import FormSection from "./FormSection";
import { cn } from "@/lib/utils";

/** Absolute-URL fields: the API rejects "" and bare domains, so blanks are stripped. */
const URL_FIELDS = ["liveUrl", "githubUrl", "figmaUrl", "appStoreUrl", "playStoreUrl"];

const TECH_COLUMNS = [
  { key: "name", label: "Name", required: true, placeholder: "Next.js" },
  { key: "icon", label: "Icon", placeholder: "lucide key" },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: [
      { value: "", label: "—" },
      { value: "frontend", label: "Frontend" },
      { value: "backend", label: "Backend" },
      { value: "devops", label: "DevOps" },
      { value: "design", label: "Design" },
      { value: "data", label: "Data" },
    ],
  },
];

const GALLERY_COLUMNS = [
  { key: "url", label: "URL", required: true, placeholder: "/websites/paarel-website.png" },
  { key: "caption", label: "Caption" },
  {
    key: "layoutType",
    label: "Layout",
    type: "select",
    options: [
      { value: "full", label: "Full" },
      { value: "half", label: "Half" },
      { value: "grid", label: "Grid" },
    ],
  },
];

const EMPTY = {
  title: "", subtitle: "", clientName: "", projectDate: "", shortDescription: "",
  serviceTypes: [], tags: [], deliverables: [], fullCaseStudy: "",
  techStack: [], liveUrl: "", githubUrl: "", figmaUrl: "", appStoreUrl: "", playStoreUrl: "",
  coverImage: "", thumbnailImage: "", galleryImages: [],
  accentColor: "#1476BE", layoutStyle: "full-width", animationTrigger: "fade-up",
  featured: false, displayOrder: 0,
  metaTitle: "", metaDescription: "", ogImage: "",
};

/** ISO date to yyyy-mm-dd for <input type="date">. */
function toDateInput(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default function ProjectForm({ mode, id, initial }) {
  const router = useRouter();
  const toast = useToast();

  const [values, setValues] = useState(() => ({
    ...EMPTY,
    ...(initial ?? {}),
    projectDate: toDateInput(initial?.projectDate),
  }));
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = (key) => (v) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setDirty(true);
  };
  const onInput = (key) => (e) => set(key)(e.target.value);

  // Warn before losing unsaved edits. Removed the moment the form is saved.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const accentValid = useMemo(
    () => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(values.accentColor),
    [values.accentColor]
  );

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSummary("");

    const payload = { ...values };

    // Never send an empty string where the API expects an absolute URL — the
    // isURL validator rejects "" unless the field is omitted. Strip blanks.
    for (const k of URL_FIELDS) {
      if (!payload[k]) delete payload[k];
    }
    if (!payload.projectDate) delete payload.projectDate;

    // _key is a client-side render key; it must never reach the API.
    payload.techStack = stripKeys(payload.techStack);
    payload.galleryImages = stripKeys(payload.galleryImages);

    // slug is derived server-side from title; sending it is stripped by the
    // immutable guard, so it is not a form field at all.
    delete payload.slug;
    delete payload._id;

    try {
      if (mode === "create") await api.create("projects", payload);
      else await api.update("projects", id, payload);

      setDirty(false);
      revalidate("projects");
      toast.success(mode === "create" ? "Project created." : "Saved.");
      router.push("/admin/projects");
    } catch (err) {
      // The API returns { message, details: [{ field, message }] } on a 400.
      // Map details onto field state so each error lands under its own input;
      // the top-level message is the summary. Never render raw JSON.
      if (Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setSummary(err.message || "Could not save this project.");
      toast.error(err.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-4xl space-y-10">
      {summary && (
        <p role="alert" className="label-mono border-l-2 border-signal py-1 pl-3 text-signal">
          {summary}
        </p>
      )}

      <FormSection title="Identity">
        <Field label="Title" htmlFor="title" required error={errors.title} className="sm:col-span-2">
          <Input
            id="title"
            value={values.title}
            onChange={onInput("title")}
            error={errors.title}
            maxLength={160}
          />
        </Field>
        <Field label="Subtitle" htmlFor="subtitle" error={errors.subtitle}>
          <Input id="subtitle" value={values.subtitle} onChange={onInput("subtitle")} />
        </Field>
        <Field label="Client name" htmlFor="clientName" error={errors.clientName}>
          <Input id="clientName" value={values.clientName} onChange={onInput("clientName")} />
        </Field>
        <Field label="Project date" htmlFor="projectDate" error={errors.projectDate}>
          <Input
            id="projectDate"
            type="date"
            value={values.projectDate}
            onChange={onInput("projectDate")}
          />
        </Field>
        <Field
          label="Short description"
          htmlFor="shortDescription"
          error={errors.shortDescription}
          hint={<Counter value={values.shortDescription} max={400} />}
          className="sm:col-span-2"
        >
          <Textarea
            id="shortDescription"
            rows={3}
            maxLength={400}
            value={values.shortDescription}
            onChange={onInput("shortDescription")}
            error={errors.shortDescription}
          />
        </Field>
      </FormSection>

      <FormSection title="Classification">
        <Field
          label="Service types"
          htmlFor="serviceTypes"
          required
          error={errors.serviceTypes}
          className="sm:col-span-2"
        >
          <MultiSelect value={values.serviceTypes} onChange={set("serviceTypes")} />
        </Field>
        <Field label="Tags" htmlFor="tags" error={errors.tags}>
          <TagInput id="tags" value={values.tags} onChange={set("tags")} max={24} />
        </Field>
        <Field label="Deliverables" htmlFor="deliverables" error={errors.deliverables}>
          <TagInput id="deliverables" value={values.deliverables} onChange={set("deliverables")} />
        </Field>
      </FormSection>

      <FormSection title="Case study">
        <Field
          label="Full case study (HTML)"
          htmlFor="fullCaseStudy"
          error={errors.fullCaseStudy}
          hint="HTML is sanitized server-side on save; script, style, inline handlers and style attributes are stripped."
          className="sm:col-span-2"
        >
          <Textarea
            id="fullCaseStudy"
            rows={20}
            value={values.fullCaseStudy}
            onChange={onInput("fullCaseStudy")}
            className="font-mono text-[0.8125rem]"
          />
        </Field>
      </FormSection>

      <FormSection title="Tech stack">
        <div className="sm:col-span-2">
          <RepeatableRows
            value={values.techStack}
            onChange={set("techStack")}
            columns={TECH_COLUMNS}
            newRow={{ name: "", icon: "", category: "" }}
            max={32}
            addLabel="Add technology"
          />
        </div>
      </FormSection>

      <FormSection
        title="Links"
        hint="All must be absolute (https://...) or left empty — the API rejects bare domains."
      >
        {URL_FIELDS.map((f) => (
          <Field key={f} label={f.replace("Url", " URL")} htmlFor={f} error={errors[f]}>
            <Input
              id={f}
              type="url"
              value={values[f]}
              onChange={onInput(f)}
              error={errors[f]}
              placeholder="https://"
            />
          </Field>
        ))}
      </FormSection>

      <FormSection
        title="Media"
        hint="A path under /public such as /websites/paarel-website.png, or an absolute URL."
      >
        <Field label="Cover image" htmlFor="coverImage" error={errors.coverImage}>
          <Input id="coverImage" value={values.coverImage} onChange={onInput("coverImage")} />
        </Field>
        <Field label="Thumbnail image" htmlFor="thumbnailImage" error={errors.thumbnailImage}>
          <Input
            id="thumbnailImage"
            value={values.thumbnailImage}
            onChange={onInput("thumbnailImage")}
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="label-mono mb-2 text-(--text-mute)">Gallery images</p>
          <RepeatableRows
            value={values.galleryImages}
            onChange={set("galleryImages")}
            columns={GALLERY_COLUMNS}
            newRow={{ url: "", caption: "", layoutType: "full" }}
            max={40}
            addLabel="Add image"
          />
        </div>
      </FormSection>

      <FormSection
        title="Presentation"
        hint="Consumed by the GSAP engine in Phase 5; stored and returned but unused today."
      >
        <Field label="Accent colour" htmlFor="accentColor" error={errors.accentColor}>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Accent colour picker"
              value={accentValid ? values.accentColor : "#1476BE"}
              onChange={onInput("accentColor")}
              className="size-10 shrink-0 cursor-pointer border border-(--line) bg-transparent"
            />
            <Input
              id="accentColor"
              value={values.accentColor}
              onChange={onInput("accentColor")}
              error={errors.accentColor}
              placeholder="#1476BE"
              className={cn(!accentValid && values.accentColor && "border-signal")}
            />
          </div>
        </Field>
        <Field label="Layout style" htmlFor="layoutStyle" error={errors.layoutStyle}>
          <Select
            id="layoutStyle"
            value={values.layoutStyle}
            onChange={onInput("layoutStyle")}
            options={[
              { value: "full-width", label: "Full width" },
              { value: "bento", label: "Bento" },
              { value: "split", label: "Split" },
            ]}
          />
        </Field>
        <Field label="Animation trigger" htmlFor="animationTrigger" error={errors.animationTrigger}>
          <Select
            id="animationTrigger"
            value={values.animationTrigger}
            onChange={onInput("animationTrigger")}
            options={[
              { value: "fade-up", label: "Fade up" },
              { value: "pinned-scroll", label: "Pinned scroll" },
              { value: "3d-tilt", label: "3D tilt" },
            ]}
          />
        </Field>
        <Field label="Display order" htmlFor="displayOrder" error={errors.displayOrder}>
          <NumberInput
            id="displayOrder"
            min={0}
            max={9999}
            value={values.displayOrder}
            onChange={(e) => set("displayOrder")(e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </Field>
        <div className="flex items-end pb-2.5">
          <Toggle
            id="featured"
            checked={values.featured}
            onChange={set("featured")}
            label="Featured project"
          />
        </div>
      </FormSection>

      <FormSection title="SEO">
        <Field label="Meta title" htmlFor="metaTitle" error={errors.metaTitle}>
          <Input id="metaTitle" value={values.metaTitle} onChange={onInput("metaTitle")} />
        </Field>
        <Field label="OG image" htmlFor="ogImage" error={errors.ogImage}>
          <Input id="ogImage" value={values.ogImage} onChange={onInput("ogImage")} />
        </Field>
        <Field
          label="Meta description"
          htmlFor="metaDescription"
          error={errors.metaDescription}
          hint={<Counter value={values.metaDescription} max={160} />}
          className="sm:col-span-2"
        >
          <Textarea
            id="metaDescription"
            rows={2}
            value={values.metaDescription}
            onChange={onInput("metaDescription")}
          />
        </Field>
      </FormSection>

      <div className="flex flex-wrap items-center gap-4 border-t border-(--line) pt-8">
        {/* Disabled on submitting only — never on invalid. A button that is dead
            with no explanation is the most common a11y failure on forms. */}
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand px-8 py-3.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create project" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          className="label-mono border border-(--line) px-5 py-3.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
        >
          Cancel
        </button>
        {dirty && <span className="label-mono text-(--text-mute)">Unsaved changes</span>}
      </div>
    </form>
  );
}
