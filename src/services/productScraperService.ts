import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';
import { AlgiersPersonaId } from './algerianPersonaVoiceService';

export interface ExtractedProductData {
  title: string;
  price?: string;
  currency?: string;
  description: string;
  imageUrl?: string;
  brand?: string;
  features: string[];
  sourceUrl: string;
}

export interface GenerateScriptFromUrlRequest {
  productUrl: string;
  campaignType?: string; // e.g. 'ecommerce_flash_sale' | 'product_launch' | 'brand_trust'
  persona?: AlgiersPersonaId; // e.g. 'zephyr_warm' | 'child_boy' | 'elderly_man'
  discountPercent?: string; // optional, e.g. '30%'
}

export interface GenerateScriptFromUrlResponse {
  success: boolean;
  extractedProduct: ExtractedProductData;
  generatedScript: string;
  suggestedEmotion: string;
  personaUsed: AlgiersPersonaId;
  campaignType: string;
  highlightedLoanwords: string[];
}

const DEMO_STORE_PRESETS: Record<string, ExtractedProductData> = {
  'smartwatch-ultra-dz': {
    title: 'ساعة ذكية Smartwatch Ultra Pro المقاومة للماء',
    price: '4800 دج',
    currency: 'دج',
    description: 'ساعة ذكية أصلية بشاشة AMOLED تعمل باللمس، بطارية تدوم 7 أيام، ومقاومة تامة للماء والتعرق مع حساسات دقيقة لقياس نبضات القلب والأنشطة الرياضية.',
    brand: 'Algeria Tech Store',
    features: ['مقاومة للماء IP68', 'شاشة AMOLED فائقة الوضوح', 'بطارية تدوم أسبوعاً', 'ضمان رسمي 12 شهر'],
    sourceUrl: 'https://algeria-tech-store.dz/products/smartwatch-ultra-dz',
  },
  'sneakers-air-pro': {
    title: 'حذاء رياضي أصلي Sneakers Air Pro خفيف ومريح',
    price: '5900 دج',
    currency: 'دج',
    description: 'حذاء رياضي أنيق ومريح جداً للجري والمشي اليومي، نعل طبي ممتص للصدمات ومواد فاخرة تضمن التهوية والمتانة.',
    brand: 'Sport Fashion DZ',
    features: ['نعل هوائي طبي مريح', 'خامات أصلية عالية التهوية', 'ألوان عصرية جذابة', 'مقاسات من 39 إلى 45'],
    sourceUrl: 'https://sport-fashion.dz/products/sneakers-air-pro',
  },
  'caftan-algerois-prestige': {
    title: 'قفطان عاصمي تقليدي راقي مطرز يدوياً',
    price: '18500 دج',
    currency: 'دج',
    description: 'قفطان جزائري أصيل بتطريز المجبود والفتلة اليدوية الفاخرة، قماش قطيفة ملكي للمناسبات والأعراس مع حزام تقليدي راقٍ.',
    brand: 'دار البهجة للأزياء التقليدية',
    features: ['تطريز يدوي عاصمي فاخر', 'قطيفة ملكية عالية الجودة', 'تصميم بهجاوي أصيل', 'توصيل مغلف فخم لـ 58 ولاية'],
    sourceUrl: 'https://dar-el-bahdja.dz/products/caftan-algerois-prestige',
  },
  'wireless-earbuds-pro': {
    title: 'سماعات بلوتوث لاسلكية عازلة للضوضاء ANC',
    price: '3400 دج',
    currency: 'دج',
    description: 'سماعات أذن لاسلكية بتقنية البلوتوث 5.3، عزل نشط للضوضاء الخارجية، صوت ستيريو محيطي ثلاثي الأبعاد ومايكروفون نقي للمكالمات.',
    brand: 'DZ Gadgets',
    features: ['عزل صوتي نشط ANC', 'بلوتوث 5.3 فائق السرعة', 'شحن سريع عبر Type-C', 'بطارية تدوم 24 ساعة مع العلبة'],
    sourceUrl: 'https://dz-gadgets.com/products/wireless-earbuds-pro',
  },
};

/**
 * Scrapes product page and extracts structured e-commerce metadata
 */
