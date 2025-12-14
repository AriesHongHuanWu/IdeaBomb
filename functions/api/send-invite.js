
/**
 * Cloudflare Pages Function to send emails via Resend.
 * replaces the previous MailChannels implementation.
 */
export async function onRequestPost({ request, env }) {
    try {
        const { toEmail, role, link, inviterName } = await request.json();

        if (!toEmail || !link) {
            return new Response("Missing required fields", { status: 400 });
        }

        // Use Environment Variable 'RESEND_API_KEY' set in Cloudflare Dashboard
        const API_KEY = env.RESEND_API_KEY;

        if (!API_KEY) {
            return new Response("Missing API Key", { status: 500 });
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                from: 'IdeaBomb <noreply@awbest.tech>',
                to: [toEmail],
                subject: `Invited to collaborate: ${inviterName} shared a whiteboard`,
                html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #333;">You've been invited! 🚀</h2>
              <p style="color: #555; font-size: 16px;">
                <strong>${inviterName}</strong> has invited you to collaborate on a whiteboard as a <strong>${role}</strong>.
              </p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                  Open Whiteboard
                </a>
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                Powered by IdeaBomb • ${new Date().getFullYear()}
              </p>
            </div>
        `
            })
        });

        const data = await res.json();

        if (res.ok) {
            return new Response(JSON.stringify({ success: true, id: data.id }), {
                headers: { "Content-Type": "application/json" },
            });
        } else {
            return new Response(JSON.stringify({ success: false, error: data }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
