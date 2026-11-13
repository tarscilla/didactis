const ICONES_SVG = {
  'graduation-cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  'home': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
  'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  'pen-tool': '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/>',
  'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  'send': '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  'file-check': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>',
  'file-down': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>'
};

window.lucide = {
  createIcons() {
    document.querySelectorAll('[data-lucide]').forEach((el) => {
      const nome = el.getAttribute('data-lucide');
      if (!ICONES_SVG[nome]) return;
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES_SVG[nome]}</svg>`;
    });
  }
};
document.addEventListener('DOMContentLoaded', () => window.lucide.createIcons());

const menuItems = document.querySelectorAll('.menu-item');
const views = document.querySelectorAll('.view');

function navegarPara(viewId) {
  views.forEach(view => view.classList.remove('active'));
  menuItems.forEach(item => item.classList.remove('active'));

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  const targetMenuItem = document.querySelector(`[data-target="${viewId}"]`);
  if (targetMenuItem) targetMenuItem.classList.add('active');
}

menuItems.forEach(button => {
  button.addEventListener('click', () => {
    const targetView = button.getAttribute('data-target');
    navegarPara(targetView);
  });
});

document.getElementById('capaForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btnGerar');
  btn.innerText = 'Gerando PDF... aguarde';
  btn.disabled = true;

  const alunosTexto = document.getElementById('alunos').value;
  const alunosArray = alunosTexto
    .split('\n')
    .map(nome => nome.trim())
    .filter(nome => nome.length > 0);

  const dadosFormulario = {
    escola: document.getElementById('escola').value,
    professora: document.getElementById('professora').value,
    turma: document.getElementById('turma').value,
    unidade: document.getElementById('unidade').value,
    anoLetivo: document.getElementById('anoLetivo').value,
    alunos: alunosArray
  };

  try {
    const response = await fetch('/api/capas/gerar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosFormulario)
    });

    if (!response.ok) throw new Error('Erro ao gerar o PDF');

    const blob = await response.blob();
    const pdfUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'capas_portfolio.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (error) {
    alert('Não foi possível conectar com o servidor backend.');
    console.error(error);
  } finally {
    btn.innerText = '🚀 Gerar Capas em PDF';
    btn.disabled = false;
  }
});

document.getElementById('relatorioForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btnGerarRelatorio');
  btn.innerText = 'Gerando Relatório... aguarde';
  btn.disabled = true;

  const dadosFormulario = {
    escola: document.getElementById('relatorioEscola').value,
    professora: document.getElementById('relatorioProfessora').value,
    aluno: document.getElementById('relatorioAluno').value,
    turma: document.getElementById('relatorioTurma').value,
    unidade: document.getElementById('relatorioUnidade').value,
    texto: document.getElementById('relatorioTexto').value
  };

  try {
    const response = await fetch('/api/relatorios/gerar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosFormulario)
    });

    if (!response.ok) throw new Error('Erro na resposta do servidor');

    const blob = await response.blob();
    const pdfUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `relatorio_${dadosFormulario.aluno.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (error) {
    alert('Rota do backend ainda não configurada. Aguardando modelo de layout!');
    console.error(error);
  } finally {
    btn.innerText = '📄 Gerar Relatório em PDF';
    btn.disabled = false;
  }
});

function alternarModoIA(modo) {
  const abas = {
    chat: document.getElementById('modo-ia-chat'),
    questoes: document.getElementById('modo-ia-questoes'),
    form: document.getElementById('modo-ia-form')
  };

  Object.values(abas).forEach(el => { if (el) el.style.display = 'none'; });
  if (abas[modo]) abas[modo].style.display = 'block';

  document.querySelectorAll('.ia-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-modo') === modo);
  });
}

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const btnSendChat = document.getElementById('btnSendChat');

function adicionarMensagem(texto, origem) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add(origem === 'user' ? 'msg-user' : 'msg-ai');
  msgDiv.textContent = texto;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// =========================================================
// PERSISTÊNCIA LOCAL (localStorage)
// =========================================================
const STORAGE_KEYS = {
  CHAT: 'didactis_chat_historico',
  UNIDADE: 'didactis_unidade',
  RASCUNHO_RELATORIO: 'didactis_rascunho_relatorio',
  RASCUNHO_QUESTOES: 'didactis_rascunho_questoes',
  ALUNOS: 'didactis_lista_alunos'
};

let historicoChat = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT) || '[]');

function salvarHistoricoChat() {
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(historicoChat.slice(-30)));
}

