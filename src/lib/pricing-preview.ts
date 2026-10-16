// Presentation-only proposal: never use these values for billing or access control.
export const plans = [
  {
    name: ['الانطلاقة', 'Launch'], price: 19, years: 10,
    description: ['نظّم أعمال مركزك اليومية، دون ذكاء اصطناعي.', 'Organize everyday center operations, without AI.'],
    features: [
      ['إدارة الطلاب والمعلمين والحلقات', 'Students, teachers and Quran circles'],
      ['الحضور والغياب ومتابعة الحفظ والمراجعة', 'Attendance, memorization and revision tracking'],
      ['استمارة الطالب وطباعتها وتقارير أساسية', 'Printable student registration and basic reports'],
      ['تصدير البيانات والصلاحيات الأساسية', 'Data export and essential permissions'],
    ],
    limits: ['حدود مقترحة: 100 طالب نشط • مركز واحد • ملفات 2 GB', 'Proposed limits: 100 active students • One center • 2 GB files'],
  },
  {
    name: ['النمو', 'Growth'], price: 49, years: 8,
    description: ['ساعد المعلم والموظف ووفّر وقت الفريق.', 'Help teachers and staff save time.'],
    features: [
      ['جميع خدمات الانطلاقة', 'Everything in Launch'],
      ['النقاط والتحفيز والشهادات وتقارير تقدم تفصيلية', 'Points, recognition, certificates and detailed progress reports'],
      ['مساعد ذكي للمعلم: تلخيص التقدم واقتراح المراجعة', 'Teacher AI: progress summaries and revision suggestions'],
      ['مساعد للموظف: مسودات التقارير والمراسلات', 'Staff AI: report and correspondence drafts'],
      ['قوالب جاهزة وتدريب جماعي عند التهيئة', 'Templates and group onboarding'],
    ],
    limits: ['حدود مقترحة: 300 طالب نشط • مركز واحد • ملفات 5 GB', 'Proposed limits: 300 active students • One center • 5 GB files'],
  },
  {
    name: ['التمكين', 'Empower'], price: 99, years: 5,
    description: ['افهم أداء المركز ونظّم قرارات المتابعة.', 'Understand center performance and organize follow-up decisions.'],
    features: [
      ['جميع خدمات النمو', 'Everything in Growth'],
      ['تحليلات إدارية ومقارنة أداء الحلقات والفترات', 'Management analytics across circles and periods'],
      ['مساعد إداري يبرز الغياب والتراجع مع أسبابه المستندة للبيانات', 'Management AI highlighting absence and decline with supporting data'],
      ['اقتراح إجراءات ومتابعة الحالات بعد اعتماد الإدارة', 'Suggested actions and case follow-up with management approval'],
      ['مسودات تقارير دورية وسعة أعلى للمساعد وتهيئة خاصة', 'Periodic report drafts, higher AI allowance and individual onboarding'],
    ],
    limits: ['حدود مقترحة: 750 طالبًا نشطًا • مركز واحد • ملفات 15 GB', 'Proposed limits: 750 active students • One center • 15 GB files'],
  },
];
