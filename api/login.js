export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.FORTY_TWO_CLIENT_ID,
    redirect_uri: process.env.FORTY_TWO_REDIRECT_URI,
    response_type: "code",
    scope: "public",
  });
  console.log("CLIENT_ID:", process.env.FORTY_TWO_CLIENT_ID);
  console.log("REDIRECT_URI:", process.env.FORTY_TWO_REDIRECT_URI);
  const authUrl = `https://api.intra.42.fr/oauth/authorize?${params}`;
  res.redirect(authUrl);
}
