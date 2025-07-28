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
      messages, // messages doit être [{ role, content }]
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[Chat Error]', err.message);
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // erreur non typée
    console.error('[Chat Error]', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
