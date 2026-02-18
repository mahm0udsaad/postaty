"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Loader2,
  Plus,
  Archive,
  Pencil,
  Trash2,
  Tag,
  Ticket,
  Globe,
  X,
  Check,
  DollarSign,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

type Tab = "products" | "coupons" | "countryPricing";

const TABS: Array<{ key: Tab; label: string; icon: typeof Tag }> = [
  { key: "products", label: "المنتجات والأسعار", icon: Tag },
  { key: "coupons", label: "الكوبونات", icon: Ticket },
  { key: "countryPricing", label: "أسعار الدول", icon: Globe },
];

export default function AdminStripePage() {
  const [activeTab, setActiveTab] = useState<Tab>("products");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">إدارة الأسعار</h1>
        <p className="text-muted">إدارة المنتجات والأسعار والكوبونات في Stripe</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-surface-2/50 text-muted hover:text-foreground border border-card-border"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "products" && <ProductsTab />}
      {activeTab === "coupons" && <CouponsTab />}
      {activeTab === "countryPricing" && <CountryPricingTab />}
    </div>
  );
}

// ── Products Tab ───────────────────────────────────────────────────

type StripeProduct = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, string>;
  defaultPriceId: string | null;
  prices: Array<{
    id: string;
    unitAmount: number | null;
    currency: string;
    recurring: { interval: string } | null;
    lookupKey: string | null;
    active: boolean;
  }>;
};

