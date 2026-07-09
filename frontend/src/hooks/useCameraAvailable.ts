import { useEffect, useState } from 'react';

/** Indica si hay cámara: null = comprobando, true/false = resultado. */
export function useCameraAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setAvailable(false);
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => setAvailable(devices.some((d) => d.kind === 'videoinput')))
      .catch(() => setAvailable(false));
  }, []);

  return available;
}