function restaurarDadosSalvos() {
  if (historicoChat.length > 0 && typeof adicionarMensagem === 'function') {
    historicoChat.forEach((msg) => {
      adicionarMensagem(msg.content, msg.role === 'user' ? 'user' : 'ai');
    });
  }

  const unidadeSalva = localStorage.getItem(STORAGE_KEYS.UNIDADE);
  const selRelUnidade = document.getElementById('relatorioUnidade');
  const selAvaUnidade = document.getElementById('avaliacaoUnidade');

  if (unidadeSalva) {
    if (selRelUnidade) selRelUnidade.value = unidadeSalva;
    if (selAvaUnidade) selAvaUnidade.value = unidadeSalva;
  }

  [selRelUnidade, selAvaUnidade].forEach((el) => {
    if (!el) return;
    el.addEventListener('change', () => {
      localStorage.setItem(STORAGE_KEYS.UNIDADE, el.value);
      if (selRelUnidade) selRelUnidade.value = el.value;
      if (selAvaUnidade) selAvaUnidade.value = el.value;
    });
  });

  const relatorioTextoEl = document.getElementById('relatorioTexto');
  if (relatorioTextoEl) {
    const rascunhoRel = localStorage.getItem(STORAGE_KEYS.RASCUNHO_RELATORIO);
    if (rascunhoRel && !relatorioTextoEl.value.trim()) {
      relatorioTextoEl.value = rascunhoRel;
    }
    relatorioTextoEl.addEventListener('input', () => {
      localStorage.setItem(STORAGE_KEYS.RASCUNHO_RELATORIO, relatorioTextoEl.value);
    });
  }

  const editorBox = document.getElementById('avaliacaoEditorBox');
  const questoesEditor = document.getElementById('questoesEditor');
  const avaliacaoTitulo = document.getElementById('avaliacaoTitulo');

  if (questoesEditor && editorBox) {
    const rascunhoQ = JSON.parse(localStorage.getItem(STORAGE_KEYS.RASCUNHO_QUESTOES) || 'null');
    if (rascunhoQ && rascunhoQ.texto) {
      questoesEditor.value = rascunhoQ.texto;
      if (avaliacaoTitulo && rascunhoQ.titulo) avaliacaoTitulo.value = rascunhoQ.titulo;
      editorBox.style.display = 'block';
    }

    const salvarRascunhoQuestoes = () => {
      localStorage.setItem(STORAGE_KEYS.RASCUNHO_QUESTOES, JSON.stringify({
        titulo: avaliacaoTitulo ? avaliacaoTitulo.value : '',
        texto: questoesEditor.value
      }));
    };

    questoesEditor.addEventListener('input', salvarRascunhoQuestoes);
    if (avaliacaoTitulo) avaliacaoTitulo.addEventListener('input', salvarRascunhoQuestoes);
  }

  const capasTextarea = document.getElementById('alunos');
  const alunoInput = document.getElementById('relatorioAluno');

  const atualizarDatalistAlunos = (lista) => {
    if (!alunoInput || !Array.isArray(lista)) return;
    let datalist = document.getElementById('listaAlunosSugestoes');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'listaAlunosSugestoes';
      document.body.appendChild(datalist);
      alunoInput.setAttribute('list', 'listaAlunosSugestoes');
    }
    datalist.innerHTML = lista.map((nome) => `<option value="${nome}">`).join('');
  };

  const alunosSalvos = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALUNOS) || '[]');
  if (capasTextarea) {
    if (alunosSalvos.length > 0 && !capasTextarea.value.trim()) {
      capasTextarea.value = alunosSalvos.join('\n');
    }
    capasTextarea.addEventListener('input', () => {
      const nomes = capasTextarea.value.split('\n').map((n) => n.trim()).filter(Boolean);
      localStorage.setItem(STORAGE_KEYS.ALUNOS, JSON.stringify(nomes));
      atualizarDatalistAlunos(nomes);
    });
  }
  atualizarDatalistAlunos(alunosSalvos);
}

document.addEventListener('DOMContentLoaded', restaurarDadosSalvos);

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mensagem = chatInput.value.trim();
  if (!mensagem) return;

  chatInput.value = '';
  adicionarMensagem(mensagem, 'user');
  btnSendChat.disabled = true;

  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('msg-ai');
  loadingDiv.textContent = 'Pensando...';
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch('/api/ia/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem, historico: historicoChat })
    });
    const data = await res.json();
    const resposta = data.resposta || data.error || 'Sem resposta.';
    loadingDiv.textContent = resposta;

    historicoChat.push({ role: 'user', content: mensagem });
    historicoChat.push({ role: 'assistant', content: resposta });
    salvarHistoricoChat();
  } catch (err) {
    const conexaoExpirou = err.message.includes('Failed to fetch');
    loadingDiv.textContent = conexaoExpirou
      ? 'A conexão desta aba adormeceu. Dê F5 na página para reconectar.'
      : `Erro de comunicação: ${err.message}`;
  } finally {
    btnSendChat.disabled = false;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

const btnLimparChat = document.getElementById('btnLimparChat');
if (btnLimparChat) {
  btnLimparChat.addEventListener('click', () => {
    historicoChat = [];
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    chatMessages.innerHTML = '<div class="msg-ai">Olá, Profª Eliene! Posso ajudar com ideias de atividades, explicações da BNCC, dinâmicas ou revisão de textos. O que vamos preparar hoje?</div>';
  });
}

const questoesFormEl = document.getElementById('questoesForm');
if (questoesFormEl) {
  questoesFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGerarQuestoes');
    const materia = document.getElementById('questoesMateria').value;
    const tema = document.getElementById('questoesTema').value;
    const quantidade = document.getElementById('questoesQtd').value;
    const tipo = document.getElementById('questoesTipo').value;

    btn.disabled = true;
    btn.textContent = 'Elaborando questões...';

    try {
      const res = await fetch('/api/ia/gerar-questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia, tema, quantidade, tipo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar questões.');

      const tituloGerado = `AVALIAÇÃO DE ${materia.toUpperCase()}`;
      document.getElementById('avaliacaoTitulo').value = tituloGerado;
      document.getElementById('questoesEditor').value = data.questoes;
      document.getElementById('avaliacaoEditorBox').style.display = 'block';

      localStorage.setItem(STORAGE_KEYS.RASCUNHO_QUESTOES, JSON.stringify({
        titulo: tituloGerado,
        texto: data.questoes
      }));
    } catch (err) {
      alert(`Não foi possível gerar as questões: ${err.message}`);
    } finally {
      btn.innerHTML = '<i data-lucide="sparkles"></i> Gerar Questões';
      if (window.lucide) lucide.createIcons();
      btn.disabled = false;
    }
  });
}

