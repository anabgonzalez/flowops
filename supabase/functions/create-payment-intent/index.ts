// Creates a Stripe PaymentIntent for an invoice's remaining balance.
// Requires STRIPE_SECRET_KEY as a function secret; responds 501 instead
// of failing ugly until it's set (same pattern as send-eta-sms).
//
// invoices/payments are deliberately "no tech" at the RLS layer (see
// row_level_security.sql) -- but a tech does need to collect payment for
// their own job on-site. Rather than loosen that RLS, this function uses
// the service-role key for its own authoritative reads (the invoice
// amount charged to a card must come from the server's record, never
// from the client -- that's true even setting RLS aside) while still
// independently verifying the caller is actually assigned to the job
// before it will do anything.
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const ALLOWED_ROLES = ["owner", "gm", "service_technician", "comfort_advisor", "install_crew_lead", "install_helper"]

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

    try {
        const { invoice_id } = await req.json()
        if (!invoice_id) return json({ error: "invoice_id is required" }, 400)

        const authHeader = req.headers.get("Authorization")
        if (!authHeader) return json({ error: "Missing authorization" }, 401)

        const callerClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } },
        )
        const { data: { user } } = await callerClient.auth.getUser()
        if (!user) return json({ error: "Not authenticated" }, 401)

        const adminClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        )

        const { data: profile } = await adminClient.from("user_profiles").select("role").eq("id", user.id).single()
        if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
            return json({ error: "Not authorized to collect payment" }, 403)
        }

        const { data: invoice, error: invoiceError } = await adminClient
            .from("invoices")
            .select("id, job_id, total_amount, amount_paid")
            .eq("id", invoice_id)
            .single()
        if (invoiceError || !invoice) return json({ error: "Invoice not found" }, 404)

        const isManagerRole = profile.role === "owner" || profile.role === "gm"
        if (!isManagerRole) {
            const { data: assignment } = await adminClient
                .from("job_assignments")
                .select("job_id")
                .eq("job_id", invoice.job_id)
                .eq("technician_id", user.id)
                .maybeSingle()
            if (!assignment) return json({ error: "Not assigned to this job" }, 403)
        }

        const remaining = Number(invoice.total_amount) - Number(invoice.amount_paid)
        if (remaining <= 0) return json({ error: "Invoice is already paid" }, 409)

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")
        if (!stripeSecretKey) {
            return json({ error: "Stripe isn't configured yet -- set STRIPE_SECRET_KEY as a function secret." }, 501)
        }

        const amountCents = Math.round(remaining * 100)
        const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${stripeSecretKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                amount: String(amountCents),
                currency: "usd",
                "metadata[invoice_id]": invoice.id,
                "metadata[job_id]": invoice.job_id,
                "automatic_payment_methods[enabled]": "true",
            }).toString(),
        })

        if (!stripeResponse.ok) {
            console.error("Stripe payment intent creation failed:", stripeResponse.status, await stripeResponse.text())
            return json({ error: "Stripe couldn't create the payment -- check the function logs." }, 502)
        }

        const paymentIntent = await stripeResponse.json()
        return json({ client_secret: paymentIntent.client_secret, amount: remaining }, 200)
    } catch (err) {
        console.error("create-payment-intent error:", err)
        return json({ error: "Unexpected error creating the payment." }, 500)
    }
})
