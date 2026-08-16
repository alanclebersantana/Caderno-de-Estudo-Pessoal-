/* ============================================================
   SISTEMA DE NAVEGAÇÃO E VOLTAR (MOBILE / PWA)
   Regras:
   1) Sidebar aberta + gesto de voltar  -> só fecha a sidebar.
   2) Fora da tela Início + gesto de voltar -> volta para a Início.
   3) Já na tela Início + gesto de voltar -> só fecha o app se for
      feito duas vezes seguidas (dentro de DOUBLE_BACK_DELAY).
   ============================================================ */

(function () {
  const HOME = 'inicio';
  const DOUBLE_BACK_DELAY = 2000; // ms para o 2º gesto fechar o app
  let lastBackPressTime = 0;

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
    if (!history.state) {
      try { history.replaceState({ page: HOME }, ''); } catch (e) {}
    }
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

    // REGRA 3: já na Início -> exige 2 gestos seguidos para fechar
    const agora = Date.now();
    if (agora - lastBackPressTime < DOUBLE_BACK_DELAY) {
      // segundo gesto a tempo: deixa o navegador/sistema seguir (fecha o app)
      history.back();
    } else {
      lastBackPressTime = agora;
      empilharEstado({ page: HOME });
    }
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
