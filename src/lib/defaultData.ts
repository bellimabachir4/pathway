import { Lesson, Vocabulary, LiveSession } from "../types";

export const defaultLessons: Lesson[] = [
  {
    id: "grammar-1",
    title: "Present Simple vs. Present Continuous",
    titleAr: "المضارع البسيط مقابل المضارع المستمر",
    category: "grammar",
    level: "A1",
    content: `### 1. Present Simple
We use the **Present Simple** to talk about:
* **Habits and routines:** I drink coffee every morning.
* **General truths or facts:** The sun rises in the east.
* **Permanent states:** She lives in London.

**Form:** 
* Subject + Verb (add '-s' or '-es' for third-person: he/she/it).
* *Example:* He speaks English.

---

### 2. Present Continuous
We use the **Present Continuous** to talk about:
* **Actions happening right now:** I am reading this lesson.
* **Temporary situations:** They are staying in a hotel this week.

**Form:** 
* Subject + am/is/are + Verb-ing.
* *Example:* She is studying grammar.

---

### Key Summary
* **Simple:** Habits, permanent things. (I work here)
* **Continuous:** Now, temporary things. (I am working right now)`,
    contentAr: `### 1. المضارع البسيط (Present Simple)
نستخدم **المضارع البسيط** للتحدث عن:
* **العادات والروتين اليومي:** أشرب القهوة كل صباح. (I drink coffee every morning)
* **الحقائق العامة:** تشرق الشمس من الشرق. (The sun rises in the east)
* **الحالات الدائمة:** هي تعيش في لندن. (She lives in London)

**الصيغة:**
* الفاعل (Subject) + الفعل الأساسي (Verb) (مع إضافة 's' أو 'es' للمفرد الغائب: he/she/it).
* *مثال:* هو يتحدث الإنجليزية. (He speaks English)

---

### 2. المضارع المستمر (Present Continuous)
نستخدم **المضارع المستمر** للتحدث عن:
* **أحداث تحدث الآن في هذه اللحظة:** أنا أقرأ هذا الدرس الآن. (I am reading this lesson)
* **مواقف مؤقتة:** هم يقيمون في فندق هذا الأسبوع. (They are staying in a hotel this week)

**الصيغة:**
* الفاعل + am/is/are + الفعل مضافاً إليه ing.
* *مثال:* هي تدرس القواعد حالياً. (She is studying grammar)

---

### ملخص رئيسي
* **البسيط:** للعادات والأمور الدائمة.
* **المستمر:** للأحداث الجارية الآن والأمور المؤقتة.`,
    quiz: [
      {
        question: "Choose the correct sentence for a daily routine:",
        options: [
          "I am drinking milk every day.",
          "I drinks milk every day.",
          "I drink milk every day.",
          "I was drinking milk every day."
        ],
        correctAnswer: 2
      },
      {
        question: "Look! She ____ a beautiful red dress today.",
        options: [
          "wears",
          "is wearing",
          "wear",
          "wearing"
        ],
        correctAnswer: 1
      },
      {
        question: "Water ____ at 100 degrees Celsius.",
        options: [
          "boils",
          "is boiling",
          "boil",
          "boiled"
        ],
        correctAnswer: 0
      }
    ],
    createdAt: "2026-06-24T00:00:00Z"
  },
  {
    id: "vocabulary-1",
    title: "Essential Adjectives for Success",
    titleAr: "صفات أساسية للنجاح والتميز",
    category: "vocabulary",
    level: "B1",
    content: `### Expand Your Vocabulary
To speak English naturally, you need descriptive adjectives. Here are three powerful adjectives to describe successful people:

1. **Resilient** /rɪˈzɪliənt/
   * *Meaning:* Able to quickly recover from difficult conditions.
   * *Example:* Successful entrepreneurs must be resilient during financial downturns.

2. **Meticulous** /məˈtɪkjələs/
   * *Meaning:* Very careful and precise; showing great attention to detail.
   * *Example:* She kept meticulous records of all the class lessons.

3. **Proactive** /proʊˈæktɪv/
   * *Meaning:* Creating or controlling a situation rather than just responding to it.
   * *Example:* A proactive student prepares for the class before it starts.`,
    contentAr: `### توسيع حصيلتك اللغوية
لتتحدث الإنجليزية بشكل طبيعي، تحتاج إلى صفات وصفية قوية. إليك ثلاث صفات ممتازة لوصف الأشخاص الناجحين:

1. **Resilient (مرن / مقاوم)**
   * *المعنى:* القدرة على التعافي بسرعة من الظروف الصعبة والصدمات.
   * *مثال:* يجب أن يكون رواد الأعمال مرنين أثناء الأزمات المالية.

2. **Meticulous (دقيق للغاية / شديد العناية)**
   * *المعنى:* حذر ودقيق جداً؛ يولي اهتماماً كبيراً لأدق التفاصيل.
   * *مثال:* احتفظت بسجلات دقيقة للغاية لجميع الدروس الدراسية.

3. **Proactive (مبادر / استباقي)**
   * *المعنى:* خلق أو التحكم في الموقف بدلاً من مجرد الاستجابة له بعد حدوثه.
   * *مثال:* الطالب المبادر يستعد للدرس قبل أن يبدأ.`,
    quiz: [
      {
        question: "Which word describes someone who recovers quickly from difficulties?",
        options: [
          "Meticulous",
          "Resilient",
          "Proactive",
          "Lazy"
        ],
        correctAnswer: 1
      },
      {
        question: "He is so ____ that he double-checks every comma in his writings.",
        options: [
          "resilient",
          "proactive",
          "meticulous",
          "bored"
        ],
        correctAnswer: 2
      }
    ],
    createdAt: "2026-06-24T00:00:00Z"
  },
  {
    id: "reading-1",
    title: "The Power of Lifelong Learning",
    titleAr: "قوة التعلم مدى الحياة",
    category: "reading",
    level: "C1",
    content: `### Reading Comprehension
Read the short excerpt below and answer the quiz questions:

*“Education is not the filling of a pail, but the lighting of a fire.”* These words by W.B. Yeats capture the true essence of lifelong learning. In today's hyper-connected, fast-paced global economy, the acquisition of knowledge cannot terminate at graduation. Instead, intellectual curiosity must be nurtured as an ongoing endeavor. Those who cultivate a habit of continuous learning are not only more adaptable to career shifts but also report higher levels of life satisfaction and cognitive vitality in their later years.

**Key Reading Strategies:**
* Focus on the core argument.
* Highlight unfamiliar words (like *nurtured*, *vitality*, *acquisition*) to look up in your vocabulary section.`,
    contentAr: `### فهم المقروء (Reading Comprehension)
اقرأ المقتطف القصير التالي وأجب عن أسئلة الاختبار:

*“التعليم ليس ملء دلو، بل هو إيقاد شعلة.”* هذه الكلمات للشاعر دبليو بي ييتس تجسد الجوهر الحقيقي للتعلم مدى الحياة. في الاقتصاد العالمي اليوم، شديد الترابط والسريع، لا يمكن أن ينتهي اكتساب المعرفة عند التخرج. بدلاً من ذلك، يجب رعاية الفضول الفكري كمسعى مستمر. أولئك الذين ينمّون عادة التعلم المستمر ليسوا فقط أكثر قدرة على التكيف مع التحولات المهنية، بل يسجلون أيضاً مستويات أعلى من الرضا عن الحياة والحيوية المعرفية في سنواتهم المتقدمة.

**استراتيجيات القراءة الرئيسية:**
* ركز على الحجة أو الفكرة الأساسية.
* حدد الكلمات غير المألوفة (مثل *nurtured*، *vitality*، *acquisition*) للبحث عنها وحفظها في قسم المفردات.`,
    quiz: [
      {
        question: "According to the passage, why is lifelong learning essential today?",
        options: [
          "Because universities are closing down.",
          "Because the modern global economy is extremely fast-paced and requires ongoing adaptability.",
          "Because graduation is no longer celebrated.",
          "Because it is required by law."
        ],
        correctAnswer: 1
      },
      {
        question: "What does Yeats mean by 'lighting of a fire'?",
        options: [
          "Burning books.",
          "Warming up the classroom.",
          "Igniting passion and curiosity for learning.",
          "Starting an actual campfire."
        ],
        correctAnswer: 2
      }
    ],
    createdAt: "2026-06-24T00:00:00Z"
  }
];

