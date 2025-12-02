import { useState, useEffect } from "react";
import { getCurrentTime } from "../utils/date";

export const useCurrentTime = () => {
  const [time, setTime] = useState<string>(getCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return time;
};
