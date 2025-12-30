export function requireApiKey(req: Request): void {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.API_KEY || "";

  if (!expected) {
    throw new Error("Servidor sem API_KEY configurada.");
  }

  // Formato: Authorization: Bearer <token>
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token || token !== expected) {
    const err = new Error("Não autorizado.");
    (err as any).statusCode = 401;
    throw err;
  }
}

