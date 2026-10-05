import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // حزمة تشغيل مكتفية ذاتيًا (server.js) — تُسهّل النشر على الاستضافة المشتركة/Node.js.
  output: 'standalone',
};

export default nextConfig;
