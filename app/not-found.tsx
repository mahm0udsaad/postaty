import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-surface-1 border border-card-border rounded-2xl p-8 max-w-md w-full text-center">
        <FileQuestion size={48} className="text-muted mx-auto mb-4" />
        <h1 className="text-5xl font-black mb-2 text-primary">404</h1>
        <h2 className="text-xl font-bold mb-2">الصفحة غير موجودة</h2>
        <p className="text-muted mb-6">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
        >
          <Home size={16} />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
