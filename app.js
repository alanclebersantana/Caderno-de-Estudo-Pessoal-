/* ============================================================
   SISTEMA DE NAVEGAÇÃO E VOLTAR (MOBILE / PWA)
   Regras:
   1) Sidebar aberta + gesto de voltar  -> só fecha a sidebar.
   2) Fora da tela Início + gesto de voltar -> volta para a Início.
   3) Já na tela Início + gesto de voltar -> é ignorado. Em nenhuma
      circunstância o gesto de voltar fecha o app.
   ============================================================ */

(function () {
  const HOME = 'inicio';

  function drawerAberta() {
    const drawer = document.getElementById('drawer');
    return !!(drawer && drawer.classList.contains('on'));
  }

  // Identifica a seção visível olhando as <section id="v_..."> dentro do <main>
  function secaoAtivaId() {
    const secoes = document.querySelectorAll('main.main section[id^="v_"]');
    for (const sec of secoes) {
      if (sec.style.display !== 'none') return sec.id.slice(2);
    }
    return HOME;
  }

  // Garante que sempre haja um estado de histórico para o gesto de voltar poder "pegar"
  function empilharEstado(state) {
    try { history.pushState(state, ''); } catch (e) {}
  }

  window.addEventListener('DOMContentLoaded', () => {
    // Fixa o estado atual como Início e empilha um estado extra por cima.
    // Isso garante que sempre exista pelo menos uma entrada de histórico
    // "de reserva" para o gesto de voltar consumir — mesmo no primeiríssimo
    // toque em voltar, ainda na tela Início, sem isso o app fecharia direto
    // por não ter nenhum estado anterior para o navegador/sistema "pegar".
    try { history.replaceState({ page: HOME }, ''); } catch (e) {}
    empilharEstado({ page: HOME });
  });

  window.addEventListener('popstate', () => {
    // REGRA 1: sidebar aberta -> só fecha a sidebar
    if (drawerAberta()) {
      if (typeof window.fecharMenu === 'function') window.fecharMenu();
      empilharEstado({ page: secaoAtivaId() });
      return;
    }

    const atual = secaoAtivaId();

    // REGRA 2: fora da Início -> volta para a Início
    if (atual !== HOME) {
      if (typeof window.go === 'function') window.go(HOME);
      empilharEstado({ page: HOME });
      return;
    }

    // REGRA 3: já na Início -> o gesto de voltar é ignorado.
    // Reempilha o estado para que o próximo gesto de voltar seja
    // sempre capturado de novo, nunca deixando o navegador/sistema
    // seguir em frente e fechar o app.
    empilharEstado({ page: HOME });
  });

  // Sempre que a sidebar for aberta, empilha um estado, para o gesto de
  // voltar ter algo para "consumir" e apenas fechar a sidebar.
  function envolverAbrirMenu() {
    if (typeof window.abrirMenu !== 'function' || window.abrirMenu.__envolvida) return;
    const original = window.abrirMenu;
    const nova = function () {
      original.apply(this, arguments);
      empilharEstado({ sidebarOpen: true });
    };
    nova.__envolvida = true;
    window.abrirMenu = nova;
  }

  // Sempre que o app navegar para uma seção que não é a Início, empilha um
  // estado, para o gesto de voltar sempre ter uma Início para retornar.
  function envolverGo() {
    if (typeof window.go !== 'function' || window.go.__envolvida) return;
    const original = window.go;
    const nova = function (a) {
      original.apply(this, arguments);
      if (a !== HOME) empilharEstado({ page: a });
    };
    nova.__envolvida = true;
    window.go = nova;
  }

  envolverAbrirMenu();
  envolverGo();
})();
