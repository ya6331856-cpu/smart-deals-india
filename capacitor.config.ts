import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.smartdealsindia.app",
  appName: "Smart Deals India",
  webDir: "www",
  server: {
    // Testing build loads the existing live Next.js app.
    // Switch to a production domain before Play Store release.
    url: "https://smart-deals-india-837wx6so6-llebhosdike-6781s-projects.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
