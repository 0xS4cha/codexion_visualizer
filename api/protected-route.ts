import { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, requireUser, sendError } from './_utils/security.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res, ['GET', 'POST'])) return;

  try {
    const user = await requireUser(req);
    return res.status(200).json({ success: true, uid: user.uid, login: user.login });
  } catch (error) {
    return sendError(res, error, 'Error verifying user');
  }
}