export async function scrapeProductUrl(productUrl: string): Promise<ExtractedProductData> {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(productUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol. Must be http or https.');
    }
  } catch {
    throw new Error('الرابط المدخل غير صالح. يرجى إدخال رابط متجر صحيح يبدأ بـ https://');
  }

  // Fast-track demo sample store URLs without network latency
  for (const [key, preset] of Object.entries(DEMO_STORE_PRESETS)) {
    if (productUrl.toLowerCase().includes(key)) {
      return { ...preset, sourceUrl: productUrl };
    }
  }

  // 1. Check if Shopify product URL (ends with /products/{handle})
  if (parsedUrl.pathname.includes('/products/')) {
    try {
      const jsonUrl = `${parsedUrl.origin}${parsedUrl.pathname}.json`;
      const jsonRes = await fetch(jsonUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(3000),
      });

      if (jsonRes.ok) {
        const data = await jsonRes.json();
        if (data.product) {
          const p = data.product;
          const price = p.variants?.[0]?.price ? `${p.variants[0].price} DZD` : undefined;
          const cleanDesc = (p.body_html || '')
            .replace(/<[^>]*>?/gm, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 400);

          return {
            title: p.title || 'منتج متجر إلكتروني',
            price,
            description: cleanDesc || p.title,
            imageUrl: p.image?.src || p.images?.[0]?.src,
            brand: p.vendor,
            features: [p.product_type, ...(p.tags || [])].filter(Boolean).slice(0, 4),
            sourceUrl: productUrl,
          };
        }
      }
    } catch {
      // Continue to HTML scraping
    }
  }

  // 2. Fetch raw HTML with resilient timeout and fallback
  let html = '';
  try {
    const res = await fetch(productUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      html = await res.text();
    }
  } catch {
    // Network or DNS unreachable; gracefully handle via URL path heuristic
  }

  if (!html) {
    const pathSlug = parsedUrl.pathname.split('/').filter(Boolean).pop() || 'product';
    const guessedTitle = decodeURIComponent(pathSlug).replace(/[-_]/g, ' ');
    return {
      title: guessedTitle || 'منتج تسوق حصري',
      description: `منتج مميز متوفر للطلب عبر المتجر بأسعار تنافسية.`,
      features: ['جودة مضمونة', 'توصيل لـ 58 ولاية', 'دفع عند الاستلام'],
      sourceUrl: productUrl,
    };
  }

  const $ = cheerio.load(html);

  // 3. Try parsing Schema.org JSON-LD
  let schemaData: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (!content) return;
      const parsed = JSON.parse(content);
      if (parsed['@type'] === 'Product') {
        schemaData = parsed;
      } else if (Array.isArray(parsed['@graph'])) {
        const prod = parsed['@graph'].find((item: any) => item['@type'] === 'Product');
        if (prod) schemaData = prod;
      }
    } catch {
      // ignore json parse error
    }
  });

  // 4. Extract fields with prioritization
  const title =
    schemaData?.name ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('h1.product-title, h1.product_title, h1').first().text().trim() ||
    $('title').text().trim().split(/[-|]/)[0].trim() ||
    'منتج متجر إلكتروني';

  const rawPrice =
    schemaData?.offers?.price ||
    schemaData?.offers?.[0]?.price ||
    $('meta[property="product:price:amount"]').attr('content') ||
    $('meta[property="og:price:amount"]').attr('content') ||
    $('.price, .product-price, .current-price, .price-item').first().text().trim();

  const currency =
    schemaData?.offers?.priceCurrency ||
    $('meta[property="product:price:currency"]').attr('content') ||
    (rawPrice && rawPrice.includes('DA') ? 'DA' : 'دج');

  const price = rawPrice ? `${String(rawPrice).replace(/[^\d.,]/g, '')} ${currency}`.trim() : undefined;

  const description =
    schemaData?.description ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('.product-description, .product-details, #description, .description').first().text().trim() ||
    'منتج عالي الجودة متوفر للطلب مع التوصيل السريع لـ 58 ولاية.';

  const imageUrl =
    (Array.isArray(schemaData?.image) ? schemaData.image[0] : schemaData?.image) ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('.product-image img, img.product-featured-image').attr('src');

  // Extract key bullet points / features
  const features: string[] = [];
  $('ul.product-features li, .product-details li, ul.features li')
    .slice(0, 4)
    .each((_, el) => {
      const txt = $(el).text().trim();
      if (txt && txt.length < 80) features.push(txt);
    });

  if (features.length === 0) {
    features.push('جودة ممتازة مضمونة', 'توصيل لـ 58 ولاية', 'الدفع عند الاستلام');
  }

  return {
    title: title.slice(0, 100),
    price: price && price.length < 30 ? price : undefined,
    currency,
    description: description.replace(/\s+/g, ' ').slice(0, 300),
    imageUrl,
    brand: schemaData?.brand?.name || $('meta[property="og:site_name"]').attr('content'),
    features,
    sourceUrl: productUrl,
  };
}

