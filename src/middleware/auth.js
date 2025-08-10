function requireLogin(req, res, next) {
  if (req.session && req.session.user && ["SUPER_ADMIN", "ADMIN"].includes(req.session.user.role)) {
    return next();
  }
  req.flash('error', 'Please login as admin to continue');
  return res.redirect('/login');
}

function attachUser(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  next();
}

module.exports = { requireLogin, attachUser };


