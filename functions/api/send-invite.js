
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
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f9fc; padding: 40px 0; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); }
        .header { background: #3b82f6; padding: 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
        .button { display: inline-block; background-color: #3b82f6; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://ideabomb.pages.dev/logo.svg" alt="IdeaBomb" style="width: 50px; height: 50px; margin-bottom: 10px;">
            <h1 style="margin:0; font-size: 24px;">IdeaBomb</h1>
        </div>
        <div class="content">
            <h2 style="margin-top:0; color: #1e293b;">You've been invited!</h2>
            <p>Hi ${toEmail.split('@')[0]},</p>
            <p><strong>${inviterName}</strong> has invited you to collaborate on a whiteboard as a
                <strong>${role}</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" class="button">Open Whiteboard</a>
            </div>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p
                style="background:#f1f5f9; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px; font-family: monospace;">
                ${link}</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} IdeaBomb. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
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