export const defaultVocabulary: Vocabulary[] = [
  {
    id: "vocab-1",
    word: "Acquire",
    translation: "يكتسب / يحصل على",
    definition: "To buy or obtain an asset or object; to learn a skill.",
    definitionAr: "أن تشتري أو تحصل على أصل أو شيء؛ أو تتعلم وتكتسب مهارة.",
    example: "I want to acquire a high level of English speaking skills.",
    category: "academic",
    level: "B1",
    createdAt: "2026-06-24T00:00:00Z"
  },
  {
    id: "vocab-2",
    word: "Break a leg",
    translation: "أتمنى لك التوفيق (حظاً سعيداً)",
    definition: "An idiom used to wish someone good luck, especially before a performance.",
    definitionAr: "تعبير اصطلاحي يستخدم لتمني الحظ السعيد لشخص ما، خاصة قبل عرض أو اختبار.",
    example: "You have your English exam tomorrow? Break a leg!",
    category: "common",
    level: "A2",
    createdAt: "2026-06-24T00:00:00Z"
  },
  {
    id: "vocab-3",
    word: "Carry on",
    translation: "يستمر / يواصل",
    definition: "To continue doing something.",
    definitionAr: "الاستمرار في فعل شيء ما ومواصلته.",
    example: "Carry on practicing English every day, and you will become fluent.",
    category: "phrasal",
    level: "A1",
    createdAt: "2026-06-24T00:00:00Z"
  },
  {
    id: "vocab-4",
    word: "Breathtaking",
    translation: "يخطف الأنفاس / رائع جداً",
    definition: "Astonishing or awe-inspiring in quality, beauty, or grandeur.",
    definitionAr: "مذهل أو يثير الإعجاب الشديد بجودته أو جماله أو عظمته.",
    example: "The view from the top of the mountain was breathtaking.",
    category: "daily",
    level: "B2",
    createdAt: "2026-06-24T00:00:00Z"
  }
];

export const defaultLiveSessions: LiveSession[] = [
  {
    id: "live-1",
    title: "Weekly Grammar Clinic: Mastery over Tenses",
    description: "Interactive session where we break down complex tenses with Q&A and exercises.",
    date: "2026-06-26",
    time: "18:00 UTC",
    link: "https://meet.google.com/abc-defg-hij",
    status: "upcoming",
    teacherName: "Professor Thomas",
    createdAt: "2026-06-24T00:00:00Z"
  },
  {
    id: "live-2",
    title: "Speaking & Pronunciation Workshop",
    description: "Practice reduction, word connection, and phonetic symbols in real-time.",
    date: "2026-06-28",
    time: "20:00 UTC",
    link: "https://meet.google.com/xyz-pqrs-uvw",
    status: "upcoming",
    teacherName: "Professor Sarah",
    createdAt: "2026-06-24T00:00:00Z"
  }
];
