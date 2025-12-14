
/**
 * Cloudflare Pages Function to send emails via MailChannels.
 * This API is called by the ShareModal component.
 */
export async function onRequestPost({ request }) {
    try {
        const { toEmail, role, link, inviterName } = await request.json();

        if (!toEmail || !link) {
            return new Response("Missing required fields", { status: 400 });
        }

        const subject = `Invited to collaborate: ${inviterName} shared a whiteboard`;

        // MailChannels API Endpoint
        const send_request = new Request("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [
                    {
                        to: [{ email: toEmail, name: toEmail.split("@")[0] }],
                    },
                ],
                from: {
                    email: "no-reply@awbest.tech", // Authenticated domain sender
                    name: "IdeaBomb Connection",
                },
                subject: subject,
                content: [
                    {
                        type: "text/plain",
                        value: `You have been invited to collaborate on an IdeaBomb whiteboard.\n\nRole: ${role}\nInvited by: ${inviterName}\n\nClick here to join: ${link}`,
                    },
                    {
                        type: "text/html",
                        value: `
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
            `,
                    },
                ],
            }),
        });

        const resp = await fetch(send_request);

        if (resp.status >= 200 && resp.status < 300) {
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } else {
            const text = await resp.text();
            return new Response(JSON.stringify({ success: false, error: text }), {
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