async function baixarAvaliacaoPdf(incluirGabarito) {
  const texto = document.getElementById('questoesEditor').value.trim();
  if (!texto) {
    alert('Gere ou escreva as questões antes de baixar o PDF.');
    return;
  }

  const materia = document.getElementById('questoesMateria')?.value || '';
  const titulo = document.getElementById('avaliacaoTitulo')?.value || 'AVALIAÇÃO DE APRENDIZAGEM';
  const unidade = document.getElementById('avaliacaoUnidade')?.value || '1ª UNIDADE';
  const data = document.getElementById('avaliacaoData')?.value || '';

  const btnAlvo = incluirGabarito
    ? document.getElementById('btnBaixarComGabarito')
    : document.getElementById('btnBaixarSemGabarito');

  const textoOriginal = btnAlvo.innerHTML;
  btnAlvo.disabled = true;
  btnAlvo.textContent = 'Gerando PDF...';

  try {
    const response = await fetch('/api/avaliacoes/gerar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materia, titulo, unidade, data, texto, incluirGabarito })
    });

    if (!response.ok) throw new Error('Falha ao montar o PDF da avaliação.');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sufixo = incluirGabarito ? 'com_gabarito' : 'alunos';
    a.download = `prova_${(materia || 'avaliacao').toLowerCase().replace(/\s+/g, '_')}_${sufixo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert(`Erro ao gerar PDF: ${err.message}`);
  } finally {
    btnAlvo.innerHTML = textoOriginal;
    if (window.lucide) lucide.createIcons();
    btnAlvo.disabled = false;
  }
}

document.getElementById('btnBaixarComGabarito')?.addEventListener('click', () => baixarAvaliacaoPdf(true));
document.getElementById('btnBaixarSemGabarito')?.addEventListener('click', () => baixarAvaliacaoPdf(false));

document.getElementById('iaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnGerarIA');
  btn.innerText = 'Gerando texto...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/ia/gerar-texto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aluno: document.getElementById('iaAluno').value,
        pontosFortes: document.getElementById('iaPontosFortes').value,
        observacoes: document.getElementById('iaObservacoes').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao gerar texto');

    document.getElementById('iaTextoGerado').value = data.texto;
    document.getElementById('iaResultadoBox').style.display = 'block';
  } catch (err) {
    alert(`Não foi possível gerar o texto: ${err.message}`);
  } finally {
    btn.innerText = '✨ Gerar Texto do Relatório';
    btn.disabled = false;
  }
});

document.getElementById('btnCopiarIA').addEventListener('click', () => {
  const text = document.getElementById('iaTextoGerado');
  text.select();
  navigator.clipboard.writeText(text.value);
  alert('Texto copiado!');
});

document.getElementById('btnLimparRelatorio')?.addEventListener('click', () => {
  const relatorioTexto = document.getElementById('relatorioTexto');
  if (relatorioTexto) relatorioTexto.value = '';
  localStorage.removeItem(STORAGE_KEYS.RASCUNHO_RELATORIO);
});

document.getElementById('btnUsarNoRelatorio')?.addEventListener('click', () => {
  const nomeAluno = document.getElementById('iaAluno')?.value || '';
  const textoGerado = document.getElementById('iaTextoGerado')?.value || '';
  const campoAluno = document.getElementById('relatorioAluno');
  const campoTexto = document.getElementById('relatorioTexto');

  if (campoAluno && nomeAluno) campoAluno.value = nomeAluno;
  if (campoTexto) {
    campoTexto.value = textoGerado;
    localStorage.setItem(STORAGE_KEYS.RASCUNHO_RELATORIO, textoGerado);
  }
  navegarPara('view-relatorios');
});