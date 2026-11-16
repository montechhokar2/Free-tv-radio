export interface DeviceRuntimeProfile {
  deviceMemoryGb: number | null;
  cpuCores: number | null;
  saveData: boolean;
  isLowMemory: boolean;
  shouldReduceAnimations: boolean;
  recommendedPageSize: number;
  hlsMaxBufferLength: number;
  hlsMaxMaxBufferLength: number;
  hlsMaxBufferSize: number;
}

interface NavigatorWithDeviceInfo extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
}

let cachedProfile: DeviceRuntimeProfile | null = null;

export function getDeviceRuntimeProfile(): DeviceRuntimeProfile {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceMemoryGb: null,
      cpuCores: null,
      saveData: false,
      isLowMemory: false,
      shouldReduceAnimations: false,
      recommendedPageSize: 36,
      hlsMaxBufferLength: 30,
      hlsMaxMaxBufferLength: 60,
      hlsMaxBufferSize: 60 * 1000 * 1000,
    };
  }

  if (cachedProfile) return cachedProfile;

  const nav = navigator as NavigatorWithDeviceInfo;
  const deviceMemoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const cpuCores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null;
  const saveData = Boolean(nav.connection?.saveData);
  const prefersReducedMotion = Boolean(
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  );

  const isLowMemory = Boolean(
    saveData ||
      (deviceMemoryGb !== null && deviceMemoryGb <= 3) ||
      (cpuCores !== null && cpuCores <= 4 && deviceMemoryGb !== null && deviceMemoryGb <= 4)
  );

  const shouldReduceAnimations =
    prefersReducedMotion || (deviceMemoryGb !== null && deviceMemoryGb <= 2);

  cachedProfile = {
    deviceMemoryGb,
    cpuCores,
    saveData,
    isLowMemory,
    shouldReduceAnimations,
    recommendedPageSize: isLowMemory ? 24 : 36,
    hlsMaxBufferLength: isLowMemory ? 18 : 30,
    hlsMaxMaxBufferLength: isLowMemory ? 32 : 60,
    hlsMaxBufferSize: isLowMemory ? 28 * 1000 * 1000 : 60 * 1000 * 1000,
  };

  return cachedProfile;
}
