import type { NextConfig } from "next";
import { apiHeaders, securityHeaders } from "./src/lib/security-headers";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  // حزمة تشغيل مكتفية ذاتيًا (server.js) — تُسهّل النشر على الاستضافة المشتركة/Node.js.
  output: 'standalone',
  // لا تكشف إصدار الإطار في ترويسة X-Powered-By.
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders(isDev) },
      { source: '/api/:path*', headers: apiHeaders },
    ];
  },
};

export default nextConfig;
