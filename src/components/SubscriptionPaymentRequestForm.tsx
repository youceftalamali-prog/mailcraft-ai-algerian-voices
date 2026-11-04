import React, { useEffect, useState } from 'react';

type Props = { currentUserEmail?: string|null; billingCycle: 'monthly'|'annual'; initialPlan?: 'starter'|'pro'|'business' };
export const SubscriptionPaymentRequestForm: React.FC<Props> = ({ currentUserEmail, billingCycle, initialPlan = 'starter' }) => {
  const [plan,setPlan] = useState<'starter'|'pro'|'business'>(initialPlan);
  const [method,setMethod] = useState<'baridimob'|'edahabia'>('baridimob');
  const [reference,setReference] = useState('');
  const [sender,setSender] = useState('');
  const [note,setNote] = useState('');
  const [receiptDataUrl,setReceiptDataUrl] = useState('');
  const [receiptFilename,setReceiptFilename] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState<{ok:boolean;text:string}|null>(null);
  useEffect(() => setPlan(initialPlan), [initialPlan]);
  const prices = { starter: {monthly:2900,annual:29000}, pro:{monthly:5900,annual:59000}, business:{monthly:14500,annual:145000} };
  const amount = prices[plan][billingCycle];
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const response = await fetch('/api/subscriptions/requests', {
        method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({plan,billingCycle,paymentMethod:method,transactionReference:reference,senderName:sender,receiptNote:note,receiptDataUrl,receiptFilename}),
      });
      const data = await response.json() as {message?:string;request?:{id:string}};
      if (!response.ok) throw new Error(data.message || 'تعذر إرسال طلب الدفع.');
      setMessage({ok:true,text:`تم تسجيل طلبك بنجاح. رقم الطلب: ${data.request?.id || '—'}. ستبقى الباقة غير مفعّلة حتى التحقق اليدوي من وصول المبلغ.`});
      setReference(''); setNote(''); setReceiptDataUrl(''); setReceiptFilename('');
    } catch (error) { setMessage({ok:false,text:error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'}); }
    finally { setBusy(false); }
  };
  if (!currentUserEmail) return <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-5 text-center">
    <p className="text-sm font-bold text-white">لإرسال طلب الاشتراك، سجّل الدخول أولاً.</p>
    <button type="button" onClick={() => document.getElementById('auth-section')?.scrollIntoView({behavior:'smooth'})} className="mt-3 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white">تسجيل الدخول أو إنشاء حساب</button>
  </div>;
  return <form onSubmit={submit} className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/70 p-5 sm:p-7 space-y-4">
    <div><h3 className="text-lg font-black text-white">إرسال طلب اشتراك</h3><p className="text-xs text-slate-400 mt-1">الحساب: {currentUserEmail}. أدخل رقم المعاملة بعد إتمام التحويل.</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <label className="text-xs text-slate-300">الباقة<select value={plan} onChange={e=>setPlan(e.target.value as typeof plan)} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-white"><option value="starter">Starter</option><option value="pro">Pro E-Commerce</option><option value="business">Agency</option></select></label>
      <label className="text-xs text-slate-300">مدة الاشتراك<select value={billingCycle} disabled className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-white"><option value="monthly">شهري</option><option value="annual">سنوي</option></select></label>
      <div className="rounded-lg bg-slate-900 border border-slate-700 p-2.5"><p className="text-xs text-slate-400">المبلغ المطلوب</p><p className="text-lg font-black text-emerald-300 mt-1">{amount.toLocaleString('fr-DZ')} دج</p></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-xs text-slate-300">وسيلة الدفع<select value={method} onChange={e=>setMethod(e.target.value as typeof method)} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-white"><option value="baridimob">BaridiMob</option><option value="edahabia">البطاقة الذهبية / تحويل بريدي</option></select></label>
      <label className="text-xs text-slate-300">رقم مرجع المعاملة *<input required minLength={5} maxLength={100} value={reference} onChange={e=>setReference(e.target.value)} placeholder="أدخل رقم العملية كما يظهر في الإشعار" className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-white" /></label>
    </div>
    <label className="block text-xs text-slate-300">اسم صاحب الحساب المحوِّل (اختياري)<input maxLength={120} value={sender} onChange={e=>setSender(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-white" /></label>
    <label className="block text-xs text-slate-300">ملاحظة / تفاصيل الإيصال (اختياري)<textarea maxLength={1000} rows={3} value={note} onChange={e=>setNote(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-white" /></label>
    <label className="block text-xs text-slate-300">إرفاق صورة الإيصال أو PDF (اختياري، حتى 650KB)
      <input type="file" accept="image/png,image/jpeg,application/pdf" className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) { setReceiptDataUrl(''); setReceiptFilename(''); return; }
          if (!['image/png','image/jpeg','application/pdf'].includes(file.type) || file.size > 650 * 1024) {
            setMessage({ok:false,text:'اختر PNG أو JPG أو PDF بحجم لا يتجاوز 650 كيلوبايت.'});
            event.target.value = ''; setReceiptDataUrl(''); setReceiptFilename(''); return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') { setReceiptDataUrl(reader.result); setReceiptFilename(file.name); }
          };
          reader.onerror = () => setMessage({ok:false,text:'تعذرت قراءة ملف الإيصال.'});
          reader.readAsDataURL(file);
        }} />
      {receiptFilename && <span className="mt-1 block text-emerald-300">{receiptFilename} - تم إرفاقه</span>}
    </label>
    <p className="text-[11px] leading-5 text-amber-200 bg-amber-950/30 border border-amber-700/30 rounded-lg p-3">إرسال الطلب لا يعني نجاح الدفع ولا يفعّل الاشتراك تلقائياً. سيبقى حسابك على الخطة الحالية حتى يتحقق المدير من وصول المبلغ فعلياً. لا ترسل بيانات البطاقة أو رمز OTP أو كلمة المرور.</p>
    {message && <p role="status" className={`rounded-lg p-3 text-xs ${message.ok?'bg-emerald-950/40 text-emerald-200':'bg-red-950/40 text-red-200'}`}>{message.text}</p>}
    <button type="submit" disabled={busy || reference.trim().length<5} className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 p-3 text-sm font-black text-slate-950">{busy?'جارٍ إرسال الطلب...':'إرسال طلب الدفع للمراجعة'}</button>
  </form>;
};
