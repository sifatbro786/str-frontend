"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, Toggle, Counter } from "./Fields";
import TagInput from "./TagInput";
import FormSection from "./FormSection";

const EMPTY = {
  title: "", excerpt: "", content: "", coverImage: "", category: "",
  tags: [], isPublished: false, metaTitle: "", metaDescription: "",
};

/**
 * `author` is deliberately not a field: the API sets it from the authenticated
 * user on create and refuses it on update (immutable list).
 *
 * `publishedAt` is likewise never sent — the model's pre("findOneAndUpdate")
 * hook owns it, and a form value would fight that hook.
 */
export default function BlogForm({ mode, id, initial }) {
  const router = useRouter();
  const toast = useToast();

  const [values, setValues] = useState(() => ({ ...EMPTY, ...(initial ?? {}) }));
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = (key) => (v) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setDirty(true);
  };
  const onInput = (key) => (e) => set(key)(e.target.value);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSummary("");

    const payload = { ...values };
    delete payload.slug;
    delete payload._id;
    delete payload.author;
    delete payload.viewCount;
    delete payload.publishedAt;

    try {
      if (mode === "create") await api.create("blogs", payload);
      else await api.update("blogs", id, payload);

      setDirty(false);
      revalidate("blogs");
      toast.success(mode === "create" ? "Article created." : "Saved.");
      router.push("/admin/blogs");
    } catch (err) {
      if (Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setSummary(err.message || "Could not save this article.");
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

      <FormSection title="Article">
        <Field label="Title" htmlFor="title" required error={errors.title} className="sm:col-span-2">
          <Input
            id="title"
            value={values.title}
            onChange={onInput("title")}
            error={errors.title}
            maxLength={180}
          />
        </Field>
        <Field
          label="Excerpt"
          htmlFor="excerpt"
          error={errors.excerpt}
          hint={<Counter value={values.excerpt} max={400} />}
          className="sm:col-span-2"
        >
          <Textarea
            id="excerpt"
            rows={3}
            maxLength={400}
            value={values.excerpt}
            onChange={onInput("excerpt")}
            error={errors.excerpt}
          />
        </Field>
        <Field
          label="Content (HTML)"
          htmlFor="content"
          required
          error={errors.content}
          hint="HTML is sanitized server-side on save; script, style, inline handlers and style attributes are stripped."
          className="sm:col-span-2"
        >
          <Textarea
            id="content"
            rows={24}
            value={values.content}
            onChange={onInput("content")}
            error={errors.content}
            className="font-mono text-[0.8125rem]"
          />
        </Field>
      </FormSection>

      <FormSection title="Classification">
        <Field label="Category" htmlFor="category" error={errors.category}>
          <Input id="category" value={values.category} onChange={onInput("category")} />
        </Field>
        <Field label="Cover image" htmlFor="coverImage" error={errors.coverImage}>
          <Input
            id="coverImage"
            value={values.coverImage}
            onChange={onInput("coverImage")}
            placeholder="/blog/cover.jpg"
          />
        </Field>
        <Field label="Tags" htmlFor="tags" error={errors.tags} className="sm:col-span-2">
          <TagInput id="tags" value={values.tags} onChange={set("tags")} />
        </Field>
        <div className="flex items-end pb-2.5">
          <Toggle
            id="isPublished"
            checked={values.isPublished}
            onChange={set("isPublished")}
            label="Published"
          />
        </div>
      </FormSection>

      <FormSection title="SEO">
        <Field label="Meta title" htmlFor="metaTitle" error={errors.metaTitle}>
          <Input id="metaTitle" value={values.metaTitle} onChange={onInput("metaTitle")} />
        </Field>
        <Field
          label="Meta description"
          htmlFor="metaDescription"
          error={errors.metaDescription}
          hint={<Counter value={values.metaDescription} max={160} />}
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
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand px-8 py-3.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create article" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blogs")}
          className="label-mono border border-(--line) px-5 py-3.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
        >
          Cancel
        </button>
        {dirty && <span className="label-mono text-(--text-mute)">Unsaved changes</span>}
      </div>
    </form>
  );
}
