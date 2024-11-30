import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { Ai } from "@cloudflare/workers-types";
export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "AI" with the variable name you defined.
  AI: Ai;
}
type Bindings = {
  AI: Ai;
};
const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

//
app.get("/chat", async (c) => {
  // 获取路径请求参数
  const { msg = "你好" } = c.req.query();
  console.log(msg);
  const messages: RoleScopedChatInput[] = [
    {
      role: "user",
      content: msg,
    },
  ];

  const eventSourceStream = (await c.env.AI.run("@cf/google/gemma-7b-it-lora", {
    messages,
    stream: true,
  })) as ReadableStream;
  // EventSource stream is handy for local event sources, but we want to just stream text
  const tokenStream = eventSourceStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  return streamText(c, async (stream) => {
    for await (const msg of tokenStream) {
      if (msg.data !== "[DONE]") {
        const data = JSON.parse(msg.data);
        stream.write(data.response);
      }
    }
  });
});

export default app;
