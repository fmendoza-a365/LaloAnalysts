document.addEventListener('DOMContentLoaded',function(){
  var search1=document.getElementById('searchCampaign');
  var search2=document.getElementById('searchInput');
  if(search1){
    search1.addEventListener('input',function(e){
      var t=(e.target.value||'').toLowerCase();
      document.querySelectorAll('.campaign-card').forEach(function(card){
        var name=card.getAttribute('data-name')||'';
        card.style.display=name.indexOf(t)>-1?'':'none';
      });
    });
  }
  if(search2){
    search2.addEventListener('input',function(){
      var t=(search2.value||'').toLowerCase().trim();
      document.querySelectorAll('.campaign-card').forEach(function(card){
        var nombre=card.getAttribute('data-nombre')||'';
        card.style.display=nombre.indexOf(t)>-1?'':'none';
      });
    });
  }
});

function showCreateModal(){
  var m=document.getElementById('createModal');
  if(m){m.classList.remove('hidden');}
  var nav=document.querySelector('.navbar-main');
  if(nav){nav.style.display='none';}
  var modules=document.getElementById('modules-navbar');
  if(modules){modules.style.display='none';}
  var mobile=document.querySelector('nav.fixed.bottom-0');
  if(mobile){mobile.style.display='none';}
  var footer=document.querySelector('footer');
  if(footer){footer.style.display='none';}
}

function hideCreateModal(){
  var m=document.getElementById('createModal');
  if(m){m.classList.add('hidden');}
  var nav=document.querySelector('.navbar-main');
  if(nav){nav.style.display='';}
  var modules=document.getElementById('modules-navbar');
  if(modules){modules.style.display='';}
  var mobile=document.querySelector('nav.fixed.bottom-0');
  if(mobile){mobile.style.display='';}
  var footer=document.querySelector('footer');
  if(footer){footer.style.display='';}
}

function openCreateModal(){showCreateModal();}
function closeCreateModal(){hideCreateModal();}

function confirmDelete(campaignId,campaignName){
  var nameEl=document.getElementById('deleteCampaignName');
  if(nameEl){nameEl.textContent=campaignName||'';}
  var form=document.getElementById('deleteForm');
  if(form){form.action='/campaigns/delete/'+campaignId;}
  var m=document.getElementById('deleteModal');
  if(m){m.classList.remove('hidden');}
}

function closeDeleteModal(){
  var m=document.getElementById('deleteModal');
  if(m){m.classList.add('hidden');}
}

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    closeCreateModal();
    closeDeleteModal();
  }
});

window.showCreateModal=showCreateModal;
window.hideCreateModal=hideCreateModal;
window.openCreateModal=openCreateModal;
window.closeCreateModal=closeCreateModal;
window.confirmDelete=confirmDelete;
window.closeDeleteModal=closeDeleteModal;
