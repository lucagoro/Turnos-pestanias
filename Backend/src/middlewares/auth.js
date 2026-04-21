import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // 1. Buscamos el token en los headers (se suele enviar como 'Authorization: Bearer TOKEN')
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere token.' });
  }

  try {
    // 2. Verificamos si el token es válido y no expiró
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Guardamos los datos del admin dentro del objeto 'req' para usarlo después
    req.admin = verified;
    
    // 4. ¡Todo ok! Pasamos a la siguiente función
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};