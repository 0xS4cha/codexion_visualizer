import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect("/?error=access_denied");
  }

  if (!code) {
    return res.status(400).json({ error: "Code not found" });
  }

  try {
    const tokenResponse = await fetch("https://api.intra.42.fr/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.FORTY_TWO_CLIENT_ID,
        client_secret: process.env.FORTY_TWO_CLIENT_SECRET,
        code,
        redirect_uri: process.env.FORTY_TWO_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error("Error token 42:", err);
      return res.redirect("/?error=token_exchange_failed");
    }

    const { access_token } = await tokenResponse.json();

    const userResponse = await fetch("https://api.intra.42.fr/v2/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      return res.redirect("/?error=user_fetch_failed");
    }

    const user = await userResponse.json();

    const userData = {
      id: user.id,
      login: user.login,
      email: user.email,
      displayName: user.displayname,
      image: user.image?.versions?.medium || user.image?.link,
      level: user.cursus_users?.[0]?.level,
      wallet: user.wallet,
      correctionPoints: user.correction_point,
    };

    const encoded = Buffer.from(JSON.stringify(userData)).toString("base64url");

    res.redirect(`/hub?user=${encoded}`);
  } catch (err) {
    console.error("Error OAuth:", err);
    res.redirect("/?error=server_error");
  }
}