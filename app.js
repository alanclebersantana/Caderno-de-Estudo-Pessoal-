/* ============================================================
   SISTEMA DE NAVEGAÇÃO E VOLTAR (MOBILE / PWA)
   ============================================================ */

(function () {
  let lastBackPressTime = 0;
  const DOUBLE_BACK_DELAY = 2000; // Tempo em ms para o 2º gesto fechar o app

  // Elementos do DOM
  const sidebar = document.querySelector('aside');
  const btnMenu = document.querySelector('.btn-menu'); // Ajuste a classe do botão que abre a sidebar se necessário

  // 1. Define o estado inicial da Home ao carregar a página
  window.addEventListener('DOMContentLoaded', () => {
    if (!history.state) {
      history.replaceState({ page: 'sec-inicio' }, '');
    }
  });

  // 2. Registra histórico ao abrir a Sidebar
  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      if (sidebar) sidebar.classList.add('ativa');
      history.pushState({ sidebarOpen: true }, '');
    });
  }

  // Helper: Fecha a sidebar sem acionar histórico
  function fecharSidebarDOM() {
    if (sidebar) sidebar.classList.remove('ativa');
  }

  // Helper: Identifica qual seção está visível no momento
  function getSecaoAtivaId() {
    const secaoAtiva = document.querySelector('main section.ativa, main section:not([hidden])');
    return secaoAtiva ? secaoAtiva.id : 'sec-inicio';
  }

  // Helper: Força o app a mostrar a tela de Início
  function irParaInicioDOM() {
    // Esconde todas as seções
    const secoes = document.querySelectorAll('main section');
    secoes.forEach(sec => {
      sec.classList.remove('ativa');
      sec.style.display = 'none';
    });

    // Exibe a seção de início (ou a primeira seção)
    const inicioSec = document.getElementById('sec-inicio') || secoes[0];
    if (inicioSec) {
      inicioSec.classList.add('ativa');
      inicioSec.style.display = 'block';
    }
  }

  // 3. Intercepta o Gesto / Botão de Voltar do Celular
  window.addEventListener('popstate', (event) => {
    const isSidebarOpen = sidebar && sidebar.classList.contains('ativa');

    // REGRA 1: Se a Sidebar estiver aberta -> Apenas fecha a Sidebar
    if (isSidebarOpen) {
      fecharSidebarDOM();
      // Restaura o histórico para o estado da página sem a sidebar
      history.pushState({ page: getSecaoAtivaId() }, '');
      return;
    }

    const secaoAtual = getSecaoAtivaId();

    // REGRA 2: Se NÃO estiver na tela Inicial -> Volta para a Tela Inicial
    if (secaoAtual !== 'sec-inicio') {
      irParaInicioDOM();
      history.pushState({ page: 'sec-inicio' }, '');
      return;
    }

    // REGRA 3: Se JÁ estiver na tela Inicial -> Trava silenciosa de 2º gesto para fechar
    const currentTime = Date.now();

    if (currentTime - lastBackPressTime < DOUBLE_BACK_DELAY) {
      // Segundo gesto em menos de 2s: deixa o sistema fechar o PWA
      history.back();
    } else {
      // Primeiro gesto: guarda o tempo e re-injeta o estado para travar a saída
      lastBackPressTime = currentTime;
      history.pushState({ page: 'sec-inicio' }, '');
    }
  });

  // 4. Integração com a navegação do Menu (cliques na Sidebar)
  const linksSidebar = document.querySelectorAll('aside a, aside [data-target]');
  linksSidebar.forEach(link => {
    link.addEventListener('click', () => {
      // Fecha a sidebar se aberta ao clicar num item
      fecharSidebarDOM();
      
      // Registra a mudança de seção no histórico
      const targetId = link.getAttribute('data-target') || link.getAttribute('href')?.replace('#', '');
      if (targetId) {
        history.pushState({ page: targetId }, '');
      }
    });
  });

})();
                          
