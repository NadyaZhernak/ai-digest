import fs from 'fs';
import path from 'path';

const MODEL = 'ideogram-ai/ideogram-v3-turbo';

export async function generateCoverImage(prompt: string, slug: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN is not set');

  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: { prompt, aspect_ratio: '16:9' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Replicate API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    status?: string;
    output?: string | string[];
    error?: string | null;
  };

  if (data.status !== 'succeeded') {
    throw new Error(`Replicate prediction ${data.status ?? 'unknown'}: ${data.error ?? ''}`);
  }

  const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
  if (!imageUrl) throw new Error('Replicate returned no image URL');

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to download image: ${imageRes.status}`);
  const buffer = Buffer.from(await imageRes.arrayBuffer());

  const dest = path.join(process.cwd(), 'src/assets', `${slug}.png`);
  fs.writeFileSync(dest, buffer);

  return `src/assets/${slug}.png`;
}
