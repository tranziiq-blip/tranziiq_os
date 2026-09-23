// supabase/functions/sendReportEmail/index.ts
//
// Sends a generated report (e.g. from ReportConfiguration/ReportSnapshot)
// to one or more recipients by email, using Resend (resend.com — free
// tier covers 3,000 emails/month, simplest option to wire up).
//
// Setup:
//   1. Create a free Resend account, verify a sending domain (or use
//      their onboarding@resend.dev address for testing).
//   2. supabase secrets set RESEND_API_KEY=re_xxxxxxxx
//   3. supabase functions deploy sendReportEmail
//
// Call from the app:
//   base44.functions.invoke('sendReportEmail', {
//     recipients: ['ops@tranziq.co.za'],
//     subject: 'Weekly Fleet Report',
//     html: '<h1>...</h1>',
//   })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipients, subject, html, from } = await req.json();

    if (!recipients?.length || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'recipients, subject and html are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY is not configured on the server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'TranziIQ Reports <onboarding@resend.dev>',
        to: recipients,
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
