import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { getUserFromRequest } from './auth.ts';
import { decryptSecret } from './whatsappCrypto.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let toNumber: string | null = null;
  try {
    const bodyJson = await req.json().catch(() => ({}));
    if (bodyJson?.to && typeof bodyJson.to === 'string') {
      const t = bodyJson.to.trim();
      if (t.length > 0) toNumber = t.startsWith('whatsapp:') ? t : `whatsapp:${t}`;
    }
  } catch {
    // no body or invalid JSON
  }
  if (!toNumber) {
    const envDefault = (Deno.env.get('WHATSAPP_TEST_DEFAULT_TO') ?? '').trim();
    if (envDefault.length > 0) {
      toNumber = envDefault.startsWith('whatsapp:') ? envDefault : `whatsapp:${envDefault}`;
    }
  }
  if (!toNumber) {
    return new Response(
      JSON.stringify({
        error:
          'No test recipient. Provide request body { "to": "whatsapp:+44..." } or set WHATSAPP_TEST_DEFAULT_TO.',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: connection, error: connError } = await supabase
    .from('whatsapp_connections')
    .select('id, twilio_account_sid, twilio_api_key_sid, twilio_api_key_secret_encrypted, whatsapp_from')
    .eq('user_id', user.id)
    .eq('status', 'connected')
    .limit(1)
    .maybeSingle();

  if (connError || !connection) {
    return new Response(
      JSON.stringify({ error: 'No connected WhatsApp. Connect in Profile first.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let secret: string;
  try {
    secret = await decryptSecret(connection.twilio_api_key_secret_encrypted);
  } catch (e) {
    console.error('whatsapp-test: decrypt failed', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const fromRaw = (connection.whatsapp_from ?? '').trim();
  const fromNumber = fromRaw.startsWith('whatsapp:') ? fromRaw : `whatsapp:${fromRaw}`;
  const messageBody = 'Mason App WhatsApp test. If you received this, your connection works.';

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${connection.twilio_account_sid}/Messages.json`;
  const twilioResponse = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${connection.twilio_api_key_sid}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: messageBody }).toString(),
  });

  if (!twilioResponse.ok) {
    const errText = await twilioResponse.text();
    return new Response(
      JSON.stringify({ error: errText || 'Twilio send failed' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const now = new Date().toISOString();
  await supabase
    .from('whatsapp_connections')
    .update({ last_validated_at: now, last_error: null, updated_at: now })
    .eq('id', connection.id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
