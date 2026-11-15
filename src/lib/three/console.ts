import { setConsoleFunction } from "three";

// R3F 9 still builds its frame clock with THREE.Clock, deprecated since r183; drop only that notice.
const IGNORED = ["THREE.Clock: This module has been deprecated."];

type Level = "log" | "warn" | "error";

setConsoleFunction((type: Level, message: string, ...params: unknown[]) => {
  if (IGNORED.some((prefix) => message.startsWith(prefix))) return;
  console[type](message, ...params);
});
