import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://fincore-c6gugketdtd5fycz.eastasia-01.azurewebsites.net/api",
  },
};

export default nextConfig;
