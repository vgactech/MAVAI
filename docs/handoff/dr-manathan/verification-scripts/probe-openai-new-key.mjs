import { writeFile } from 'node:fs/promises';

// Exactly one bounded text-generation test; credentials never enter output.
const key = process.env.OPENAI_API_KEY_2?.trim();
const proof = { provider: 'OpenAI', variable: 'OPENAI_API_KEY_2', checked_at: new Date().toISOString(), max_completion_tokens: 256, generation_attempts: 0 };
try {
  if (!key) throw new Error('absent');
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const listed = await fetch('https://api.openai.com/v1/models', { headers, redirect: 'error', signal: AbortSignal.timeout(20000) });
  proof.models_http_status = listed.status;
  if (listed.ok) {
    const catalog = await listed.json();
    const ids = new Set((catalog.data ?? []).map(x => x.id));
    proof.configured_model_available = ids.has('gpt-5.4');
    if (proof.configured_model_available) {
      proof.generation_attempts = 1;
      proof.model = 'gpt-5.4';
      const generated = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers, redirect: 'error', signal: AbortSignal.timeout(60000),
        body: JSON.stringify({ model: proof.model, messages: [{ role: 'user', content: 'Réponds uniquement OK.' }], max_completion_tokens: 256, reasoning_effort: 'low', store: false }),
      });
      proof.generation_http_status = generated.status;
      if (generated.ok) {
        const data = await generated.json();
        const content = data.choices?.[0]?.message?.content;
        proof.finish_reason = data.choices?.[0]?.finish_reason ?? null;
        proof.nonempty_answer = typeof content === 'string' && !!content.trim();
        proof.expected_answer = typeof content === 'string' && /^OK[.!]?$/i.test(content.trim());
        proof.usage = { prompt_tokens: data.usage?.prompt_tokens, completion_tokens: data.usage?.completion_tokens, total_tokens: data.usage?.total_tokens };
      }
    }
  }
} catch {
  proof.blocker = key ? 'network_or_processing_error_details_redacted' : 'secret_absent';
}
await writeFile('/workspace/work/openai-new-key-proof.json', JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof, null, 2));
