import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle, Clock, CreditCard, AlertTriangle } from 'lucide-react';

type PaymentRequest = {
  id: string; userId: string; email: string; plan: 'starter'|'pro'|'business';
  billingCycle: 'monthly'|'annual'; amountDzd: number;
  paymentMethod: 'baridimob'|'edahabia'; transactionReference: string;
  senderName: string|null; receiptNote: string|null;
  status: 'pending'|'approved'|'rejected'; reviewedAt: string|null;
  rejectionReason: string|null; receiptAvailable: boolean; createdAt: string;
};

const planNames = { starter: 'Starter', pro: 'Pro E-Commerce', business: 'Agency' };
const statusNames = { pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض' };

export const SubscriptionPaymentsPanel: React.FC = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'|'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/admin/subscription-requests${status === 'all' ? '' : `?status=${status}`}`, { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json() as { requests?: PaymentRequest[]; message?: string };
      if (!response.ok) throw new Error(data.message || 'تعذر تحميل طلبات الدفع.');
      setRequests(data.requests || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الطلبات.'); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  const review = async (request: PaymentRequest, decision: 'approved'|'rejected') => {
    const promptText = decision === 'approved'
      ? 'هل تحققت بنفسك من وصول المبلغ إلى الحساب البريدي وأن المبلغ والمرجع صحيحان؟ لن يتم التفعيل إلا بعد تحققك.'
      : 'اكتب سبب رفض طلب الدفع:';
    const reason = decision === 'rejected' ? window.prompt(promptText) : window.confirm(promptText) ? '' : null;
    if (reason === null) return;
    if (decision === 'rejected' && !reason.trim()) { window.alert('سبب الرفض مطلوب.'); return; }
    setBusyId(request.id); setError(null);
    try {
      const response = await fetch(`/api/admin/subscription-requests/${encodeURIComponent(request.id)}`, {
        method: 'PATCH', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rejectionReason: reason }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || 'تعذرت مراجعة طلب الدفع.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تنفيذ العملية.'); }
    finally { setBusyId(null); }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex gap-3 text-amber-100">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-xs leading-6">
          <strong>تحقق يدوي إلزامي:</strong> لا توافق على أي طلب اعتماداً على صورة أو رقم مرجعي فقط. افتح تطبيق/كشف الحساب البريدي وتأكد من وصول المبلغ فعلياً، ومطابقة القيمة والمرجع قبل التفعيل.
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">طلبات الاشتراك والمدفوعات</h2>
          <p className="text-xs text-slate-400 mt-1">طلبات حقيقية محفوظة في قاعدة البيانات</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white">
            <option value="pending">قيد المراجعة</option><option value="approved">مقبولة</option><option value="rejected">مرفوضة</option><option value="all">الكل</option>
          </select>
          <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-slate-700 p-2 text-slate-200 disabled:opacity-50" aria-label="تحديث">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-950/40 border border-red-800 p-3 text-xs text-red-200">{error}</p>}
      {loading ? <p className="text-sm text-slate-400 p-6 text-center">جارٍ تحميل الطلبات...</p> :
        requests.length === 0 ? <p className="text-sm text-slate-400 p-8 text-center rounded-xl border border-slate-800">لا توجد طلبات في هذا التصنيف.</p> :
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-bold text-white text-sm">{request.email}</p><p className="text-[11px] text-slate-400 mt-1">{planNames[request.plan]} · {request.billingCycle === 'annual' ? 'سنوي' : 'شهري'}</p></div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full ${request.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : request.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{statusNames[request.status]}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><p className="text-slate-500">المبلغ</p><p className="font-bold text-white mt-1">{request.amountDzd.toLocaleString('fr-DZ')} دج</p></div>
                <div><p className="text-slate-500">طريقة الدفع</p><p className="text-slate-200 mt-1">{request.paymentMethod === 'baridimob' ? 'BaridiMob' : 'البطاقة الذهبية'}</p></div>
                <div><p className="text-slate-500">مرجع التحويل</p><p className="text-slate-200 mt-1 break-all">{request.transactionReference}</p></div>
                <div><p className="text-slate-500">تاريخ الطلب</p><p className="text-slate-200 mt-1">{new Date(request.createdAt).toLocaleString('ar-DZ')}</p></div>
              </div>
              {request.senderName && <p className="text-xs text-slate-300">اسم المرسل: {request.senderName}</p>}
              {request.receiptNote && <p className="text-xs text-slate-400 whitespace-pre-wrap">{request.receiptNote}</p>}
              {request.receiptAvailable && <a href={`/api/admin/subscription-requests/${encodeURIComponent(request.id)}/receipt`} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-indigo-600/50 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-950/40">عرض الإيصال المرفق</a>}
              {request.rejectionReason && <p className="text-xs text-red-300">سبب الرفض: {request.rejectionReason}</p>}
              {request.status === 'pending' && <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <button type="button" disabled={busyId === request.id} onClick={() => void review(request, 'approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> تأكيد الدفع وتفعيل الباقة</button>
                <button type="button" disabled={busyId === request.id} onClick={() => void review(request, 'rejected')} className="inline-flex items-center gap-2 rounded-lg border border-red-700 px-4 py-2 text-xs font-bold text-red-300 disabled:opacity-50"><XCircle className="w-4 h-4" /> رفض الطلب</button>
              </div>}
              {request.status !== 'pending' && <p className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> تمت المراجعة: {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('ar-DZ') : '—'}</p>}
            </article>
          ))}
        </div>}
    </section>
  );
};
