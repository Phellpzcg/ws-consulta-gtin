export function requireApiKey(req) {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.API_KEY || "";

  if (!expected) {
    throw new Error("Servidor sem API_KEY configurada.");
  }

  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token || token !== expected) {
    const err = new Error("Não autorizado.");
    err.statusCode = 401;
    throw err;
  }
}