/**
 * Generates an Algerian Algiers Dialect E-Commerce Ad Script from Extracted Data using Gemini
 */
export async function generateAdScriptFromProduct(
  ai: GoogleGenAI,
  productData: ExtractedProductData,
  campaignType = 'ecommerce_flash_sale',
  persona: AlgiersPersonaId = 'zephyr_warm'
): Promise<{ script: string; suggestedEmotion: string; loanwords: string[] }> {
  const personaGuide = getPersonaCopywritingGuide(persona);

  const systemPrompt = `أنت خبير محترف ومبتكر في كتابة سكريبتات الإعلانات التجارية (Direct Response Copywriting) المتخصصة في التجارة الإلكترونية الجزائرية.
مهمتك كتابة سكريبت إعلاني صوتي جذاب، فوري، وقصير (بين 25 إلى 45 كلمة - حوالي 12-18 ثانية إلقاء) بالدارجة الجزائرية العاصمية الصافية (وسط الجزائر):

المعايير الإلزامية:
1. اللهجة: دارجة عاصمية بيضاء أصيلة (خاوتي وخواتاتي، واش راكم، هايل بزاف، ديرو لاكوموند، يعطيكم الصحة).
2. منع التداخل المغربي: ممنوع منعاً باتاً استعمال كلمات مغربية مثل (دابا، واخا، مزيان، ديال، كيدير، شنو، عافاك).
3. دمج الكلمات الفرنسية التجارية (Code-Switching): ادمج بذكاء كلمات مثل (Prix, Livraison, Stock, Commande, Promo, Qualité) كما ينطقها العاصميون.
4. الـ Call To Action الإلزامي: التأكيد في الختام على أن التوصيل متوفر لـ 58 ولاية والدفع عند الاستلام (COD).
5. صوت وشخصية الإلقاء: ${personaGuide.instructions}.

المطلوب إخراجه كـ JSON يحتوي:
- script: نص السكريبت الإعلاني المشكل والمضبوط بالنطق العاصمي.
- suggestedEmotion: النبرة المقترحة للشخصية (مثل: warm_persuasion أو commercial_urgency أو laughter_smile).
- loanwords: قائمة الكلمات الفرنسية المدمجة في السكريبت.`;

  const userPrompt = `تفاصيل المنتج المستخرجة من المتجر:
- اسم المنتج: "${productData.title}"
${productData.price ? `- السعر: "${productData.price}"` : ''}
${productData.brand ? `- المتجر أو العلامة: "${productData.brand}"` : ''}
- الوصف والمميزات: "${productData.description}"
- مميزات المنتج: ${productData.features.join(' • ')}
- نوع الحملة: ${campaignType}
- الشخصية المستهدفة: ${persona}

اكتب السكريبت الإعلاني العاصمي الأكثر إقناعاً وتحقيقاً للمبيعات.`;

  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let script = '';
  let suggestedEmotion = personaGuide.defaultEmotion;
  let loanwords = ['Livraison', 'Prix', 'Stock', 'Commande'];

  for (const m of models) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.script) {
          script = parsed.script;
          if (parsed.suggestedEmotion) suggestedEmotion = parsed.suggestedEmotion;
          if (Array.isArray(parsed.loanwords)) loanwords = parsed.loanwords;
          break;
        }
      }
    } catch (err: unknown) {
      console.warn(`Model ${m} failed for URL script generation:`, (err as Error).message);
    }
  }

  // Fallback deterministic script if Gemini API is unreachable
  if (!script) {
    script = createDeterministicAdScript(productData, persona);
  }

  return { script, suggestedEmotion, loanwords };
}

