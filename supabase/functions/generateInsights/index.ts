// supabase/functions/generateInsights/index.ts
//
// Builds a fleet insights summary by aggregating live data straight
// from Postgres — no external AI call, so no extra API key needed
// and no risk of an LLM inventing numbers. If you later want an
// AI-written narrative on top of these real figures, pass this
// function's output into a Claude API call from the frontend and
// ask it to narrate them (never let the AI compute the numbers itself).
//
// Deploy:  supabase functions deploy generateInsights
// Call from the app:
//   base44.functions.invoke('generateInsights', {})
//
// Returns:
//   {
//     data: {
//       loads_this_month, cross_border_loads_pending_clearance,
//       maintenance_due_30_days, compliance_docs_expiring_30_days,
//       overdue_invoices_count, overdue_invoices_total,
//       fuel_spend_this_month
//     }
//   }

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Runs with the caller's own permissions, so RLS still applies —
    // a driver hitting this function only sees what they're allowed to.
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const [loadsThisMonth, pendingClearance, maintenanceDue, expiringDocs, overdueInvoices, fuelThisMonth] =
      await Promise.all([
        supabase.from('load').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        supabase
          .from('load')
          .select('id', { count: 'exact', head: true })
          .eq('cross_border', true)
          .in('customs_status', ['pending', 'submitted', 'in_process', 'held']),
        supabase
          .from('maintenance_schedule')
          .select('id', { count: 'exact', head: true })
          .lte('next_service_date', in30Days),
        supabase
          .from('compliance_document')
          .select('id', { count: 'exact', head: true })
          .lte('expiry_date', in30Days),
        supabase.from('invoice').select('id, total_amount').eq('status', 'overdue'),
        supabase.from('fuel_log').select('amount').gte('log_date', startOfMonth),
      ]);

    const overdueInvoicesTotal = (overdueInvoices.data ?? []).reduce(
      (sum, inv) => sum + (Number(inv.total_amount) || 0),
      0
    );
    const fuelSpendThisMonth = (fuelThisMonth.data ?? []).reduce(
      (sum, log) => sum + (Number(log.amount) || 0),
      0
    );

    const insights = {
      loads_this_month: loadsThisMonth.count ?? 0,
      cross_border_loads_pending_clearance: pendingClearance.count ?? 0,
      maintenance_due_30_days: maintenanceDue.count ?? 0,
      compliance_docs_expiring_30_days: expiringDocs.count ?? 0,
      overdue_invoices_count: overdueInvoices.data?.length ?? 0,
      overdue_invoices_total: overdueInvoicesTotal,
      fuel_spend_this_month: fuelSpendThisMonth,
      generated_at: now.toISOString(),
    };

    return new Response(JSON.stringify({ data: insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
