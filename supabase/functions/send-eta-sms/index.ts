// Sends the "your technician is on the way" text via Twilio. Runs here
// (not in the browser) because it's the only place a Twilio auth token can
// live safely -- nothing in this app has a server that could hold it
// otherwise (see the Phase D plan). Requires TWILIO_ACCOUNT_SID,
// TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to be set as function secrets
// (`supabase secrets set ...`); until they are, this responds 501 instead
// of failing ugly.
//
// Deliberately uses the *caller's* JWT (forwarded via the Authorization
// header) to talk to Postgres, not a service-role key -- every read/write
// here goes through the same RLS policies the rest of the app already
// relies on (is_office_staff() for reading the job/customer/tech, same
// policy for writing en_route_at back), so this function can't do
// anything the caller couldn't already do directly.
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DISPATCH_ROLES = ["owner", "gm", "office_manager", "dispatcher"]

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const { job_id } = await req.json()
        if (!job_id) return json({ ok: false, message: "job_id is required" }, 400)

        const authHeader = req.headers.get("Authorization")
        if (!authHeader) return json({ ok: false, message: "Missing authorization" }, 401)

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } },
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return json({ ok: false, message: "Not authenticated" }, 401)

        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single()
        if (!profile || !DISPATCH_ROLES.includes(profile.role)) {
            return json({ ok: false, message: "Not authorized to send dispatch notifications" }, 403)
        }

        const { data: job, error: jobError } = await supabase
            .from("jobs")
            .select(`
                id, scheduled_end, en_route_at,
                customers ( first_name, phone ),
                job_assignments ( is_lead, user_profiles ( full_name ) )
            `)
            .eq("id", job_id)
            .single()
        if (jobError || !job) return json({ ok: false, message: "Job not found" }, 404)
        if (job.en_route_at) return json({ ok: false, message: "Customer was already notified for this job" }, 409)

        const customerPhone: string | null = job.customers?.phone ?? null
        if (!customerPhone) return json({ ok: false, message: "This customer has no phone number on file" }, 400)

        const assignments = (job.job_assignments ?? []) as { is_lead: boolean; user_profiles: { full_name: string } | null }[]
        const lead = assignments.find((a) => a.is_lead) ?? assignments[0]
        const techName = lead?.user_profiles?.full_name ?? "Your technician"

        const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
        const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
        const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER")
        if (!accountSid || !authToken || !fromNumber) {
            return json({
                ok: false,
                message: "Twilio isn't configured yet -- set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER as function secrets.",
            }, 501)
        }

        const eta = job.scheduled_end
            ? new Date(job.scheduled_end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : null
        const greeting = job.customers?.first_name ? `Hi ${job.customers.first_name}, ` : "Hi, "
        const body = eta
            ? `${greeting}${techName} is on the way and should arrive by around ${eta}.`
            : `${greeting}${techName} is on the way to your appointment.`

        const toNumber = `+1${customerPhone.replace(/\D/g, "")}`

        const twilioResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ To: toNumber, From: fromNumber, Body: body }).toString(),
            },
        )

        if (!twilioResponse.ok) {
            console.error("Twilio send failed:", twilioResponse.status, await twilioResponse.text())
            return json({ ok: false, message: "Twilio couldn't send the text -- check the function logs." }, 502)
        }

        const { error: updateError } = await supabase
            .from("jobs")
            .update({ en_route_at: new Date().toISOString() })
            .eq("id", job_id)
        if (updateError) console.error("Sent the text but failed to record en_route_at:", updateError)

        return json({ ok: true, message: `Texted ${job.customers?.first_name ?? "the customer"} at ${toNumber}.` }, 200)
    } catch (err) {
        console.error("send-eta-sms error:", err)
        return json({ ok: false, message: "Unexpected error sending the notification." }, 500)
    }
})
