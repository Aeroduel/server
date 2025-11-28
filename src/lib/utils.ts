import { randomBytes } from "crypto";
import { networkInterfaces } from "os";

// Generate unique match ID
export function generateMatchId(): string {
  return randomBytes(16).toString("hex");
}

// Generate an authentication token for an individual plane/ESP32
export function generateAuthToken(): string {
  return randomBytes(32).toString("hex");
}

// Get local IP address
export function getLocalIpAddress(): string | null {
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    const netInfo = nets[name];
    if (!netInfo)
      continue; // skip

    for (const net of netInfo) {
      // Skip internal (loopback) and non-IPv4 addresses
      const isIPv4 = net.family === "IPv4";
      const isInternal = net.internal;

      if (isIPv4 && !isInternal) {
        return net.address;
      }
    }
  }

  return null;
}
