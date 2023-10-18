import { useEffect, useState } from "react";
import { executeSerial } from "../../../electron/core/plugin-manager/execution/extension-manager";
import { SystemMonitoringService } from "@janhq/core";

export default function useGetSystemResources() {
  const [ram, setRam] = useState<number>(0);
  const [cpu, setCPU] = useState<number>(0);

  const getSystemResources = async () => {
    const resourceInfor = await executeSerial(
      SystemMonitoringService.GetResourcesInfo
    );
    const currentLoadInfor = await executeSerial(
      SystemMonitoringService.GetCurrentLoad
    );
    const ram =
      (resourceInfor?.mem?.active ?? 0) / (resourceInfor?.mem?.total ?? 1);
    setRam(Math.round(ram * 100));
    setCPU(Math.round(currentLoadInfor?.currentLoad ?? 0));
  };

  useEffect(() => {
    getSystemResources();

    // Fetch interval - every 3s
    const intervalId = setInterval(() => {
      getSystemResources();
    }, 3000);

    // clean up
    return () => clearInterval(intervalId);
  }, []);

  return {
    ram,
    cpu,
  };
}