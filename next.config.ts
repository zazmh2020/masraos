import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // حزمة تشغيل مكتفية ذاتيًا (server.js) — تُسهّل النشر على الاستضافة المشتركة/Node.js.
  output: 'standalone',

  // صفحات تسويقية قديمة دُمجت في الموقع الموحّد (مؤقتة 307 حتى يُعتمد هيكل الروابط نهائيًا).
  async redirects() {
    return [
      { source: '/systems', destination: '/features', permanent: false },
      { source: '/audiences', destination: '/#platform', permanent: false },
      { source: '/about-masra', destination: '/about', permanent: false },
    ];
  },
};

export default nextConfig;
