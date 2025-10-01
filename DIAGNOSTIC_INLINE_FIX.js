/**
 * DIAGNOSTIC - Fix Inline para Dropdowns em Modais
 * 
 * COMO USAR:
 * 1. Abrir o modal "Enviar Mensagem"
 * 2. Abrir DevTools (F12)
 * 3. Ir na aba "Console"
 * 4. Colar este código completo
 * 5. Pressionar ENTER
 * 6. Clicar no Select "Aluno"
 * 7. Dropdown deve aparecer BRANCO e VISÍVEL
 */

console.log('🔧 Aplicando fix de dropdowns...');

// Função para aplicar estilos nos dropdowns
function fixDropdowns() {
  // Selecionar TODOS os dropdowns Radix
  const selectContents = document.querySelectorAll('[data-radix-select-content]');
  const dropdownContents = document.querySelectorAll('[data-radix-dropdown-menu-content]');
  const popoverContents = document.querySelectorAll('[data-radix-popover-content]');
  
  console.log(`Encontrados: ${selectContents.length} selects, ${dropdownContents.length} dropdowns, ${popoverContents.length} popovers`);
  
  // Aplicar estilos em TODOS
  [...selectContents, ...dropdownContents, ...popoverContents].forEach(el => {
    el.style.zIndex = '9999';
    el.style.backgroundColor = 'white';
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.position = 'fixed';
    console.log('✅ Aplicado em:', el);
  });
  
  // Aplicar em viewports
  const viewports = document.querySelectorAll('[data-radix-select-viewport]');
  viewports.forEach(el => {
    el.style.backgroundColor = 'white';
    el.style.overflow = 'visible';
  });
  
  // Aplicar em itens
  const items = document.querySelectorAll('[data-radix-select-item]');
  items.forEach(el => {
    el.style.backgroundColor = 'white';
  });
  
  // Diminuir z-index dos overlays de dialog
  const dialogOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
  dialogOverlays.forEach(el => {
    el.style.zIndex = '40';
    console.log('✅ Overlay ajustado:', el);
  });
  
  console.log('✅ Fix aplicado! Teste agora clicando no Select.');
}

// Executar imediatamente
fixDropdowns();

// Observar mudanças no DOM e reaplicar
const observer = new MutationObserver(() => {
  setTimeout(fixDropdowns, 100);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('🎯 Observer ativo. Dropdowns serão corrigidos automaticamente.');
console.log('📋 Para parar o observer: observer.disconnect()');
