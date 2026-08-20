import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from './_utils/firebaseAdmin.js';


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const adminDb = getAdminDb();
    const country =
      req.headers["x-vercel-ip-country"]?.toString() ??
      process.env.DEV_COUNTRY ??
      "unknown";

    const countryRef = adminDb.collection("countries").doc(country);

    await countryRef.set(
      {
        count: FieldValue.increment(1),
      },
      {
        merge: true,
      }
    );

    return res.status(200).json({
      country,
      success: true,
    });
  } catch (error) {
    console.error("Failed to track visit:", error);

    return res.status(500).json({
      error: "Failed to track visit",
    });
  }
}