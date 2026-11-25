import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AudioLines, Bot, Gift, Heart, MessageCircle, Mic2, Play, Radio, Send, Settings2, Share2, ShieldCheck, Sparkles, Square, Volume2, VolumeX, WifiOff, Users, CircleHelp, SlidersHorizontal } from "lucide-react";
import styles from "./_index.module.css";

type Persona = "wathiq" | "jakleeta";
type Dialect = "iraqi" | "msa";
type EventKind = "follow" | "comment" | "gift" | "share" | "likes" | "moderator" | "join";
type FeedItem = { id: number; kind: EventKind; name: string; text: string; time: string };

const initialFeed: FeedItem[] = [
  { id: 1, kind: "gift", name: "علي الكرخي", text: "أرسل وردة × 5 — شكراً يا داعمنا", time: "الآن" },
  { id: 2, kind: "comment", name: "محمد", text: "واثق شلونك؟", time: "قبل دقيقة" },
  { id: 3, kind: "moderator", name: "سارة", text: "مشرفة البث — ترحيب خاص", time: "قبل دقيقتين" },
];
const eventLabel: Record<EventKind, string> = { follow: "متابعة جديدة", comment: "تعليق", gift: "هدية ودعم", share: "مشاركة", likes: "تكبيس", moderator: "مشرف", join: "دخول مشاهد" };

function makeReply(kind: EventKind, name: string, dialect: Dialect) {
  const n = name.trim() || "صديقنا";
  const iraqi = dialect === "iraqi";
  if (kind === "follow") return iraqi ? "هلا وغلا " + n + "، نورت عائلتنا. شكراً على المتابعة يا طيب." : "أهلاً بك " + n + "، شكراً على المتابعة ونورت البث.";
  if (kind === "gift") return iraqi ? "شكراً من القلب " + n + " على هديتك ودعمك، كفو منك ونورت البث." : "شكراً جزيلاً " + n + " على هديتك ودعمك الكريم.";
  if (kind === "share") return iraqi ? "ممنون منك " + n + " على مشاركة البث، الله يكثر من أمثالك." : "شكراً " + n + " على مشاركة البث ومساعدتنا في الوصول إلى الآخرين.";
  if (kind === "likes") return iraqi ? "يا أبطال، شدّوا حيلكم بالتكبيس والمشاركة، خلّونا نوصل البث للكل!" : "أصدقاؤنا، شاركونا الإعجابات والمشاركة لنصل إلى جمهور أكبر.";
  if (kind === "moderator") return iraqi ? "هلا بالمشرف " + n + "، نورت البث وشكراً على تنظيم اللايف." : "أهلاً بالمشرف " + n + "، شكراً لمساعدتك في تنظيم البث.";
  return iraqi ? "هلا " + n + "، نورتنا." : "أهلاً " + n + "، سعداء بوجودك.";
}

