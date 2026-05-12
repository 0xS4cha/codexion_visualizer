import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  const params = new URLSearchParams({
    client_id: (process.env.FORTY_TWO_CLIENT_ID || "") as string,
    redirect_uri: (process.env.FORTY_TWO_REDIRECT_URI || "") as string,
    response_type: "code",
    scope: "public",
  } as Record<string, string>);
  console.log("CLIENT_ID:", process.env.FORTY_TWO_CLIENT_ID);
  console.log("REDIRECT_URI:", process.env.FORTY_TWO_REDIRECT_URI);
  const authUrl = `https://api.intra.42.fr/oauth/authorize?${params}`;
  res.redirect(authUrl);
}
