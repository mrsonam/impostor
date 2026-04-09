import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

/**
 * Broadcast without failing the HTTP handler if Pusher is down or misconfigured.
 * A missing response to the client often surfaces as "TypeError: Failed to fetch".
 */
export async function triggerPusherSafe(
  channel: string,
  event: string,
  data: object
): Promise<void> {
  try {
    await pusherServer.trigger(channel, event, data);
  } catch (err) {
    console.error(`[pusher] ${channel} ${event} failed:`, err);
  }
}
