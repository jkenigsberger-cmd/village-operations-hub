import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { group_name, client_name, client_org, client_phone, client_email, total_pax, staff_count, participant_count, boys_count, girls_count, group_type, special_diets, tent_distribution_notes, schedule_notes, general_notes } = body;

    if (!group_name || typeof group_name !== "string" || !group_name.trim()) {
      return new Response(JSON.stringify({ error: "group_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("guest_form_submissions")
      .insert({
        group_name: group_name.trim().slice(0, 200),
        status: "submitted",
        client_name: client_name?.slice(0, 200) || null,
        client_org: client_org?.slice(0, 200) || null,
        client_phone: client_phone?.slice(0, 50) || null,
        client_email: client_email?.slice(0, 255) || null,
        total_pax: total_pax ? Number(total_pax) : null,
        staff_count: staff_count ? Number(staff_count) : null,
        participant_count: participant_count ? Number(participant_count) : null,
        boys_count: boys_count ? Number(boys_count) : null,
        girls_count: girls_count ? Number(girls_count) : null,
        group_type: group_type?.slice(0, 100) || null,
        special_diets: special_diets || {},
        tent_distribution_notes: tent_distribution_notes?.slice(0, 2000) || null,
        schedule_notes: schedule_notes?.slice(0, 2000) || null,
        general_notes: general_notes?.slice(0, 2000) || null,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to save submission" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
