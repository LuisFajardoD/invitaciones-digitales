export type PreviewDeviceId =
  | "iphone-pro-max"
  | "galaxy-ultra"
  | "android-comun"
  | "android-grande"
  | "android-pequeno"
  | "tablet";

export type PreviewDeviceProfile = {
  id: PreviewDeviceId;
  name: string;
  group: "ios" | "android" | "tablet";
  order: number;
  viewport: {
    width: number;
    height: number;
  };
  dpr: number;
  isMobile: boolean;
  hasTouch: boolean;
  userAgent: string;
};

export const previewDeviceProfiles: PreviewDeviceProfile[] = [
  {
    id: "iphone-pro-max",
    name: "iPhone Pro Max",
    group: "ios",
    order: 1,
    viewport: { width: 430, height: 932 },
    dpr: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  },
  {
    id: "galaxy-ultra",
    name: "Galaxy Ultra",
    group: "android",
    order: 2,
    viewport: { width: 412, height: 915 },
    dpr: 3.5,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
  },
  {
    id: "android-comun",
    name: "Android comun",
    group: "android",
    order: 3,
    viewport: { width: 360, height: 780 },
    dpr: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
  },
  {
    id: "android-grande",
    name: "Android grande",
    group: "android",
    order: 4,
    viewport: { width: 414, height: 896 },
    dpr: 2.75,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; 23127PN0CG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
  },
  {
    id: "android-pequeno",
    name: "Android pequeno",
    group: "android",
    order: 5,
    viewport: { width: 320, height: 694 },
    dpr: 2.5,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 12; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
  },
  {
    id: "tablet",
    name: "Tablet",
    group: "tablet",
    order: 6,
    viewport: { width: 820, height: 1180 },
    dpr: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  },
];

export function getPreviewDeviceProfile(deviceId: string) {
  return previewDeviceProfiles.find((device) => device.id === deviceId);
}

export function serializePreviewDeviceProfile(device: PreviewDeviceProfile) {
  return {
    id: device.id,
    name: device.name,
    group: device.group,
    order: device.order,
    viewport: {
      w: device.viewport.width,
      h: device.viewport.height,
    },
    dpr: device.dpr,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
    userAgent: device.userAgent,
  };
}
