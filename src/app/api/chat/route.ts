import { Groq } from 'groq-sdk';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
  });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages, // ici, chaque message doit avoir `role` + `parts`
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('[Chat Error]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Something went wrong.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
