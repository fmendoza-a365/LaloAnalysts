const Campaign = require('../models/Campaign');

async function list(req,res){
  try{
    const campaigns=await Campaign.find({activa:true}).sort({fechaActualizacion:-1});
    res.render('campaigns/select',{title:'Campañas',user:req.user,campaigns,hideNavbar:true});
  }catch(err){
    req.flash('error_msg','Error al cargar las campañas');
    res.redirect('/');
  }
}

async function select(req,res){
  try{
    const campaign=await Campaign.findById(req.params.id);
    if(!campaign){
      req.flash('error_msg','Campaña no encontrada');
      return res.redirect('/campaigns');
    }
    req.session.selectedCampaign=campaign._id.toString();
    req.flash('success_msg','Campaña "'+campaign.nombre+'" seleccionada');
    const returnTo=req.session.returnTo||'/dashboard';
    delete req.session.returnTo;
    res.redirect(returnTo);
  }catch(err){
    req.flash('error_msg','Error al seleccionar campaña');
    res.redirect('/campaigns');
  }
}

async function editView(req,res){
  try{
    const campaign=await Campaign.findById(req.params.id);
    if(!campaign){
      req.flash('error_msg','Campaña no encontrada');
      return res.redirect('/campaigns');
    }
    res.render('campaigns/edit',{title:'Editar Campaña',user:req.user,campaign,hideNavbar:true});
  }catch(err){
    req.flash('error_msg','Error al cargar la campaña');
    res.redirect('/campaigns');
  }
}

async function editPost(req,res){
  try{
    const {nombre,descripcion,imagen,gerente,analista,subCampanas,colorPrimary,colorAccent}=req.body;
    let parsedSubCampanas=[];
    if(subCampanas){
      try{parsedSubCampanas=JSON.parse(subCampanas);}catch(e){parsedSubCampanas=[];}
    }
    await Campaign.findByIdAndUpdate(req.params.id,{
      nombre,
      descripcion,
      imagen:imagen||'/images/default-campaign.jpg',
      gerente,
      analista,
      colorPrimary:colorPrimary||'#162B3D',
      colorAccent:colorAccent||'#2D4A66',
      subCampanas:parsedSubCampanas,
      fechaActualizacion:Date.now()
    });
    req.flash('success_msg','Campaña actualizada exitosamente');
    res.redirect('/campaigns');
  }catch(err){
    req.flash('error_msg','Error al actualizar la campaña');
    res.redirect('/campaigns/edit/'+req.params.id);
  }
}

async function create(req,res){
  try{
    const {nombre,descripcion,imagen,gerente,analista,colorPrimary,colorAccent}=req.body;
    const newCampaign=new Campaign({
      nombre,
      descripcion,
      imagen:imagen||'/images/default-campaign.jpg',
      gerente,
      analista,
      colorPrimary:colorPrimary||'#162B3D',
      colorAccent:colorAccent||'#2D4A66',
      subCampanas:[]
    });
    await newCampaign.save();
    req.flash('success_msg','Campaña creada exitosamente');
    res.redirect('/campaigns');
  }catch(err){
    req.flash('error_msg','Error al crear la campaña');
    res.redirect('/campaigns');
  }
}

async function remove(req,res){
  try{
    if(req.user.role!=='admin'){
      req.flash('error_msg','No tienes permisos para eliminar campañas');
      return res.redirect('/campaigns');
    }
    const campaign=await Campaign.findById(req.params.id);
    if(!campaign){
      req.flash('error_msg','Campaña no encontrada');
      return res.redirect('/campaigns');
    }
    await Campaign.findByIdAndDelete(req.params.id);
    if(req.session.selectedCampaign===req.params.id){
      req.session.selectedCampaign=null;
    }
    req.flash('success_msg','Campaña eliminada exitosamente');
    res.redirect('/campaigns');
  }catch(err){
    req.flash('error_msg','Error al eliminar la campaña');
    res.redirect('/campaigns');
  }
}

module.exports={list,select,editView,editPost,create,remove};
