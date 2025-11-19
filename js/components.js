async function loadComponent(elementId, componentPath) {
  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
    return true;
  } catch (error) {
    console.error(`Error cargando componente ${componentPath}:`, error);
    return false;
  }
}

const basePathComponents = ''; 

document.addEventListener('DOMContentLoaded', async () => {
  const headerOk = await loadComponent('header-component', basePathComponents + 'includes/header.php');
  const footerOk = await loadComponent('footer-component', basePathComponents + 'includes/footer.php');

  if (headerOk) {
    setTimeout(() => {
      if (typeof initializeGlobalComponents === 'function') {
        initializeGlobalComponents();
      }
      if (typeof updateProfileButton === 'function') {
        updateProfileButton();
      }
      if (typeof updateHeaderProfile === 'function') {
        updateHeaderProfile();
      }

      try {
        window.dispatchEvent(new CustomEvent('header:loaded'));
      } catch {}
    }, 50);
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'currentUserEmail' || e.key === 'digitalPointUsers') {
      if (typeof updateProfileButton === 'function') updateProfileButton();
      if (typeof updateHeaderProfile === 'function') updateHeaderProfile();
    }
  });
});
