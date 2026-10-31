import { AlgerianDialect, AlgerianOutroItem, EmailCampaign } from '../types/index';

export function calculateEmailMetrics(subject: string, bodyText: string) {
  const words = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const chars = bodyText.length;
  const readingTimeSeconds = Math.max(10, Math.round((words / 200) * 60));

  // Spam score heuristic (0-100, lower is better)
  const spamKeywords = [
    'free', '100%', 'guaranteed', 'risk-free', 'buy now', 'act now',
    'urgent', 'click here', 'limited time', 'winner', 'cash', 'earn $$$',
    'مجانا', 'اربح', 'فرصة لا تعوض', 'اضغط هنا'
  ];
  let spamCount = 0;
  const combined = (subject + ' ' + bodyText).toLowerCase();
  for (const kw of spamKeywords) {
    if (combined.includes(kw)) spamCount++;
  }
  const spamScore = Math.min(95, Math.max(5, spamCount * 12 + (subject.includes('!') ? 10 : 0) + (subject.toUpperCase() === subject && subject.length > 5 ? 25 : 0)));

  // Open rate heuristic prediction (0-100%)
  const subjectLen = subject.length;
  let predictedOpenRate = 38; // standard benchmark
  if (subjectLen >= 25 && subjectLen <= 55) predictedOpenRate += 8;
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(subject)) predictedOpenRate += 5; // has emoji
  if (subject.includes('?') || subject.includes('How to') || subject.includes('كيف')) predictedOpenRate += 4;
  if (spamScore > 40) predictedOpenRate -= 12;

  return {
    wordCount: words,
    charCount: chars,
    readingTimeSeconds,
    spamScore,
    predictedOpenRate: Math.min(65, Math.max(15, predictedOpenRate)),
  };
}

