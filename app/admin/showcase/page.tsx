"use client";

import { useState } from "react";
import useSWR from "swr";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Category } from "@/lib/types";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  GripVertical,
  ImagePlus,
  ArrowUp,
  ArrowDown,
  Check,
  Plus,
  Filter,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS) as [Category, string][];

export default function AdminShowcasePage() {
  // ── Showcase (selected) images ──
  const { data: showcaseData, mutate: mutateShowcase } = useSWR('/api/showcase', fetcher);
  const showcaseImages = showcaseData?.showcaseImages;

  // ── Browse generations ──
  const [browseCategory, setBrowseCategory] = useState<string>("");
  const { data: generations, mutate: mutateGenerations } = useSWR(
    `/api/showcase/generations?limit=50${browseCategory ? `&category=${browseCategory}` : ''}`,
    fetcher
  );

  const [addingPath, setAddingPath] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddToShowcase = async (
    storagePath: string,
    category: string,
    title: string
  ) => {
    setAddingPath(storagePath);
    try {
      const nextOrder = showcaseImages ? showcaseImages.length : 0;
      const res = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          storage_path: storagePath,
          title: title || undefined,
          category,
          order: nextOrder,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل في الإضافة");
      }
      toast.success("تمت إضافة الصورة للمعرض");
      mutateShowcase();
      mutateGenerations();
    } catch (err: any) {
      console.error("Failed to add to showcase:", err);
      toast.error(err.message || "فشل في إضافة الصورة");
    } finally {
      setAddingPath(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/showcase?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("فشل في الحذف");
      toast.success("تم حذف الصورة من المعرض");
      mutateShowcase();
      mutateGenerations();
    } catch (err: any) {
      console.error("Failed to delete showcase image:", err);
      toast.error(err.message || "فشل في حذف الصورة");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (!showcaseImages || index <= 0) return;
    const current = showcaseImages[index];
    const prev = showcaseImages[index - 1];
    await Promise.all([
      fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', id: current.id ?? current._id, order: prev.display_order }),
      }),
      fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', id: prev.id ?? prev._id, order: current.display_order }),
      }),
    ]);
    mutateShowcase();
  };

  const handleMoveDown = async (index: number) => {
    if (!showcaseImages || index >= showcaseImages.length - 1) return;
    const current = showcaseImages[index];
    const next = showcaseImages[index + 1];
    await Promise.all([
      fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', id: current.id ?? current._id, order: next.display_order }),
      }),
      fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', id: next.id ?? next._id, order: current.display_order }),
      }),
    ]);
    mutateShowcase();
  };

  if (!showcaseImages) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">معرض الأعمال</h1>
        <p className="text-muted">اختر من التصاميم المولّدة لعرضها في الصفحة الرئيسية</p>
      </div>

      {/* SECTION 1: CURRENT SHOWCASE */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ImagePlus size={20} className="text-primary" />
          الصور المعروضة حالياً
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full mr-auto">
            {showcaseImages.length}
          </span>
        </h2>

        {showcaseImages.length > 0 ? (
          <div className="space-y-3">
            {showcaseImages.map((img: any, index: number) => {
              const imgId = img.id ?? img._id;
              return (
                <div
                  key={imgId}
                  className="bg-surface-1 border border-card-border rounded-2xl p-4 flex items-center gap-4 group hover:border-primary/20 transition-colors"
                >
                  {/* Order */}
                  <div className="flex flex-col items-center gap-1 text-muted">
                    <GripVertical size={16} />
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-card-border flex-shrink-0 bg-surface-2">
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={img.title || "Showcase"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {img.title || "بدون عنوان"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                        {(CATEGORY_LABELS as Record<string, string>)[img.category] ?? img.category}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(img.createdAt ?? img.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="تقديم"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === showcaseImages.length - 1}
                      className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="تأخير"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(imgId)}
                      disabled={deletingId === imgId}
                      className="p-2 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-all"
                      title="حذف"
                    >
                      {deletingId === imgId ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-8 text-center">
            <ImagePlus size={40} className="text-muted mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">لا توجد صور في المعرض</h3>
            <p className="text-muted text-sm">اختر صور من التصاميم أدناه لعرضها في الصفحة الرئيسية</p>
          </div>
        )}
      </div>

      {/* SECTION 2: BROWSE GENERATIONS */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Filter size={20} className="text-accent" />
          اختر من التصاميم المولّدة
        </h2>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setBrowseCategory("")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              browseCategory === ""
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-surface-2/50 text-muted hover:text-foreground border border-card-border"
            }`}
          >
            الكل
          </button>
          {ALL_CATEGORIES.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setBrowseCategory(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                browseCategory === value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-surface-2/50 text-muted hover:text-foreground border border-card-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Generation grid */}
        {!generations ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : generations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {generations.flatMap((gen: any) =>
              gen.outputs
                .filter((output: any) => output.url)
                .map((output: any, idx: number) => {
                  const outputKey = output.storage_path || output.storageId || `${gen.id}-${idx}`;
                  return (
                    <div
                      key={outputKey}
                      className={`relative rounded-2xl overflow-hidden border bg-surface-1 transition-all group ${
                        output.alreadyInShowcase
                          ? "border-success/40 ring-2 ring-success/20"
                          : "border-card-border hover:border-primary/30 hover:shadow-lg"
                      }`}
                    >
                      {/* Image */}
                      <img
                        src={output.url}
                        alt={gen.productName || gen.businessName}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />

                      {/* Category badge */}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {(CATEGORY_LABELS as Record<string, string>)[gen.category] ?? gen.category}
                      </div>

                      {/* Info overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                        <p className="text-white text-xs font-bold truncate">{gen.businessName}</p>
                        <p className="text-white/70 text-[10px] truncate">{gen.productName}</p>
                      </div>

                      {/* Add / Already added button */}
                      {output.alreadyInShowcase ? (
                        <div className="absolute top-2 left-2 bg-success text-white p-1.5 rounded-full">
                          <Check size={14} />
                        </div>
                      ) : output.storage_path ? (
                        <button
                          onClick={() =>
                            handleAddToShowcase(
                              output.storage_path,
                              gen.category,
                              `${gen.businessName} — ${gen.productName}`
                            )
                          }
                          disabled={addingPath === output.storage_path}
                          className="absolute top-2 left-2 bg-primary text-primary-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:scale-110 disabled:opacity-50 transition-all shadow-lg"
                          title="إضافة للمعرض"
                        >
                          {addingPath === output.storage_path ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Plus size={14} />
                          )}
                        </button>
                      ) : null}
                    </div>
                  );
                })
            )}
          </div>
        ) : (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
            <ImagePlus size={48} className="text-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">لا توجد تصاميم مكتملة</h3>
            <p className="text-muted text-sm">
              ستظهر هنا التصاميم المولّدة بعد أن يبدأ المستخدمون بإنشاء بوسترات
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