function getPersonaCopywritingGuide(persona: AlgiersPersonaId) {
  switch (persona) {
    case 'young_woman_ad':
      return {
        instructions: 'أسلوب امرأة شابة خبيرة إعلانات عصرية لمستحضرات التجميل والموضة والأناقة، إقناع راقي وجذاب مع مصطلحات الجمال والعناية',
        defaultEmotion: 'warm_persuasion',
      };
    case 'storyteller_man':
      return {
        instructions: 'أسلوب راوي قصص تجارية سينمائي ملهم، سرد درامي عميق يروي رحلة المنتج وأصالته وقيمته ويثير الفضول والثقة العاطفية',
        defaultEmotion: 'nostalgia_warmth',
      };
    case 'child_boy':
      return {
        instructions: 'أسلوب طفل عاصمي مرح وفرحان بالمنتج، كلام عفوي طفولي وحيوي',
        defaultEmotion: 'laughter_smile',
      };
    case 'child_girl':
      return {
        instructions: 'أسلوب طفلة صغيرة لطيفة وبريئة تعبر عن حبها وفرحتها بالمنتج',
        defaultEmotion: 'sweet_joy',
      };
    case 'elderly_man':
      return {
        instructions: 'أسلوب شيخ وقور (عمي الشيخ) يمدح جودة المنتج بالبركة والنصيحة والصدق',
        defaultEmotion: 'calm_paternal_advice',
      };
    case 'elderly_woman':
      return {
        instructions: 'أسلوب لالة أو الحاجة الحنينة مع دعاء وبركة ومدح لراحة وجودة السلعة',
        defaultEmotion: 'maternal_affection',
      };
    case 'zephyr_warm':
    default:
      return {
        instructions: 'أسلوب شاب إعلاني تسويقي نشط ومقنع، حماس فلاش سيل وسرعة حسم',
        defaultEmotion: 'commercial_urgency',
      };
  }
}

function createDeterministicAdScript(product: ExtractedProductData, persona: AlgiersPersonaId): string {
  const title = product.title.slice(0, 45);
  const priceSnippet = product.price ? `بـ بري هايل ${product.price}` : 'بـ بري شوك وتخفيض خاص';

  if (persona === 'young_woman_ad') {
    return `سلام لي فيم! جبتلكم اليوم هاد الـ ${title} الفوقاني في لا كاليتي. حاجة طوب للبشرة والأناقة و ${priceSnippet}! ديرو لا كوموند تاعكم دركا خياتي، ولا ليفريزون متوفرة لـ 58 ولاية والدفع عند الاستلام بعد المعاينة!`;
  }
  if (persona === 'storyteller_man') {
    return `الحكاية بدات نهار حوسنا على منتج يجمع بين الأصالة والجودة الحقيقية.. وهكدا خرج هاد الـ ${title}. ماشي مجرد سلعة عادية، هادي تجربة تبدل يومياتكم ${priceSnippet}. اطلبوه دركا، التوصيل واصل لباب داركم في 58 ولاية والدفع بعد الاستلام.`;
  }
  if (persona === 'child_boy') {
    return `ياي شوفوا ${title}! شحال شباب وفور بزاف، بابا شرولي ودوك نلعب بيه وفرحان بيه بزاف! كومانداوه دركا خاوتي، ولا ليفريزون حتال باب الدار في 58 ولاية والدفع عند الاستلام!`;
  }
  if (persona === 'child_girl') {
    return `شحال فرحانة بـ ${title}! هايل بزاف وعجبني، شوفو شحال شباب وماما فرحت بيه! اطلبوه دركا لوليداتكم، التوصيل متوفر لـ 58 ولاية والدفع كي تلحقكم لا كوموند!`;
  }
  if (persona === 'elderly_man') {
    return `يا وليداتي، سلعة نقية ومضمونة ربي يبارك في هاد الـ ${title}. الصدق والبركة في السومة والخدمة، والتوصيل واصل حتى لباب داركم في 58 ولاية والدفع عند الاستلام.`;
  }
  if (persona === 'elderly_woman') {
    return `سعاية مبروكة إن شاء الله! هاد الـ ${title} هايل بزاف وحنين وراقي، تلبسوه وتستعملوه بالصحة والهنا. ديرو لا كوموند تاعكم دركا، التوصيل لـ 58 ولاية وبصحتكم مسبقاً.`;
  }

  // zephyr_warm (Commercial Lead)
  return `يا خاوتي الفلاش سيل راهو هنا! جبنالكم ${title} ${priceSnippet}. الستوك راهو محدود بزاف، ديرو لا كوموند تاعكم دركا قبل ما يخلاص، ولا ليفريزون متوفرة لـ 58 ولاية والدفع عند الاستلام!`;
}
