import { createFileRoute } from "@tanstack/react-router";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS_URL = "https://api.groq.com/openai/v1/models";

type Body = {
  apiKey?: string;
  model?: string;
  temperature?: number;
  messages?: unknown;
  tools?: unknown;
  mode?: "chat" | "test";
};

export const Route = createFileRoute("/api/groq")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
        if (!apiKey) {
          return Response.json(
            { error: "No Groq API key configured. Open Settings → AI Provider and paste your key." },
            { status: 401 },
          );
        }

        if (body.mode === "test") {
          const res = await fetch(MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
          if (!res.ok) {
            const text = await res.text();
            return Response.json({ ok: false, error: text.slice(0, 400) }, { status: res.status });
          }
          const data = (await res.json()) as { data?: { id: string }[] };
          return Response.json({ ok: true, models: (data.data ?? []).map((m) => m.id).sort() });
        }

        if (!Array.isArray(body.messages) || body.messages.length === 0) {
          return Response.json({ error: "messages[] is required" }, { status: 400 });
        }

        const payload: Record<string, unknown> = {
          model: typeof body.model === "string" && body.model ? body.model : "llama-3.3-70b-versatile",
          temperature: typeof body.temperature === "number" ? body.temperature : 0.2,
          messages: body.messages,
          stream: true,
        };
        if (Array.isArray(body.tools) && body.tools.length) {
          payload["tools"] = body.tools;
          payload["tool_choice"] = "auto";

        }

        const upstream = await fetch(GROQ_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text();
          let message = text.slice(0, 600);
          try {
            const parsed = JSON.parse(text) as { error?: { message?: string } };
            if (parsed.error?.message) message = parsed.error.message;
          } catch {
            /* keep raw text */
          }
          return Response.json({ error: message }, { status: upstream.status || 502 });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
