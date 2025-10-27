// Middleware para verificar que se ha seleccionado una campaña
module.exports = {
  requireCampaign: (req, res, next) => {
    if (!req.session.selectedCampaign) {
      req.flash('error_msg', 'Por favor selecciona una campaña primero');
      return res.redirect('/campaigns');
    }
    next();
  }
};
