const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');

// Página de registro
router.get('/register', forwardAuthenticated, (req, res) => {
  res.render('auth/register', { title: 'Registro' });
});

// Proceso de registro
router.post('/register', async (req, res) => {
  const { username, email, password, password2 } = req.body;
  let errors = [];

  // Check required fields
  if (!username || !email || !password || !password2) {
    errors.push({ msg: 'Por favor completa todos los campos' });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Las contraseñas no coinciden' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (errors.length > 0) {
    return res.render('auth/register', {
      title: 'Registro',
      errors,
      username,
      email
    });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    
    if (userExists) {
      errors.push({ msg: 'El correo o el usuario ya están registrados' });
      return res.render('auth/register', {
        title: 'Registro',
        errors,
        username,
        email
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role: 'user' // Default role
    });

    await newUser.save();
    
    req.flash('success_msg', 'Registro exitoso, ahora puedes iniciar sesión');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error registrando usuario');
    res.redirect('/auth/register');
  }
});

// Página de inicio de sesión
router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('auth/login', { title: 'Iniciar sesión' });
});

// Proceso de inicio de sesión
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/campaigns',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

// Proceso de cierre de sesión
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return next(err);
    }
    req.flash('success_msg', 'Has cerrado sesión');
    res.redirect('/auth/login');
  });
});

module.exports = router;