export default function HomePage() {
  const [persona, setPersona] = useState<Persona>("wathiq");
  const [dialect, setDialect] = useState<Dialect>("iraqi");
  const [activeTab, setActiveTab] = useState<"control" | "hosts" | "settings">("control");
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [handle, setHandle] = useState("");
  const [commenter, setCommenter] = useState("محمد");
  const [comment, setComment] = useState("شلونك واثق؟");
  const [reply, setReply] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [connectorDetailsOpen, setConnectorDetailsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceRate, setVoiceRate] = useState(0.94);
  const [voicePitch, setVoicePitch] = useState(1);
  const [likesThreshold, setLikesThreshold] = useState(50);
  const [commentReplies, setCommentReplies] = useState(true);
  const [followWelcome, setFollowWelcome] = useState(true);
  const [giftThanks, setGiftThanks] = useState(true);
  const [shareThanks, setShareThanks] = useState(true);
  const [modWelcome, setModWelcome] = useState(true);
  const [moderators, setModerators] = useState("سارة، مشرف_علي");
  const [statusNote, setStatusNote] = useState("جاهز للتجربة المحلية");
  const [availableVoices, setAvailableVoices] = useState<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const nextId = useRef(4);
  const current = persona === "wathiq"
    ? { name: "واثق الباشا", subtitle: "المذيع الروبوتي", image: "/_cdn/static/381f5088-5e44-4a79-a003-a10a6e0d4c83.png", voiceHint: "صوت ذكوري عميق" }
    : { name: "جكليته", subtitle: "صديقة واثق", image: "/_cdn/static/004445bf-b76e-4e69-8ff6-877e5ed4600f.png", voiceHint: "صوت أنثوي حيوي" };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wathiq-live-settings");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.persona === "wathiq" || s.persona === "jakleeta") setPersona(s.persona);
        if (s.dialect === "iraqi" || s.dialect === "msa") setDialect(s.dialect);
        if (typeof s.handle === "string") setHandle(s.handle);
        if (typeof s.moderators === "string") setModerators(s.moderators);
        if (typeof s.likesThreshold === "number") setLikesThreshold(s.likesThreshold);
      }
    } catch {}
    const sync = () => { if ("speechSynthesis" in window) setAvailableVoices(window.speechSynthesis.getVoices().map(v => v.name)); };
    sync();
    if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = sync;
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem("wathiq-live-settings", JSON.stringify({ persona, dialect, handle, moderators, likesThreshold })); } catch {}
  }, [persona, dialect, handle, moderators, likesThreshold]);

  const moderatorList = useMemo(() => moderators.split(/[،,\n]/).map(x => x.trim().replace(/^@/, "").toLowerCase()).filter(Boolean), [moderators]);
  function speak(text: string) {
    if (muted || !text.trim()) return;
    if (!("speechSynthesis" in window)) { setStatusNote("النطق غير متاح في هذا المتصفح. تحقق من محرك تحويل النص إلى كلام في الهاتف."); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-IQ";
    utterance.rate = voiceRate;
    utterance.pitch = persona === "jakleeta" ? Math.max(0.8, voicePitch + 0.14) : Math.min(1.2, voicePitch - 0.12);
    const arabicVoices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith("ar"));
    if (arabicVoices.length) {
      utterance.voice = arabicVoices.find(v => persona === "jakleeta" ? /female|woman|zira|laila|hoda/i.test(v.name) : /male|man|hamza|naayf/i.test(v.name)) || arabicVoices[0];
    }
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setStatusNote("المذيع يتكلم الآن");
    utterance.onend = () => setStatusNote("المذيع جاهز للرد التالي");
  }
  function stopSpeech() { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setStatusNote("تم إيقاف الصوت"); }
  function addFeed(kind: EventKind, name: string, text: string, shouldSpeak = true) {
    setFeed(prev => [{ id: nextId.current++, kind, name, text, time: "الآن" }, ...prev].slice(0, 18));
    if (shouldSpeak) speak(text);
  }
  function simulate(kind: EventKind) {
    const name = kind === "moderator" ? (moderatorList[0] || "سارة") : kind === "likes" ? "جمهور البث" : kind === "gift" ? "علي الكرخي" : kind === "share" ? "نور" : kind === "follow" ? "أحمد العراقي" : "زائر جديد";
    if (kind === "join") { addFeed("join", name, "دخل البث — لا يتم الترحيب بالمشاهد العادي تلقائياً", false); return; }
    if ((kind === "follow" && !followWelcome) || (kind === "gift" && !giftThanks) || (kind === "share" && !shareThanks) || (kind === "moderator" && !modWelcome)) { addFeed(kind, name, "الحدث مسجل لكن الاستجابة متوقفة من الإعدادات", false); return; }
    addFeed(kind, name, makeReply(kind, name, dialect), true);
  }
  async function askAI() {
    const q = comment.trim();
    if (!q || aiBusy || !commentReplies) return;
    setAiBusy(true); setReply("");
    try {
      const response = await fetch("/_api/live/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ persona, dialect, username: commenter.trim() || "صديقنا", comment: q }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "تعذر الحصول على رد الذكاء الاصطناعي");
      const text = String(data.reply || "").trim();
      setReply(text); addFeed("comment", commenter.trim() || "صديقنا", text, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      setReply(message); setStatusNote(message);
    } finally { setAiBusy(false); }
  }
  const iconFor = (kind: EventKind) => {
    if (kind === "gift") return <Gift size={16} />;
    if (kind === "share") return <Share2 size={16} />;
    if (kind === "likes") return <Heart size={16} />;
    if (kind === "moderator") return <ShieldCheck size={16} />;
    if (kind === "follow") return <Users size={16} />;
    if (kind === "join") return <Activity size={16} />;
    return <MessageCircle size={16} />;
  };

  return (
    <main className={styles.app} dir="rtl">
      <header className={styles.topbar}>
        <div className={styles.brand}><div className={styles.brandMark}><Bot size={22} /></div><div><strong>WAThIQ <span>AI LIVE</span></strong><small>مركز قيادة البث الذكي</small></div></div>
        <div className={styles.topActions}><span className={styles.demoTag}><span /> وضع تجريبي</span><button className={styles.iconButton} onClick={() => setMuted(v => !v)} aria-label="كتم الصوت">{muted ? <VolumeX /> : <Volume2 />}</button></div>
      </header>
        <section className={styles.connectionStrip}>
        <div className={styles.connectionIcon}><WifiOff size={19} /></div>
        <div className={styles.connectionText}><strong>تيك توك LIVE غير متصل</strong><span>نسخة الويب الحالية للتجربة؛ تشغيل تيك توك وواثق على الهاتف نفسه يحتاج خدمة Android تعمل foreground وخادماً لاستقبال أحداث البث.</span></div>
        <button className={styles.connectorButton} onClick={() => setConnectorDetailsOpen(v => !v)} aria-expanded={connectorDetailsOpen}>تفاصيل الربط</button>
      </section>
      {connectorDetailsOpen && <section className={styles.notice} role="status" aria-live="polite"><CircleHelp size={18} /><div><strong>إعداد البث من هاتف Android واحد</strong><p>هذه النسخة تعمل كتطبيق ويب تجريبي وليست خدمة Android أصلية تعمل باستمرار في الخلفية. لتشغيلها مع TikTok على الهاتف نفسه نحتاج بناء تطبيق Android بخدمة أمامية مستمرة، وموصل أحداث بث يعمل عبر خادم، ثم اختبار استمرار الصوت عند الانتقال إلى TikTok. لا يوجد ربط حقيقي حالياً. لا تدخل كلمة مرور تيك توك أو رمز التحقق أو ملفات الجلسة.</p><p>مهم: صوت المعاينة يخرج من الهاتف ولا يُضمن أن يدخل إلى بث TikTok. التقاط صوت تطبيق آخر على Android يخضع لموافقة النظام ولسماح التطبيق المصدر بالتقاط صوته؛ لذلك لا يمكن افتراض أن تعليقات/صوت TikTok يمكن التقاطها من هذا التطبيق.</p><button className={styles.textButton} onClick={() => setConnectorDetailsOpen(false)}>إغلاق التفاصيل</button></div></section>}
      <nav className={styles.tabs}>
        <button className={activeTab === "control" ? styles.activeTab : ""} onClick={() => setActiveTab("control")}><Radio size={16} /> لوحة البث</button>
        <button className={activeTab === "hosts" ? styles.activeTab : ""} onClick={() => setActiveTab("hosts")}><Bot size={16} /> المذيعان</button>
        <button className={activeTab === "settings" ? styles.activeTab : ""} onClick={() => setActiveTab("settings")}><Settings2 size={16} /> الإعدادات</button>
      </nav>
      {activeTab === "control" && <>
        <section className={styles.hero}>
          <div className={styles.heroCopy}><div className={styles.eyebrow}><Sparkles size={14} /> مذيعك الاصطناعي</div><h1>خلّي البث <em>يتفاعل</em></h1><p>واثق وجكليته يقرؤون التعليقات في وضع التجربة ويجهزون ردوداً صوتية باللهجة العراقية.</p><div className={styles.heroButtons}><button className={styles.primaryButton} onClick={() => { setDemoMode(v => !v); setStatusNote(demoMode ? "تم إيقاف وضع التجربة" : "بدأ وضع التجربة المحلية — لا يوجد اتصال بتيك توك"); }}><Play size={16} /> {demoMode ? "إيقاف التجربة" : "بدء التجربة"}</button><button className={styles.secondaryButton} onClick={stopSpeech}><Square size={14} /> إيقاف الصوت</button></div></div>
          <div className={styles.heroRobot}><div className={persona === "jakleeta" ? styles.pinkAura : styles.robotAura} /><img src={current.image} alt={current.name} /><div className={styles.robotName}><strong>{current.name}</strong><span>{current.subtitle}</span></div></div>
        </section>
        <section className={styles.statusRow}><div className={styles.statusCard}><span className={styles.statusDot} /><div><small>حالة المذيع</small><strong>{demoMode ? "يعمل تجريبياً" : "جاهز"}</strong></div></div><div className={styles.statusCard}><AudioLines size={18} /><div><small>صوت الهاتف</small><strong>{muted ? "مكتوم" : availableVoices.length ? availableVoices.length + " صوتاً محلياً" : "محرك الهاتف"}</strong></div></div><div className={styles.statusCard}><Activity size={18} /><div><small>الأحداث</small><strong>{feed.length} في السجل</strong></div></div></section>
        <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.sectionKicker}>اختبار مباشر</span><h2>جرّب أحداث البث</h2></div><span className={styles.localOnly}>محاكاة محلية</span></div><div className={styles.eventGrid}>
          <button onClick={() => simulate("follow")}><Users /><strong>متابع جديد</strong><small>يرحّب باسمه</small></button>
          <button onClick={() => simulate("gift")}><Gift /><strong>هدية ودعم</strong><small>يشكر الداعم</small></button>
          <button onClick={() => simulate("share")}><Share2 /><strong>مشاركة البث</strong><small>يشكر المشاركة</small></button>
          <button onClick={() => simulate("likes")}><Heart /><strong>تكبيس</strong><small>يشجع الإعجابات</small></button>
          <button onClick={() => simulate("moderator")}><ShieldCheck /><strong>دخول مشرف</strong><small>ترحيب خاص</small></button>
          <button onClick={() => simulate("join")}><Users /><strong>دخول مشاهد</strong><small>بدون ترحيب تلقائي</small></button>
        </div></section>
        <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.sectionKicker}>ذكاء اصطناعي · صوت فقط</span><h2>اسأل المذيع</h2></div><span className={styles.aiTag}><Volume2 size={12} /> رد صوتي فقط</span></div>
          <div className={styles.aiPanel}><label>اسم صاحب التعليق<input value={commenter} onChange={e => setCommenter(e.target.value)} placeholder="اسم المتابع" /></label><label>اكتب التعليق أو السؤال<textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="مثلاً: شنو رأيك بالذكاء الاصطناعي؟" /></label>
            <button className={styles.primaryButton} disabled={aiBusy || !comment.trim() || !commentReplies} onClick={askAI}>{aiBusy ? "جاري التفكير..." : <><Send size={15} /> جاوب بصوت {persona === "wathiq" ? "واثق" : "جكليته"}</>}</button>
            {reply && <div className={styles.replyBox}><span>نص الرد الصوتي · للمعاينة داخل التطبيق فقط</span><p>{reply}</p><button onClick={() => speak(reply)}><Volume2 size={14} /> إعادة تشغيل الصوت</button></div>}
            <small className={styles.helperText}>واثق يتحدث بالصوت فقط. لا يرسل ردوداً كتابية إلى دردشة تيك توك؛ النص أعلاه للمعاينة والسجل داخل التطبيق فقط. عند استخدام هاتف واحد، لا ينتقل صوت المعاينة تلقائياً إلى بث تيك توك، وقد يوقف Android صوت صفحة الويب عند انتقالك إلى تيك توك. يلزم تطبيق Android أصلي مع خدمة صوت مستمرة ومسار صوت متوافق. تُستخدم خدمة الذكاء الاصطناعي من الخادم وقد تُستهلك أرصدة AI.</small>
          </div>
        </section>
        <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.sectionKicker}>آخر النشاطات</span><h2>سجل البث</h2></div><button className={styles.textButton} onClick={() => setFeed([])}>مسح السجل</button></div>
          <div className={styles.feed}>{feed.length === 0 ? <div className={styles.emptyFeed}>لا توجد أحداث بعد. جرّب أحد أزرار المحاكاة.</div> : feed.map(item => <div className={styles.feedItem} key={item.id}><div className={styles.feedIcon}>{iconFor(item.kind)}</div><div className={styles.feedBody}><div><strong>{item.name}</strong><span>{eventLabel[item.kind]}</span></div><p>{item.text}</p></div><time>{item.time}</time></div>)}</div>
        </section>
      </>}
      {activeTab === "hosts" && <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.sectionKicker}>الشخصيات السيبرانية</span><h2>اختار المذيع</h2></div></div>
        <div className={styles.hostGrid}>
          <button className={styles.hostCard + (persona === "wathiq" ? " " + styles.hostSelected : "")} onClick={() => setPersona("wathiq")}><img src="/_cdn/static/381f5088-5e44-4a79-a003-a10a6e0d4c83.png" alt="واثق الباشا" /><span className={styles.hostAccent}>CYBER HOST 01</span><strong>واثق الباشا</strong><small>روبوت ذكوري · هادئ وواثق</small><span className={styles.hostPick}>{persona === "wathiq" ? "المذيع المختار" : "اختيار واثق"}</span></button>
          <button className={styles.hostCard + (persona === "jakleeta" ? " " + styles.hostSelected : "")} onClick={() => setPersona("jakleeta")}><img src="/_cdn/static/004445bf-b76e-4e69-8ff6-877e5ed4600f.png" alt="جكليته" /><span className={styles.hostAccentPink}>CYBER HOST 02</span><strong>جكليته</strong><small>روبوت أنثوي · حيوية ومرحة</small><span className={styles.hostPick}>{persona === "jakleeta" ? "المذيعة المختارة" : "اختيار جكليته"}</span></button>
        </div>
        <div className={styles.voiceTest}><div><Mic2 size={18} /><div><strong>اختبار صوت المذيع</strong><small>{current.voiceHint} — يعتمد توفره على محرك الأصوات المثبت في أندرويد.</small></div></div><button className={styles.primaryButton} onClick={() => speak(persona === "wathiq" ? "أنا واثق الباشا، مذيعك الذكي. هلا بكل المتابعين والداعمين." : "هلا والله، آني جكليته صديقة واثق. نورتوا البث يا أحلى جمهور.")}><Volume2 size={15} /> تجربة الصوت</button></div>
        <div className={styles.notice}><CircleHelp size={17} /><p>تغيير نبرة الصوت وحده لا يضمن صوت ولد أو بنت مختلفاً. اختر صوتاً عربياً مناسباً من إعدادات تحويل النص إلى كلام في الهاتف عند توفره.</p></div>
      </section>}
      {activeTab === "settings" && <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.sectionKicker}>تخصيص النظام</span><h2>إعدادات المذيع</h2></div><SlidersHorizontal size={20} /></div>
        <div className={styles.settingsPanel}>
          <label>اسم حساب تيك توك<input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@username" dir="ltr" /></label>
          <label>أسماء المشرفين المعروفة<input value={moderators} onChange={e => setModerators(e.target.value)} placeholder="الأسماء وافصل بينها بفاصلة" /></label>
          <div className={styles.settingLine}><div><strong>اللهجة</strong><small>طريقة كلام واثق وجكليته</small></div><div className={styles.segment}><button className={dialect === "iraqi" ? styles.segmentActive : ""} onClick={() => setDialect("iraqi")}>عراقية</button><button className={dialect === "msa" ? styles.segmentActive : ""} onClick={() => setDialect("msa")}>فصحى</button></div></div>
          <SettingToggle label="الترحيب بالمتابعين الجدد" desc="ذكر اسم المتابع وشكره على المتابعة" value={followWelcome} onChange={setFollowWelcome} />
          <SettingToggle label="شكر الهدايا والداعمين" desc="إعطاء الأولوية لأصحاب الهدايا" value={giftThanks} onChange={setGiftThanks} />
          <SettingToggle label="شكر المشاركات" desc="شكر من يشارك رابط البث" value={shareThanks} onChange={setShareThanks} />
          <SettingToggle label="الترحيب بالمشرفين" desc="فقط عند معرفة أن الداخل مشرف" value={modWelcome} onChange={setModWelcome} />
          <SettingToggle label="الرد على التعليقات والأسئلة" desc="يحتاج اتصال الذكاء الاصطناعي" value={commentReplies} onChange={setCommentReplies} />
          <div className={styles.settingLine}><div><strong>عتبة تشجيع التكبيس</strong><small>كل كم إعجاب نذكّر الجمهور</small></div><select value={likesThreshold} onChange={e => setLikesThreshold(Number(e.target.value))}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={250}>250</option></select></div>
          <div className={styles.settingLine}><div><strong>سرعة الكلام</strong><small>{voiceRate.toFixed(2)}×</small></div><input type="range" min="0.75" max="1.2" step="0.05" value={voiceRate} onChange={e => setVoiceRate(Number(e.target.value))} /></div>
          <div className={styles.settingLine}><div><strong>نبرة الصوت</strong><small>{voicePitch.toFixed(2)}</small></div><input type="range" min="0.8" max="1.2" step="0.05" value={voicePitch} onChange={e => setVoicePitch(Number(e.target.value))} /></div>
          <button className={styles.secondaryButtonFull} onClick={() => { setCommentReplies(true); setFollowWelcome(true); setGiftThanks(true); setShareThanks(true); setModWelcome(true); setStatusNote("تم تفعيل الاستجابات المحددة"); }}>إعادة تفعيل الاستجابات</button>
        </div>
      </section>}
      <footer className={styles.footer}><div className={styles.footerBrand}><Bot size={17} /><strong>WAThIQ AI LIVE</strong></div><p>{statusNote}</p><small>نسخة تجريبية — لا يوجد اتصال حي بتيك توك حتى الآن.</small></footer>
    </main>
  );
}

function SettingToggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return <div className={styles.settingLine}><div><strong>{label}</strong><small>{desc}</small></div><button role="switch" aria-checked={value} className={styles.switch + (value ? " " + styles.switchOn : "")} onClick={() => onChange(!value)}><span /></button></div>;
}