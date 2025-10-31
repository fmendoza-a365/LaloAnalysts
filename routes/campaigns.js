const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Campaign = require('../models/Campaign');

// Vista principal de selección de campañas (sin layout)
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ activa: true }).sort({ fechaActualizacion: -1 });
    res.render('campaigns/select', {
      title: 'Selección de Campaña - A365',
      user: req.user,
      campaigns,
      layout: false
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al cargar las campañas');
    res.redirect('/');
  }
});

// Seleccionar una campaña
router.get('/select/:id', ensureAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      req.flash('error_msg', 'Campaña no encontrada');
      return res.redirect('/campaigns');
    }

    // ✅ CORREGIDO: Guardar solo el ID (string) para compatibilidad con tenant middleware
    req.session.selectedCampaign = campaign._id.toString();

    console.log(`[CAMPAIGNS] Usuario ${req.user.username} seleccionó campaña: ${campaign.nombre} (${campaign._id})`);

    req.flash('success_msg', `Campaña "${campaign.nombre}" seleccionada`);

    // Redirigir a la URL original si existe, sino al dashboard
    const returnTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo; // Limpiar después de usar
    res.redirect(returnTo);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al seleccionar campaña');
    res.redirect('/campaigns');
  }
});

// Vista de edición de campaña
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      req.flash('error_msg', 'Campaña no encontrada');
      return res.redirect('/campaigns');
    }
    
    res.render('campaigns/edit', {
      title: 'Editar Campaña',
      user: req.user,
      campaign
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al cargar la campaña');
    res.redirect('/campaigns');
  }
});

// Actualizar campaña
router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { nombre, descripcion, imagen, gerente, analista, subCampanas } = req.body;
    
    // Parsear subcampañas si viene como JSON string
    let parsedSubCampanas = [];
    if (subCampanas) {
      try {
        parsedSubCampanas = JSON.parse(subCampanas);
      } catch (e) {
        parsedSubCampanas = [];
      }
    }
    
    await Campaign.findByIdAndUpdate(req.params.id, {
      nombre,
      descripcion,
      imagen: imagen || '/images/default-campaign.jpg',
      gerente,
      analista,
      subCampanas: parsedSubCampanas,
      fechaActualizacion: Date.now()
    });
    
    req.flash('success_msg', 'Campaña actualizada exitosamente');
    res.redirect('/campaigns');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al actualizar la campaña');
    res.redirect('/campaigns/edit/' + req.params.id);
  }
});

// Crear nueva campaña
router.post('/create', ensureAuthenticated, async (req, res) => {
  try {
    const { nombre, descripcion, imagen, gerente, analista } = req.body;
    
    const newCampaign = new Campaign({
      nombre,
      descripcion,
      imagen: imagen || '/images/default-campaign.jpg',
      gerente,
      analista,
      subCampanas: []
    });
    
    await newCampaign.save();
    
    req.flash('success_msg', 'Campaña creada exitosamente');
    res.redirect('/campaigns');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al crear la campaña');
    res.redirect('/campaigns');
  }
});

// Eliminar campaña
router.post('/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Solo admin puede eliminar
    if (req.user.role !== 'admin') {
      req.flash('error_msg', 'No tienes permisos para eliminar campañas');
      return res.redirect('/campaigns');
    }
    
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      req.flash('error_msg', 'Campaña no encontrada');
      return res.redirect('/campaigns');
    }
    
    await Campaign.findByIdAndDelete(req.params.id);

    // Si la campaña eliminada era la seleccionada, limpiar sesión
    if (req.session.selectedCampaign === req.params.id) {
      req.session.selectedCampaign = null;
    }
    
    req.flash('success_msg', 'Campaña eliminada exitosamente');
    res.redirect('/campaigns');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al eliminar la campaña');
    res.redirect('/campaigns');
  }
});

module.exports = router;
