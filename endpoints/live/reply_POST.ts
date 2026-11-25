import { flootAi, FlootAiOutOfCreditsError } from "@floot/ai";
import { schema } from "./reply_POST.schema";

export async function handle(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "تعذر قراءة الطلب." }, { status: 400 });
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return Response.json({ error: "تأكد من اسم المعلق ونص التعليق." }, { status: 400 });
  }

  const { persona, dialect, username, comment } = parsed.data;
  const hostName = persona === "jakleeta" ? "جكليته" : "واثق الباشا";
  const language = dialect === "iraqi" ? "لهجة عراقية طبيعية ومهذبة" : "العربية الفصحى المبسطة";
  const instructions = [
    "أنت " + hostName + "، مذيع ذكاء اصطناعي في بث مباشر.",
    "تحدث كمنشّط بث طبيعي وودود، لا كروبوت يقرأ نصاً محفوظاً. اكتب رداً واحداً قصيراً قابلاً للنطق بصوت مرتفع، بحد أقصى 35 كلمة.",
    "تحدث بـ" + language + ". خاطب صاحب التعليق باسمه: " + username + ".",
    "أجب عن السؤال مباشرة إذا كان واضحاً. إذا نقص السياق فاسأل سؤال توضيح واحداً قصيراً.",
    "لا تخترع معلومات أو أخباراً أو أرقاماً. عندما لا تعرف، قل ذلك بوضوح.",
    "لا تستخدم markdown أو قوائم أو رموزاً تعبيرية أو مقدمات مطولة.",
    "لا تطلب من المشاهد بيانات شخصية أو كلمات مرور أو معلومات حساسة.",
    "نوّع صياغتك وتجنب تكرار نفس الافتتاحيات. إذا كان التعليق تحية أو مزاحاً أو مجاملة، ردّ بلطف واسأل سؤالاً خفيفاً يحافظ على الحوار. إذا كان السؤال ناقص السياق فاسأل سؤال توضيح واحداً قصيراً. اجعل كل سؤال متابعة جزءاً من الكلام المنطوق.",
    "هذا المساعد يرد بالصوت فقط؛ لا تنشئ رسالة دردشة أو أمراً لإرسال نص إلى تيك توك. إذا سُئلت هل أنت إنسان، أجب بصدق أنك مذيع ذكاء اصطناعي.",
  ].join(" ");

  try {
    const result = await flootAi.chat({
      model: "gpt-6-luna",
      instructions,
      input: "تعليق " + username + ": " + comment,
      reasoning: { effort: "none" },
      max_output_tokens: 180,
    });
    const reply = String(result.output_text || "").trim();
    if (!reply) {
      return Response.json({ error: "لم يتم إنشاء رد واضح. حاول مرة أخرى." }, { status: 502 });
    }
    return Response.json({ reply });
  } catch (error) {
    if (error instanceof FlootAiOutOfCreditsError) {
      return Response.json({ error: "خدمة الذكاء الاصطناعي متوقفة مؤقتاً لنفاد الرصيد.", code: "OUT_OF_CREDITS" }, { status: 503 });
    }
    console.error("[live/reply] AI request failed", error);
    return Response.json({ error: "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. حاول بعد قليل." }, { status: 503 });
  }
}