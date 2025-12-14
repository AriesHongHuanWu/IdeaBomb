
/**
 * POST /api/invite
 * Sends an invitation email via MailChannels.
 */
export async function onRequestPost({ request }) {
    try {
        const { to, role, link, sender } = await request.json();

        if (!to || !link) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">You've been invited to collaborate!</h2>
                <p>Hello,</p>
                <p><strong>${sender}</strong> has invited you to join their whiteboard on IdeaBomb as a <strong>${role}</strong>.</p>
                <div style="margin: 30px 0;">
                    <a href="${link}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Open Whiteboard</a>
                </div>
                <p style="color: #666; font-size: 14px;">Or copy this link: <br/><a href="${link}">${link}</a></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Sent via IdeaBomb @ awbest.tech</p>
            </div>
        `;

        // MailChannels API Request
        const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [
                    {
                        to: [{ email: to, name: to.split("@")[0] }],
                    },
                ],
                from: {
                    email: "arieswu@awbest.tech", // MUST match your authorized domain
                    name: "IdeaBomb Invitation",
                },
                subject: `Invitation: Collaborate on Whiteboard (${role})`,
                content: [
                    {
                        type: "text/html",
                        value: emailContent,
                    },
                ],
            }),
        });

        if (response.status === 202) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            const text = await response.text();
            return new Response(JSON.stringify({ error: "Failed to send email", details: text }), { status: 500 });
        }

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