export function formatEmailHtml(campaign: EmailCampaign): string {
  const { body, visual, subjectLines, selectedSubjectIndex } = campaign;
  const activeSubject = subjectLines[selectedSubjectIndex]?.text || 'Special Announcement';
  const preheader = campaign.preheader || subjectLines[selectedSubjectIndex]?.preheader || '';

  const heroImageHtml = visual.imageUrl
    ? `
      <!-- Hero Banner Image -->
      <tr>
        <td align="center" style="padding: 0 0 24px 0;">
          <img src="${visual.imageUrl}" alt="Email Hero Banner" width="600" style="width: 100%; max-width: 600px; height: auto; display: block; border-radius: 12px 12px 0 0; border: 0;" />
        </td>
      </tr>
    `
    : '';

  const bulletsHtml = body.bulletPoints
    .map(
      (b) => `
      <tr style="vertical-align: top;">
        <td width="28" style="padding: 6px 0; color: #4f46e5; font-size: 18px; line-height: 1;">✦</td>
        <td style="padding: 6px 0 6px 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
          <strong style="color: #0f172a;">${escapeHtml(b.title)}:</strong> ${escapeHtml(b.desc)}
        </td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(activeSubject)}</title>
  <!--[if mso]>
  <style>
    body,table,td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; -webkit-text-size-adjust: 100%; }
    table { border-spacing: 0; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 32px 0; background-color: #f1f5f9;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 0 16px;">
        <table role="presentation" class="email-container" width="600" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 24px 32px; background: #0f172a; border-bottom: 1px solid #1e293b;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                    ${escapeHtml(body.companyName || 'CampaignForge')}
                  </td>
                  <td align="right" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                    Official Dispatch
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${heroImageHtml}

          <!-- Main Email Content Area -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 40px 24px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              
              ${body.urgencyBanner ? `
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 14px; font-weight: 600; color: #991b1b;">
                ⚡ ${escapeHtml(body.urgencyBanner)}
              </div>` : ''}

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #64748b; font-weight: 500;">
                ${escapeHtml(body.heroGreeting || 'Hey {{first_name|there}},')}
              </p>

              <!-- Headline -->
              <h1 style="margin: 0 0 12px 0; font-size: 26px; line-height: 1.25; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                ${escapeHtml(body.headline)}
              </h1>

              <!-- Subheadline -->
              <p style="margin: 0 0 24px 0; font-size: 17px; line-height: 1.5; color: #475569; font-weight: 400;">
                ${escapeHtml(body.subheadline)}
              </p>

              <!-- Body Story / Narrative -->
              <div style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.7; color: #334155; white-space: pre-line;">
                ${escapeHtml(body.mainStory)}
              </div>

              <!-- Bullet Points Section -->
              ${body.bulletPoints && body.bulletPoints.length > 0 ? `
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background: #f8fafc; border-radius: 12px; padding: 16px 20px;">
                ${bulletsHtml}
              </table>` : ''}

              <!-- Primary CTA Button -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(body.cta.url || '#')}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; font-size: 16px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); text-align: center;">
                      ${escapeHtml(body.cta.text || 'Get Started Now')} &rarr;
                    </a>
                    ${body.cta.secondaryText ? `
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b;">
                      ${escapeHtml(body.cta.secondaryText)}
                    </p>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Social Proof / Testimonial Box -->
              ${body.socialProof && body.socialProof.quote ? `
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0; background-color: #f1f5f9; border-radius: 10px; border-left: 4px solid #6366f1;">
                <tr>
                  <td style="padding: 18px 24px; font-style: italic; color: #334155; font-size: 14px; line-height: 1.6;">
                    "${escapeHtml(body.socialProof.quote)}"
                    <div style="margin-top: 8px; font-style: normal; font-weight: 700; color: #0f172a; font-size: 13px;">
                      — ${escapeHtml(body.socialProof.author)} <span style="font-weight: 400; color: #64748b;">(${escapeHtml(body.socialProof.role)})</span>
                    </div>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Signoff -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 15px; line-height: 1.6; color: #475569;">
                <p style="margin: 0 0 4px 0;">${escapeHtml(body.signoff || 'Best regards,')}</p>
                <p style="margin: 0; font-weight: 700; color: #0f172a;">${escapeHtml(body.senderName || 'The CampaignForge Team')}</p>
              </div>

            </td>
          </tr>

          <!-- Footer & Compliance -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;">
                You received this email because you opted into updates from <strong>${escapeHtml(body.companyName || 'CampaignForge')}</strong>.
              </p>
              <p style="margin: 0 0 12px 0;">
                ${escapeHtml(body.companyAddress || '100 Innovation Way, Algiers / Silicon Valley')}
              </p>
              <p style="margin: 0;">
                <a href="#manage" style="color: #64748b; text-decoration: underline; margin: 0 8px;">Preferences</a> &bull;
                <a href="#unsubscribe" style="color: #64748b; text-decoration: underline; margin: 0 8px;">Unsubscribe</a> &bull;
                <a href="#viewinbrowser" style="color: #64748b; text-decoration: underline; margin: 0 8px;">View in Browser</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const ALGERIAN_DIALECTS: AlgerianDialect[] = [
  {
    id: 'general',
    label: 'الدارجة الجزائرية العامة',
    englishLabel: 'General Algerian Darija',
    regionTag: 'عامة ومفهومة للجميع',
    recommendedVoice: 'Zephyr',
    description: 'لهجة جزائرية وسطى سلسة تجمع بين الكلمات المتداولة وطنياً، مناسبة لجميع الولايات والمتابعين من كل الوطن العربي.',
    vocabularySample: 'يعطيكم الصحة، ديرو جيم وابوني، بارطاجيو، ديما الجديد',
  },
  {
    id: 'algiers',
    label: 'العاصمي',
    englishLabel: 'Algiers / Center',
    regionTag: 'الجزائر العاصمة والوسط',
    recommendedVoice: 'Zephyr',
    description: 'لهجة عاصمية راقية، نبرة هادئة وحنينة، تمتاز بخفة الظل ونهايات الجمل اللطيفة المقربة للمشاهد.',
    vocabularySample: 'خاوتي وخواتاتي، ما تنساوش، تهلاو ف رواحتكم، سلام',
  },
  {
    id: 'eastern',
    label: 'الشرقي - قسنطيني/عنابي',
    englishLabel: 'Eastern / Constantine / Annaba',
    regionTag: 'قسنطينة، عنابة، سطيف والشرق الجزائري',
    recommendedVoice: 'Fenrir',
    description: 'نبرة شرقية رزينة وأصيلة، فصيحة الإيقاع وفخمة الأداء، تعطي وقاراً وثقة استثنائية للفيديوهات.',
    vocabularySample: 'عيشكم، ربي يحفظكم كاملين، المتابعة الطيبة، بحول الله',
  },
  {
    id: 'western',
    label: 'الغربي - وهراني',
    englishLabel: 'Western / Oran',
    regionTag: 'وهران، سيدي بلعباس والغرب الجزائري',
    recommendedVoice: 'Puck',
    description: 'لهجة وهرانية مفعمة بالطاقة والحماس، إيقاع سريع وجذاب، مثالية لجذب الانتباه في الريلز والتيك توك.',
    vocabularySample: 'حبابنا الزينين، فجروا زر اللايك، بزّاف، تهلاو وبسلامة',
  },
  {
    id: 'sahara',
    label: 'تراتي وشعبي / صحراوي',
    englishLabel: 'Sahara / Traditional',
    regionTag: 'الجنوب الكبير والتراث الشعبي',
    recommendedVoice: 'Charon',
    description: 'لهجة صحراوية وتراثية كريمة، نبرة حكيمة أصيلة مليئة بالدعوات الطيبة والتآلف العائلي والبركة.',
    vocabularySample: 'عاش من شافكم، ربي يلاقينا ف ساعة الخير، تباتوا ف أمان ربي',
  },
];

export function getDialectPromptInstructions(dialectId: string): string {
  switch (dialectId) {
    case 'algiers':
      return 'اللهجة العاصمية (الوسط الجزائري): استعمل عبارات عاصمية محبوبة مثل (خاوتي وخواتاتي، يعطيكم الصحة، ديرو جيم، تهلاو ف رواحتكم، نتلاقاو فالعدد الجاي). النبرة دافئة وخفيفة.';
    case 'eastern':
      return 'اللهجة الشرقية (قسنطينة، عنابة، سطيف): استعمل مصطلحات الشرق الجزائري مثل (عيشكم، ربي يحفظكم كاملين، المتابعة الطيبة، بحول الله، ف أمان الله). النبرة رزينة وأصيلة.';
    case 'western':
      return 'اللهجة الغربية (وهران والغرب الجزائري): استعمل مصطلحات وهرانية حماسية مثل (حبابنا الزينين، يعطيكم ألف صحة، فجرولنا زر اللايك، بارطاجيو بزاف، تهلاو وبسلامة). النبرة عالية الطاقة وشبابية.';
    case 'sahara':
      return 'اللهجة الصحراوية والتراثية الشعبية: استعمل عبارات الكرم والأصالة الجزائرية مثل (عاش من شافكم وسمع صوتكم، ربي يلاقينا ف ساعة الخير، تباتوا ف أمان ربي، مرحبا بيكم). النبرة حكيمة ودافئة.';
    case 'general':
    default:
      return 'الدارجة الجزائرية العامة: استعمل كلمات جزائرية مفهومة في كامل الـ 58 ولاية بسلاسة (يعطيكم الصحة، متنساوش الاشتراك واللايك، بارطاجيو الفيديو، تهلاو في رواحكم).';
  }
}

export function estimateAudioDuration(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Average speaking rate in Darija: ~2.5 words per second
  const seconds = Math.max(8, Math.round(words / 2.3));
  return `${seconds} ثانية تقريباً (~${seconds}s)`;
}

export const ALGERIAN_OUTRO_COLLECTION: AlgerianOutroItem[] = [
  {
    id: 'alg-outro-1',
    title: 'الخاتمة العاصمية الودودة',
    englishSubtitle: 'Alger Friendly Outro',
    region: 'العاصمي (الوسط)',
    vibe: 'ودود، خفيف الظل، احترافي وقريب من القلب',
    recommendedVoice: 'Zephyr',
    voiceLabel: 'Zephyr (صوت دافئ متوازن)',
    gender: 'كلاهما',
    arabicText: 'يعطيكم الصحة على المشاهدة خاوتي وخواتاتي! إلا عجبكم الفيديو ما تنساوش ديرو جيم، تبارطاجيوه، وتشتركوا فالقناة باش يوصلكم ديما الجديد. نتلاقاو فالعدد الجاي إن شاء الله، وتهلاو بزاف في رواحتكم.. سلام!',
    phoneticGuide: 'يعطيكم الصّحّة على المشاهدة خاوتي وخواتاتي! لا عجبكم الڤيديو ما تنساوش ديرو جيم، تبارطاجيوه، وتشتركو ف القناة باش يوصلكم ديما الجديد. نتلاقاو ف العدد الجاي إن شاء الله، وتهلاو بزّاف ف رواحكم.. سلام!',
    bestFor: 'فلوقات اليوتيوب، البودكاست الجزائري، الفيديوهات التثقيفية والمقابلات',
  },
  {
    id: 'alg-outro-2',
    title: 'الخاتمة الوهرانية الحماسية',
    englishSubtitle: 'Wahran West Energy',
    region: 'الوهراني (الغرب)',
    vibe: 'حماسي، طاقة عالية، شبابي وجذاب',
    recommendedVoice: 'Puck',
    voiceLabel: 'Puck (صوت حيوي شبابي مفعم بالحماس)',
    gender: 'ذكر',
    arabicText: 'حبابنا وخاوتنا الزينين، يعطيكم ألف صحة على المتابعة والوفاء! فجروا لنا هذاك زر اللايك، وخلولنا رايكم فالكومنتار من تحت راه يهمنا بزااف. بارطاجيو الفيديو مع صحابكم، وتهلاولي في رواحكم وبسلامة!',
    phoneticGuide: 'حبابنا وخاوتنا الزّينين، يعطيكم ألف صحّة على المتابعة والوفا! فجّرولنا هداك زر اللايك، وخلّولنا رايكم ف الكومنتار من تحت راه يهمنا بزّاف. بارطاجيو الڤيديو مع صحابكم، وتهلاولي ف رواحكم وبسلامة!',
    bestFor: 'فيديوهات التحديات، الجيمنغ (Gaming)، الريلز والتيك توك، ومحتوى الترفيه والمغامرات',
  },
  {
    id: 'alg-outro-3',
    title: 'الخاتمة القسنطينية والشرقية الرزينة',
    englishSubtitle: 'East Constantine Eloquent',
    region: 'القسنطيني (الشرق)',
    vibe: 'رزين، محترم، لغة راقية ولمسة جزائرية أصيلة',
    recommendedVoice: 'Fenrir',
    voiceLabel: 'Fenrir (صوت رخيم عميق وفخم)',
    gender: 'ذكر',
    arabicText: 'نشكركم جزيل الشكر على حسن الإصغاء وطيب المتابعة. نسعد دائماً بآرائكم واقتراحاتكم في التعليقات. دمتم في رعاية الله وحفظه، والى لقاء قريب يجمعنا على الخير والبركة إن شاء الله.',
    phoneticGuide: 'نشكركم جزيل الشكر على حسن الإصغاء وطيب المتابعة. نسعد دائماً بآرائكم واقتراحاتكم في التعليقات. دمتم في رعاية الله وحفظه، والى لقاء قريب يجمعنا على الخير والبركة إن شاء الله.',
    bestFor: 'فيديوهات وثائقية، محتوى تاريخي وثقافي، دورات تدريبية وفيديوهات تعليمية جادة',
  },
  {
    id: 'alg-outro-4',
    title: 'الخاتمة التسويقية لرواد الأعمال والتجارة',
    englishSubtitle: 'Business & E-Commerce CTA',
    region: 'تسويقي تجاري (Business & E-Commerce)',
    vibe: 'مقنع، مباشر، يحث على الشراء والتواصل الفوري (High Conversion)',
    recommendedVoice: 'Kore',
    voiceLabel: 'Kore (صوت أنثوي احترافي ومقنع جداً)',
    gender: 'أنثى',
    arabicText: 'الكمية محدودة والعرض ساري حتى نهاية الأسبوع فقط! لطلب المنتج أو حجز استشارتكم تواصلوا معنا فالخاص أو عبر الرابط المباشر في أول تعليق. التوصيل متوفر لـ 58 ولاية والدفع عند الاستلام. بصحتكم مسبقاً!',
    phoneticGuide: 'الكمّية محدودة والعرض ساري حتّى نهاية الأسبوع فقط! لطلب المنتج أو حجز استشارتكم تواصلوا معنا فالخاص أو عبر الرابط المباشر في أول تعليق. التوصيل متوفر لـ ثمانية وخمسين ولاية والدفع عند الاستلام. بصحتكم مسبقاً!',
    bestFor: 'إعلانات السوشيال ميديا، المتاجر الإلكترونية، العروض الترويجية وخدمات الشركات B2B/B2C',
  },
  {
    id: 'alg-outro-5',
    title: 'الخاتمة العصرية لصناع المحتوى والتقنية',
    englishSubtitle: 'Tech & Modern Creator Outro',
    region: 'شبابي لصناع المحتوى (Creator & Vlog)',
    vibe: 'عصري، سريع الإيقاع، يدمج الكلمات التقنية المتداولة بالدارجة',
    recommendedVoice: 'Zephyr',
    voiceLabel: 'Zephyr (صوت عصري سلس ومواكب للترند)',
    gender: 'كلاهما',
    arabicText: 'إذا استفدت من الفيديو، متخليهاش تحبس عندك، دير Subscribe وفعّل الجرس باش متراطي والو من الـ Guides والجديد الجاي. الروابط كامل راهم فالـ Description من تحت. نشوفكم فالڤيديو الجاي.. Peace out!',
    phoneticGuide: 'إذا استفدت من الڤيديو، متخلّيهاش تحبس عندك، دير سبسكرايب وفعّل الجرس باش متراطي والو من الـ جايدز والجديد الجاي. الروابط كامل راهم فالديسكريبشن من تحت. نشوفكم فالڤيديو الجاي.. بيس آوت!',
    bestFor: 'مراجعات الهواتف والتقنية، شروحات البرمجة والتسويق الرقمي، محتوى إنستغرام وتيك توك',
  },
  {
    id: 'alg-outro-6',
    title: 'الخاتمة الشعبية الجزائرية الأصيلة',
    englishSubtitle: 'Authentic Heritage Outro',
    region: 'تراثي وشعبي (Traditional)',
    vibe: 'دافئ، من التراث الجزائري، دعاء وبركة ولمة عائلية',
    recommendedVoice: 'Charon',
    voiceLabel: 'Charon (صوت حكيم ودافئ كحكايات الأجداد)',
    gender: 'ذكر',
    arabicText: 'عاش من شافكم وسمع صوتكم، ربي يحفظ بلادنا وولادنا، ويلاقينا ديماً في ساعة الخير والهنا. بقاو على خير، وتباتوا في أمان ربي إن شاء الله.',
    phoneticGuide: 'عاش من شافكم وسمع صوتكم، ربي يحفظ بلادنا وولادنا، ويلاقينا ديماً ف ساعة الخير والهنا. بقاو على خير، وتباتوا في أمان ربي إن شاء الله.',
    bestFor: 'فيديوهات الطبخ التقليدي الجزائري، الحكايات الشعبية، التراث والرحلات الاستكشافية في ربوع الجزائر',
  },
];

export function filterAlgerianOutros(
  list: AlgerianOutroItem[],
  selectedRegion?: string,
  searchQuery?: string
): AlgerianOutroItem[] {
  return list.filter((item) => {
    const matchesRegion = !selectedRegion || selectedRegion === 'all' || item.region === selectedRegion;
    const matchesQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.arabicText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bestFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vibe.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesQuery;
  });
}

export function generateDefaultCampaign(briefPrompt: string): EmailCampaign {
  return {
    id: 'camp-' + Date.now(),
    name: briefPrompt.slice(0, 36) || 'High-Impact Product Launch',
    brief: briefPrompt || 'Launch campaign for a modern productivity SaaS tool',
    targetAudience: 'Growth marketers, founders, and creative directors',
    tone: 'Confident, inspiring, and conversion-focused',
    campaignGoal: 'Drive early signups with 30% discount & showcase ROI',
    subjectLines: [
      {
        text: '🚀 Finally: The smarter way to scale your campaigns (Early Access inside)',
        openRateScore: 54,
        angle: 'Curiosity + High-Status Value',
        preheader: 'Unlock your 30% founder privilege before public launch.',
      },
      {
        text: 'Why top growth teams stopped writing emails manually...',
        openRateScore: 49,
        angle: 'Pain-Point Pattern Interrupt',
        preheader: 'See the automated workflow generating 3.4x higher click-throughs.',
      },
      {
        text: 'Your exclusive invitation: Experience CampaignForge today',
        openRateScore: 43,
        angle: 'Exclusive Invitation & FOMO',
        preheader: 'Reserved access for the first 250 forward-thinking marketers.',
      },
    ],
    selectedSubjectIndex: 0,
    preheader: 'Unlock your 30% founder privilege before public launch.',
    body: {
      headline: 'Transform your marketing from guesswork into high-performing revenue engines.',
      subheadline: 'Craft stunning, conversion-optimized email campaigns and high-res visuals in under 60 seconds.',
      heroGreeting: 'Hey {{first_name|there}},',
      mainStory: `Marketing campaigns shouldn't take days of painful back-and-forth between copywriters, designers, and audio engineers.

Today, we are thrilled to unveil our new flagship platform: a streamlined command center designed to turn any concept or product brief into complete, ready-to-dispatch marketing campaigns with pinpoint copy, breathtaking visuals, and localized impact.

Whether you are launching your next flagship product, re-engaging lapsed subscribers, or preparing high-retention video content, you now have an unfair advantage.`,
      bulletPoints: [
        {
          title: 'Hyper-Converting Subject Lines',
          desc: 'A/B tested predictive scoring engineered to maximize open rates and defeat spam filters.',
        },
        {
          title: 'Studio-Grade 1K/2K/4K Visuals',
          desc: 'Generate tailored hero banners in cinematic ultra-definition directly aligned with your brand aesthetic.',
        },
        {
          title: 'Algorithmic Drip Sequences',
          desc: 'Multi-stage nurture pathways that guide readers from curiosity to decisive checkout action.',
        },
      ],
      socialProof: {
        quote: 'CampaignForge cut our campaign preparation time by 82% while boosting our open rates to an unheard of 44.8%. It is an absolute powerhouse.',
        author: 'Nadia Benali',
        role: 'VP of Growth, Horizon Commerce',
      },
      cta: {
        text: 'Claim Your 30% Founder Discount',
        url: 'https://example.com/claim-discount',
        secondaryText: 'No credit card required. 14-day full access guarantee.',
      },
      urgencyBanner: 'Early Access Tier: 72 hours remaining to lock in lifetime perks.',
      signoff: 'To your explosive growth,',
      senderName: 'The CampaignForge Innovation Team',
      companyName: 'CampaignForge AI',
      companyAddress: 'Hydra Innovation Hub, Algiers & 450 Mission St, San Francisco',
    },
    visual: {
      prompt: 'A sleek, futuristic workspace with glowing neon holographic marketing analytics dashboards, ambient cinematic lighting, deep violet and cyan palette, minimal ultra-modern aesthetic, 4K resolution.',
      aspectRatio: '16:9',
      imageSize: '2K',
      imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="100%" height="100%"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="50%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#020617"/></linearGradient><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6366f1"/><stop offset="50%" stop-color="#a855f7"/><stop offset="100%" stop-color="#ec4899"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g1)"/><circle cx="200" cy="180" r="280" fill="#6366f1" fill-opacity="0.25" filter="blur(60px)"/><circle cx="1000" cy="450" r="300" fill="#ec4899" fill-opacity="0.2" filter="blur(70px)"/><rect x="100" y="80" width="1000" height="470" rx="28" fill="#0b0f19" fill-opacity="0.9" stroke="url(#g2)" stroke-width="2.5"/><rect x="140" y="125" width="220" height="36" rx="18" fill="url(#g2)" fill-opacity="0.25" stroke="#6366f1" stroke-width="1.2"/><text x="250" y="148" font-family="-apple-system,sans-serif" font-size="13" font-weight="800" fill="#e0e7ff" text-anchor="middle" letter-spacing="1">GEMINI 3 PRO • 2K RESOLUTION</text><text x="600" y="270" font-family="-apple-system,sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-1">Next-Gen Campaign Intelligence</text><text x="600" y="335" font-family="-apple-system,sans-serif" font-size="22" font-weight="400" fill="#94a3b8" text-anchor="middle">Automated Copy • 1K/2K/4K Visuals • Algerian Audio Outros</text><rect x="420" y="390" width="360" height="60" rx="30" fill="url(#g2)"/><text x="600" y="428" font-family="-apple-system,sans-serif" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">Official Launch Edition</text></svg>`),
      style: 'Cinematic 3D Modern',
    },
    dripSequence: [
      {
        step: 1,
        title: 'The Reveal & Privilege',
        sendDelay: 'Day 0 (Immediate)',
        subject: '🚀 Welcome to the future of campaigns: Your VIP pass',
        summary: 'Introduce the core problem, unveil the breakthrough solution, and offer immediate early-bird privilege.',
        keyAction: 'Click to claim founder tier',
      },
      {
        step: 2,
        title: 'Deep-Dive Case Study & Social Proof',
        sendDelay: 'Day 2 (+48 hours)',
        subject: 'How Nadia generated 3.4x higher conversion in 48 hours',
        summary: 'Walk through concrete numbers, screenshot proof, and overcoming common hesitation objections.',
        keyAction: 'Explore interactive demo',
      },
      {
        step: 3,
        title: 'Final Call & Urgency Countdown',
        sendDelay: 'Day 4 (+96 hours)',
        subject: '⚠️ Final 12 Hours: Your 30% advantage is expiring',
        summary: 'Direct urgency reminder, recap of risk-free guarantees, and immediate checkout link.',
        keyAction: 'Final checkout before price reset',
      },
    ],
    createdAt: Date.now(),
  };
}
