const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const PowerBILink = require('../models/PowerBILink');

// Dashboard route - protected
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Get user with their Power BI reports
    const user = await User.findById(req.user.id).select('-password');
    
    // Enlaces (Dashbords) visibles: si es analista, ve todo
    const visibilityFilter = (req.user && req.user.role === 'analista')
      ? {}
      : {
          $or: [
            { rolesPermitidos: { $size: 0 } },
            { rolesPermitidos: { $exists: false } },
            { rolesPermitidos: req.user ? req.user.role : undefined }
          ]
        };

    const allVisibleLinks = await PowerBILink.find(visibilityFilter).sort({ creadoEn: -1 });
    const recentLinks = allVisibleLinks.slice(0, 6);

    // KPIs simples para el tablero
    const totalDashbords = allVisibleLinks.length;
    const enlacesPublicos = allVisibleLinks.filter(l => {
      try {
        const u = new URL(l.url);
        return u.pathname.toLowerCase().includes('/view') && /[?&]r=/.test(u.search.toLowerCase());
      } catch { return false; }
    }).length;
    const kpis = {
      totalDashbords,
      enlacesPublicos,
      ultimaActualizacion: new Date()
    };

    res.render('dashboard/index', { 
      title: 'Tablero',
      user,
      reports: user.powerBIReports || [],
      recentLinks,
      kpis
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el tablero');
    res.redirect('/');
  }
});

// Add a new Power BI report (Admin only)
router.post('/reports', ensureAuthenticated, checkRole(['admin']), async (req, res) => {
  const { name, reportId, groupId, embedUrl } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    
    // Add the new report
    user.powerBIReports.unshift({
      name,
      reportId,
      groupId,
      embedUrl
    });
    
    await user.save();
    
    req.flash('success_msg', 'Reporte agregado correctamente');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error agregando reporte');
    res.redirect('/dashboard');
  }
});

// View a specific report
router.get('/reports/:reportId', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const report = user.powerBIReports.find(
      r => r._id.toString() === req.params.reportId
    );
    
    if (!report) {
      req.flash('error_msg', 'Reporte no encontrado');
      return res.redirect('/dashboard');
    }
    
    // Check if user has access to this report
    // You can implement additional access control here
    
    res.render('dashboard/report', {
      title: report.name,
      report,
      // accessToken placeholder; integrate with Azure AD to obtain a real token
      accessToken: null,
      powerBiConfig: {
        type: 'report',
        embedUrl: report.embedUrl,
        tokenType: 'Aad',
        settings: {
          panes: {
            filters: {
              expanded: false,
              visible: true
            }
          },
          background: 'transparent',
          hideDefaultSlicers: true,
        }
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el reporte');
    res.redirect('/dashboard');
  }
});

// Admin dashboard (only accessible by admins)
router.get('/admin', ensureAuthenticated, checkRole(['admin']), (req, res) => {
  res.render('dashboard/admin', {
    title: 'Panel de Administración',
    user: req.user
  });
});

module.exports = router;
