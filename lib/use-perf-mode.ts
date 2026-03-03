"use client";

import { useEffect, useState } from "react";

type ConnectionWithSaveData = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

export function usePerfMode() {
  const [lowMotion, setLowMotion] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: ConnectionWithSaveData }).connection;
    const compute = () => {
      const saveData = Boolean(connection?.saveData);
      const slowNetwork =
        connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";

      setLowMotion(saveData || slowNetwork);
    };

    compute();

    connection?.addEventListener?.("change", compute);
    return () => {
      connection?.removeEventListener?.("change", compute);
    };
  }, []);

  return {
    lowMotion,
  };
}
