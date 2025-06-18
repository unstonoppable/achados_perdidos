const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.logged_in && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ success: false, message: 'Usuário não autenticado. Por favor, faça login.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.tipo_usuario === 'admin') {
      return next();
  } else {
      return res.status(403).json({ success: false, message: 'Acesso negado. Requer privilégios de administrador.' });
  }
};

export { isAuthenticated, isAdmin }; 