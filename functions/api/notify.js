// FCM V1 API Implementation with Web Crypto
// Requires: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

function pemToArrayBuffer(pem) {
    const b64Lines = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    const str = atob(b64Lines);
    const buf = new ArrayBuffer(str.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return buf;
}

function arrayBufferToBase64Url(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(env) {
    const projectId = env.FIREBASE_PROJECT_ID;
    const clientEmail = env.FIREBASE_CLIENT_EMAIL;
    const privateKeyPem = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'); // Handle escaped newlines

    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
        iss: clientEmail,
        sub: clientEmail,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/firebase.messaging'
    };

    const encodedHeader = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
    const encodedClaim = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(claim)));

    const keyData = pemToArrayBuffer(privateKeyPem);
    const importAlgo = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
    const privateKey = await crypto.subtle.importKey('pkcs8', keyData, importAlgo, false, ['sign']);

    const signature = await crypto.subtle.sign(importAlgo, privateKey, new TextEncoder().encode(`${encodedHeader}.${encodedClaim}`));
    const encodedSignature = arrayBufferToBase64Url(signature);
    const jwt = `${encodedHeader}.${encodedClaim}.${encodedSignature}`;

    // Exchange JWT for Access Token
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) throw new Error("Failed to get access token: " + JSON.stringify(tokenData));
    return tokenData.access_token;
}

export async function onRequestPost({ request, env }) {
    try {
        const { tokens, title, body, link } = await request.json();

        if (!env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
            return new Response(JSON.stringify({ error: "Missing Firebase Credentials" }), { status: 500 });
        }

        const accessToken = await getAccessToken(env);

        // V1 API Batch Send (Max 500 technically, but loop here for safety)
        const results = await Promise.all(tokens.map(async (token) => {
            const resp = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        token: token,
                        notification: {
                            title: title,
                            body: body
                        },
                        data: {
                            url: link || '/'
                        },
                        webpush: {
                            fcm_options: {
                                link: link || '/'
                            },
                            notification: {
                                icon: '/pwa-192x192.png'
                            }
                        }
                    }
                })
            });
            return resp.status;
        }));

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500 });
    }
}
