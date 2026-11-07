import { getApiUser } from "@/lib/session";
import { getLiveFingerprint } from "@/lib/server-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events stream. The client re-fetches its state whenever the
 * fingerprint changes, so new messages, matches and likes arrive without a
 * refresh. One small query per connected member every few seconds — enough for
 * a self-hosted community, and it works across multiple app instances because
 * the database is the source of truth.
 */
export async function GET(request: Request) {
  const current = await getApiUser();
  if (!current) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let closed = false;
  let poll: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let fingerprint = "";
      try {
        fingerprint = await getLiveFingerprint(current.id);
      } catch {
        fingerprint = "";
      }
      send("ready", { fingerprint });

      poll = setInterval(async () => {
        if (closed) return;
        try {
          const next = await getLiveFingerprint(current.id);
          if (next !== fingerprint) {
            fingerprint = next;
            send("update", { fingerprint });
          } else {
            send("ping", { t: Date.now() });
          }
        } catch {
          // A transient database error is not fatal; the next tick retries.
        }
      }, 4000);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(poll);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", close);
    },
    cancel() {
      closed = true;
      if (poll) clearInterval(poll);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
