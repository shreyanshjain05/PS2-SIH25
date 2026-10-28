import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typedRoutes:true,

  // Precomputed forecasts are read with fs at runtime, so they must be traced
  // into the API function explicitly
  outputFileTracingIncludes: {
    "/api/**": ["./data/forecasts/**/*"],
  },

  experimental:{
    typedEnv:true,
  }

};

export default nextConfig;
