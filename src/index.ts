import { Hono } from "hono";
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

app.get("/test", async (c) => {
  console.log(c);
  const response = await c.env.AI.run("@cf/google/gemma-7b-it-lora", {
    prompt: "What is the origin of the phrase Hello, World",
  });

  return c.json(response);
});

export default app;