function ProductsTab() {
  const listProducts = useAction(api.stripeAdmin.listProducts);
  const createProduct = useAction(api.stripeAdmin.createProduct);
  const updateProduct = useAction(api.stripeAdmin.updateProduct);
  const archiveProduct = useAction(api.stripeAdmin.archiveProduct);
  const createPrice = useAction(api.stripeAdmin.createPrice);

  const [products, setProducts] = useState<StripeProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreatePrice, setShowCreatePrice] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listProducts({});
      setProducts(result.products);
    } finally {
      setLoading(false);
    }
  }, [listProducts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleArchive = async (productId: string) => {
    setActionLoading(productId);
    try {
      await archiveProduct({ productId });
      await refresh();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !products) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">المنتجات</h2>
        <button
          onClick={() => setShowCreateProduct(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-sm"
        >
          <Plus size={16} />
          إنشاء منتج
        </button>
      </div>

      {showCreateProduct && (
        <CreateProductForm
          onClose={() => setShowCreateProduct(false)}
          onCreated={refresh}
          createProduct={createProduct}
        />
      )}

      {products && products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-surface-1 border border-card-border rounded-2xl p-5 ${
                !product.active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  {editingProduct === product.id ? (
                    <EditProductForm
                      product={product}
                      onClose={() => setEditingProduct(null)}
                      onSaved={refresh}
                      updateProduct={updateProduct}
                    />
                  ) : (
                    <>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted mt-1">{product.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            product.active
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {product.active ? "نشط" : "مؤرشف"}
                        </span>
                        <span className="text-xs text-muted font-mono" dir="ltr">
                          {product.id}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {editingProduct !== product.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product.id)}
                      className="p-2 bg-surface-2/50 hover:bg-surface-2 border border-card-border rounded-xl transition-colors"
                      title="تعديل"
                    >
                      <Pencil size={14} />
                    </button>
                    {product.active && (
                      <button
                        onClick={() => handleArchive(product.id)}
                        disabled={actionLoading === product.id}
                        className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-xl transition-colors disabled:opacity-50"
                        title="أرشفة"
                      >
                        {actionLoading === product.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Archive size={14} />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Prices */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-muted">الأسعار</h4>
                  <button
                    onClick={() => setShowCreatePrice(product.id)}
                    className="text-xs text-primary hover:underline font-bold"
                  >
                    + سعر جديد
                  </button>
                </div>

                {showCreatePrice === product.id && (
                  <CreatePriceForm
                    productId={product.id}
                    onClose={() => setShowCreatePrice(null)}
                    onCreated={refresh}
                    createPrice={createPrice}
                  />
                )}

                <div className="space-y-2">
                  {product.prices.map((price) => (
                    <div
                      key={price.id}
                      className={`flex items-center justify-between p-3 bg-surface-2/30 rounded-xl text-sm ${
                        !price.active ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold" dir="ltr">
                          {price.unitAmount != null
                            ? `${(price.unitAmount / 100).toFixed(2)} ${price.currency.toUpperCase()}`
                            : "—"}
                        </span>
                        {price.recurring && (
                          <span className="text-xs text-muted">
                            / {price.recurring.interval === "month" ? "شهر" : "سنة"}
                          </span>
                        )}
                        {!price.recurring && (
                          <span className="text-xs text-muted">دفعة واحدة</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {price.lookupKey && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono" dir="ltr">
                            {price.lookupKey}
                          </span>
                        )}
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            price.active ? "bg-success" : "bg-destructive"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                  {product.prices.length === 0 && (
                    <p className="text-xs text-muted text-center py-3">لا توجد أسعار</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
          <Tag size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">لا توجد منتجات</h3>
          <p className="text-muted">أنشئ منتجاً جديداً في Stripe للبدء.</p>
        </div>
      )}
    </div>
  );
}

// ── Create Product Form ────────────────────────────────────────────

function CreateProductForm({
  onClose,
  onCreated,
  createProduct,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
  createProduct: (args: {
    name: string;
    description?: string;
    metadata?: any;
    priceAmountCents: number;
    currency: string;
    billingType: "recurring" | "one_time";
    interval?: "month" | "year";
    lookupKey: string;
  }) => Promise<{ productId: string; priceId: string }>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [billingType, setBillingType] = useState<"recurring" | "one_time">("recurring");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [lookupKey, setLookupKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !lookupKey) return;
    setSaving(true);
    try {
      await createProduct({
        name,
        description: description || undefined,
        priceAmountCents: Math.round(parseFloat(amount) * 100),
        currency,
        billingType,
        interval: billingType === "recurring" ? interval : undefined,
        lookupKey,
      });
      await onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-2/30 border border-card-border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">إنشاء منتج جديد</h3>
        <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">الاسم *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Starter Plan"
            dir="ltr"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">Lookup Key *</label>
          <input
            value={lookupKey}
            onChange={(e) => setLookupKey(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="starter_monthly"
            dir="ltr"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">المبلغ *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="7.00"
            dir="ltr"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">العملة</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            dir="ltr"
          >
            <option value="usd">USD</option>
            <option value="sar">SAR</option>
            <option value="aed">AED</option>
            <option value="eur">EUR</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">نوع الفوترة</label>
          <select
            value={billingType}
            onChange={(e) => setBillingType(e.target.value as "recurring" | "one_time")}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="recurring">متكرر</option>
            <option value="one_time">دفعة واحدة</option>
          </select>
        </div>
        {billingType === "recurring" && (
          <div>
            <label className="text-sm font-medium text-muted mb-1 block">الفترة</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as "month" | "year")}
              className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="month">شهري</option>
              <option value="year">سنوي</option>
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-muted mb-1 block">الوصف</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="وصف المنتج (اختياري)"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">
          إلغاء
        </button>
        <button
          type="submit"
          disabled={saving || !name || !amount || !lookupKey}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          إنشاء
        </button>
      </div>
    </form>
  );
}

// ── Edit Product Form ──────────────────────────────────────────────

function EditProductForm({
  product,
  onClose,
  onSaved,
  updateProduct,
}: {
  product: StripeProduct;
  onClose: () => void;
  onSaved: () => Promise<void>;
  updateProduct: (args: {
    productId: string;
    name?: string;
    description?: string;
  }) => Promise<{ success: boolean }>;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    try {
      await updateProduct({
        productId: product.id,
        name,
        description: description || undefined,
      });
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        dir="ltr"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="Description"
        dir="ltr"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          حفظ
        </button>
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-muted hover:text-foreground">
          إلغاء
        </button>
      </div>
    </form>
  );
}

// ── Create Price Form ──────────────────────────────────────────────

function CreatePriceForm({
  productId,
  onClose,
  onCreated,
  createPrice,
}: {
  productId: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
  createPrice: (args: {
    productId: string;
    amountCents: number;
    currency: string;
    billingType: "recurring" | "one_time";
    interval?: "month" | "year";
    lookupKey: string;
  }) => Promise<{ priceId: string }>;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [billingType, setBillingType] = useState<"recurring" | "one_time">("recurring");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [lookupKey, setLookupKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !lookupKey) return;
    setSaving(true);
    try {
      await createPrice({
        productId,
        amountCents: Math.round(parseFloat(amount) * 100),
        currency,
        billingType,
        interval: billingType === "recurring" ? interval : undefined,
        lookupKey,
      });
      await onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-1/50 border border-card-border rounded-xl p-4 mb-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="px-3 py-2 bg-surface-1 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="المبلغ"
          dir="ltr"
          required
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="px-3 py-2 bg-surface-1 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="ltr"
        >
          <option value="usd">USD</option>
          <option value="sar">SAR</option>
          <option value="aed">AED</option>
        </select>
        <select
          value={billingType}
          onChange={(e) => setBillingType(e.target.value as "recurring" | "one_time")}
          className="px-3 py-2 bg-surface-1 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="recurring">متكرر</option>
          <option value="one_time">دفعة واحدة</option>
        </select>
        <input
          value={lookupKey}
          onChange={(e) => setLookupKey(e.target.value)}
          className="px-3 py-2 bg-surface-1 border border-card-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="lookup_key"
          dir="ltr"
          required
        />
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-muted hover:text-foreground">
          إلغاء
        </button>
        <button
          type="submit"
          disabled={saving || !amount || !lookupKey}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          إضافة
        </button>
      </div>
    </form>
  );
}

// ── Coupons Tab ────────────────────────────────────────────────────

type StripeCoupon = {
  id: string;
  name: string | null;
  amountOff: number | null;
  percentOff: number | null;
  currency: string | null;
  duration: string;
  durationInMonths: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  valid: boolean;
};

function CouponsTab() {
  const listCoupons = useAction(api.stripeAdmin.listCoupons);
  const createCouponAction = useAction(api.stripeAdmin.createCoupon);
  const deleteCouponAction = useAction(api.stripeAdmin.deleteCoupon);

  const [coupons, setCoupons] = useState<StripeCoupon[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCoupons({});
      setCoupons(result.coupons);
    } finally {
      setLoading(false);
    }
  }, [listCoupons]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (couponId: string) => {
    setDeletingId(couponId);
    try {
      await deleteCouponAction({ couponId });
      await refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !coupons) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  const DURATION_LABELS: Record<string, string> = {
    once: "مرة واحدة",
    repeating: "متكرر",
    forever: "دائم",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">الكوبونات</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-sm"
        >
          <Plus size={16} />
          إنشاء كوبون
        </button>
      </div>

      {showCreate && (
        <CreateCouponForm
          onClose={() => setShowCreate(false)}
          onCreated={refresh}
          createCoupon={createCouponAction}
        />
      )}

      {coupons && coupons.length > 0 ? (
        <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-2/30">
                  <th className="text-right py-3 px-4 font-medium text-muted">الاسم</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الخصم</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">المدة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الاستخدام</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الحالة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-card-border/50 hover:bg-surface-2/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium">{coupon.name || coupon.id}</div>
                      <div className="text-xs text-muted font-mono" dir="ltr">{coupon.id}</div>
                    </td>
                    <td className="py-3 px-4 font-bold" dir="ltr">
                      {coupon.amountOff != null
                        ? `${(coupon.amountOff / 100).toFixed(2)} ${(coupon.currency ?? "usd").toUpperCase()}`
                        : coupon.percentOff != null
                        ? `${coupon.percentOff}%`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {DURATION_LABELS[coupon.duration] ?? coupon.duration}
                      {coupon.durationInMonths ? ` (${coupon.durationInMonths} شهر)` : ""}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {coupon.timesRedeemed}
                      {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          coupon.valid
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {coupon.valid ? "صالح" : "منتهي"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        disabled={deletingId === coupon.id}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                        title="حذف"
                      >
                        {deletingId === coupon.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
          <Ticket size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">لا توجد كوبونات</h3>
          <p className="text-muted">أنشئ كوبوناً جديداً لتقديم خصومات للمستخدمين.</p>
        </div>
      )}
    </div>
  );
}

// ── Create Coupon Form ─────────────────────────────────────────────

function CreateCouponForm({
  onClose,
  onCreated,
  createCoupon,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
  createCoupon: (args: {
    name: string;
    duration: "once" | "repeating" | "forever";
    amountOffCents?: number;
    percentOff?: number;
    currency?: string;
    durationInMonths?: number;
    maxRedemptions?: number;
  }) => Promise<{ couponId: string }>;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("once");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [durationInMonths, setDurationInMonths] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setSaving(true);
    try {
      await createCoupon({
        name,
        duration,
        amountOffCents: discountType === "amount" ? Math.round(parseFloat(amount) * 100) : undefined,
        percentOff: discountType === "percent" ? parseFloat(amount) : undefined,
        currency: discountType === "amount" ? currency : undefined,
        durationInMonths: duration === "repeating" && durationInMonths ? parseInt(durationInMonths) : undefined,
        maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
      });
      await onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-2/30 border border-card-border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">إنشاء كوبون جديد</h3>
        <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">الاسم *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="خصم الشهر الأول"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">المدة</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as "once" | "repeating" | "forever")}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="once">مرة واحدة</option>
            <option value="repeating">متكرر</option>
            <option value="forever">دائم</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">نوع الخصم</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "amount" | "percent")}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="amount">مبلغ ثابت</option>
            <option value="percent">نسبة مئوية</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">
            {discountType === "amount" ? "المبلغ *" : "النسبة % *"}
          </label>
          <input
            type="number"
            step={discountType === "amount" ? "0.01" : "1"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder={discountType === "amount" ? "2.00" : "20"}
            dir="ltr"
            required
          />
        </div>
        {duration === "repeating" && (
          <div>
            <label className="text-sm font-medium text-muted mb-1 block">عدد الأشهر</label>
            <input
              type="number"
              value={durationInMonths}
              onChange={(e) => setDurationInMonths(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="3"
              dir="ltr"
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-muted mb-1 block">الحد الأقصى للاستخدام</label>
          <input
            type="number"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="غير محدود"
            dir="ltr"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">
          إلغاء
        </button>
        <button
          type="submit"
          disabled={saving || !name || !amount}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          إنشاء
        </button>
      </div>
    </form>
  );
}

// ── Country Pricing Tab ────────────────────────────────────────────

function CountryPricingTab() {
  const countryPricing = useQuery(api.stripeAdmin.listCountryPricing, {});
  const updateCountryPricingAction = useAction(api.stripeAdmin.updateCountryPricing);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    monthlyAmountCents: string;
    firstMonthAmountCents: string;
  }>({ monthlyAmountCents: "", firstMonthAmountCents: "" });
  const [saving, setSaving] = useState(false);

  if (countryPricing === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  // Group by country
  const byCountry = new Map<string, typeof countryPricing>();
  for (const row of countryPricing) {
    if (!byCountry.has(row.countryCode)) byCountry.set(row.countryCode, []);
    byCountry.get(row.countryCode)!.push(row);
  }

  const countries = Array.from(byCountry.keys()).sort();

  const PLAN_LABELS: Record<string, string> = {
    starter: "مبتدي",
    growth: "نمو",
    dominant: "هيمنة",
  };

  const PLAN_COLORS: Record<string, string> = {
    starter: "text-success",
    growth: "text-primary",
    dominant: "text-accent",
  };

  const startEdit = (row: (typeof countryPricing)[0]) => {
    setEditingRow(row._id);
    setEditValues({
      monthlyAmountCents: (row.monthlyAmountCents / 100).toFixed(2),
      firstMonthAmountCents: (row.firstMonthAmountCents / 100).toFixed(2),
    });
  };

  const handleSave = async (row: (typeof countryPricing)[0]) => {
    setSaving(true);
    try {
      await updateCountryPricingAction({
        countryCode: row.countryCode,
        planKey: row.planKey,
        currency: row.currency,
        currencySymbol: row.currencySymbol,
        monthlyAmountCents: Math.round(parseFloat(editValues.monthlyAmountCents) * 100),
        firstMonthAmountCents: Math.round(parseFloat(editValues.firstMonthAmountCents) * 100),
        isActive: row.isActive,
      });
      setEditingRow(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">أسعار الدول</h2>
        <p className="text-sm text-muted">اضغط على أيقونة التعديل لتغيير الأسعار لكل دولة</p>
      </div>

      {countries.length > 0 ? (
        <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-2/30">
                  <th className="text-right py-3 px-4 font-medium text-muted">الدولة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الخطة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">العملة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">السعر الشهري</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">سعر الشهر الأول</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((country) =>
                  byCountry.get(country)!.map((row) => (
                    <tr key={row._id} className="border-b border-card-border/50 hover:bg-surface-2/20 transition-colors">
                      <td className="py-3 px-4 font-bold" dir="ltr">{row.countryCode}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${PLAN_COLORS[row.planKey] ?? "text-foreground"}`}>
                          {PLAN_LABELS[row.planKey] ?? row.planKey}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs" dir="ltr">
                        {row.currencySymbol} {row.currency}
                      </td>
                      <td className="py-3 px-4">
                        {editingRow === row._id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.monthlyAmountCents}
                            onChange={(e) =>
                              setEditValues({ ...editValues, monthlyAmountCents: e.target.value })
                            }
                            className="w-24 px-2 py-1 bg-surface-1 border border-primary/30 rounded-lg text-sm focus:outline-none"
                            dir="ltr"
                          />
                        ) : (
                          <span dir="ltr">{row.currencySymbol}{(row.monthlyAmountCents / 100).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingRow === row._id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValues.firstMonthAmountCents}
                            onChange={(e) =>
                              setEditValues({ ...editValues, firstMonthAmountCents: e.target.value })
                            }
                            className="w-24 px-2 py-1 bg-surface-1 border border-primary/30 rounded-lg text-sm focus:outline-none"
                            dir="ltr"
                          />
                        ) : (
                          <span dir="ltr">{row.currencySymbol}{(row.firstMonthAmountCents / 100).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingRow === row._id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSave(row)}
                              disabled={saving}
                              className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 disabled:opacity-50"
                            >
                              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={() => setEditingRow(null)}
                              className="p-1.5 text-muted hover:text-foreground rounded-lg"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(row)}
                            className="p-1.5 text-muted hover:text-foreground hover:bg-surface-2/50 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
          <Globe size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">لا توجد أسعار للدول</h3>
          <p className="text-muted">قم بتشغيل seed script لإضافة أسعار افتراضية.</p>
        </div>
      )}
    </div>
  );
}
