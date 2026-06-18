import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY");
const MSG91_TEMPLATE_ID = Deno.env.get("MSG91_TEMPLATE_ID");
const MSG91_SENDER_ID = Deno.env.get("MSG91_SENDER_ID") || "VLMKTG"; // Approved 6-char Sender ID
const SEND_SMS_HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET");

serve(async (req) => {
  // 1. Signature Verification
  if (SEND_SMS_HOOK_SECRET) {
    const signature = req.headers.get("webhook-signature");
    const timestamp = req.headers.get("webhook-timestamp");
    if (!signature || !timestamp) {
      return new Response(JSON.stringify({ error: "Missing webhook signature headers" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const wh = new Webhook(SEND_SMS_HOOK_SECRET);
    const bodyText = await req.clone().text();

    try {
      wh.verify(bodyText, {
        "webhook-signature": signature,
        "webhook-timestamp": timestamp,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 2. Parse payload
  try {
    const payload = await req.json();
    const { user, sms } = payload;
    
    if (!user || !user.phone || !sms || !sms.otp) {
      return new Response(JSON.stringify({ error: "Invalid payload structure" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Msg91 expects digits only (e.g. 919496485772) without the leading '+' sign
    const rawPhone = user.phone;
    const cleanPhone = rawPhone.replace(/\+/g, "");

    // TESTING BYPASS: Allow +919999999999 (or 919999999999) to bypass external gateway delivery
    if (cleanPhone === "919999999999") {
      console.log(`[TESTING BYPASS] OTP generated for test number ${rawPhone} is: ${sms.otp}`);
      return new Response(JSON.stringify({ success: true, message: "OTP bypassed for test account" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
      return new Response(JSON.stringify({ error: "Server configuration missing: MSG91 environment variables not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Construct Msg91 Flows API Payload
    const msg91Payload = {
      template_id: MSG91_TEMPLATE_ID,
      sender: MSG91_SENDER_ID,
      short_url: "0",
      mobiles: cleanPhone,
      otp: sms.otp // Maps to the {{otp}} variable in DLT template
    };

    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authkey": MSG91_AUTH_KEY,
        "accept": "application/json"
      },
      body: JSON.stringify(msg91Payload)
    });

    const responseData = await response.json();

    if (!response.ok || responseData.type === "error") {
      console.error("Msg91 API error response:", responseData);
      return new Response(JSON.stringify({ error: "Msg91 provider failed to deliver SMS", details: responseData }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Hook execution error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
