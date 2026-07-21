import { useEffect, useState } from 'react';

// Interfaces de dados
interface Instituicao {
  id: string;
  nome_instituicao: string;
  categoria: string;
  whatsapp_contato: string;
  telefone_fixo?: string; 
  link_instagram: string;
  link_facebook: string; 
  link_site?: string; 
  chave_pix: string;
  beneficiario_pix: string;
  endereco_completo: string;
  bairro: string;
  cidade: string;
  estado: string;
  descricao_breve: string;
  capacidade_atendimento: string;
  publico_alvo: string;
  foto_url?: string; 
}

interface table_necessidade {
  id: string;
  instituicao_id: string;
  categoria: string;
  item_nome: string; 
  status_urgencia: string;
  especificacoes: string;
}

export default function App() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [necessidades, setNecessidades] = useState<table_necessidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Controle de Navegação e Busca
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState<Instituicao | null>(null);
  const [busca, setBusca] = useState('');
  
  // Controles de Notificação/Modais de Segurança do PIX
  const [toastConfig, setToastConfig] = useState<{ visivel: boolean; mensagem: string; beneficiario?: string }>({
    visivel: false,
    mensagem: '',
    beneficiario: ''
  });

  const URL_INSTITUICOES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaWeGht1cmXAtk0D5tpJmkgGIBSqWQ4vvu-guflduOTzpXZSAvfMblOfZGmxtXA-eijzP_ZdBFWPGB/pub?gid=0&single=true&output=csv";
  const URL_NECESSIDADES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaWeGht1cmXAtk0D5tpJmkgGIBSqWQ4vvu-guflduOTzpXZSAvfMblOfZGmxtXA-eijzP_ZdBFWPGB/pub?gid=1406763821&single=true&output=csv";

  useEffect(() => {
    const scriptTailwind = document.createElement('script');
    scriptTailwind.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(scriptTailwind);

    const linkFontAwesome = document.createElement('link');
    linkFontAwesome.rel = "stylesheet";
    linkFontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(linkFontAwesome);

    // Animação CSS para pulsação orgânica do coração
    const styleAnimation = document.createElement('style');
    styleAnimation.innerHTML = `
      @keyframes heartPulse {
        0%, 100% { transform: translate(4.1px, 6px) scale(0.8); }
        50% { transform: translate(4.1px, 6px) scale(0.92); }
      }
      .animate-heart-beat {
        animation: heartPulse 1.2s infinite ease-in-out;
        transform-origin: 20px 12px;
      }
      .font-logo {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    `;
    document.head.appendChild(styleAnimation);

    return () => {
      document.head.removeChild(scriptTailwind);
      document.head.removeChild(linkFontAwesome);
      document.head.removeChild(styleAnimation);
    };
  }, []);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);

        const cacheInst = sessionStorage.getItem('cache_inst');
        const cacheNec = sessionStorage.getItem('cache_nec');

        if (cacheInst && cacheNec) {
          setInstituicoes(JSON.parse(cacheInst));
          setNecessidades(JSON.parse(cacheNec));
          setCarregando(false);
          return;
        }

        const [resInst, resNec] = await Promise.all([
          fetch(URL_INSTITUICOES),
          fetch(URL_NECESSIDADES)
        ]);

        const textInst = await resInst.text();
        const textNec = await resNec.text();

        const dadosInst = interpretarCSV(textInst) as Instituicao[];
        const dadosNec = interpretarCSV(textNec) as table_necessidade[];

        const instFiltradas = dadosInst.filter(i => i.nome_instituicao && i.id);
        const necFiltradas = dadosNec.filter(n => n.item_nome && n.instituicao_id);

        sessionStorage.setItem('cache_inst', JSON.stringify(instFiltradas));
        sessionStorage.setItem('cache_nec', JSON.stringify(necFiltradas));

        setInstituicoes(instFiltradas);
        setNecessidades(necFiltradas);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  function interpretarCSV(textoCsv: string): any[] {
    const linhas = textoCsv.split(/\r?\n/).filter(linha => inlineTrim(linha) !== "");
    if (linhas.length === 0) return [];

    const cabecalhos = linhas[0].split(',').map(c => c.replace(/"/g, '').trim().toLowerCase());

    return linhas.slice(1).map(linha => {
      const colunas: string[] = [];
      let valorAtual = '';
      let dentroDeAspas = false;

      for (let i = 0; i < inlineLength(linha); i++) {
        const char = inlineChar(linha, i);
        if (char === '"') {
          dentroDeAspas = !dentroDeAspas;
        } else if (char === ',' && !dentroDeAspas) {
          colunas.push(valorAtual.trim());
          valorAtual = '';
        } else {
          valorAtual += char;
        }
      }
      colunas.push(valorAtual.trim());

      const objeto: any = {};
      cabecalhos.forEach((cabecalho, index) => {
        let valor = colunas[index] || '';
        valor = valor.replace(/^"|"$/g, '').trim();
        objeto[cabecalho] = valor;
      });
      return objeto;
    });
  }

  function inlineChar(str: string, idx: number) {
    return str[idx];
  }

  function inlineLength(str: string) {
    return str.length;
  }

  function inlineTrim(str: string) {
    return str.trim();
  }

  const obterNecessidadesDaInstituicao = (idInst: string) => {
    return necessidades.filter(n => String(n.instituicao_id).trim() === String(idInst).trim());
  };

  const copiarParaClipBoard = (pix: string, beneficiario: string) => {
    navigator.clipboard.writeText(pix);
    setToastConfig({
      visivel: true,
      mensagem: 'Chave PIX copiada com sucesso!',
      beneficiario: beneficiario || 'Instituição Cadastrada'
    });
  };

  const fecharToast = () => {
    setToastConfig(prev => ({ ...prev, visivel: false }));
  };

  const compartilharNecessidade = (instNome: string, itemNome: string, espec: string) => {
    const descricaoItem = espec ? `(${espec})` : '';
    const textoCompartilhamento = `🚨 *${instNome}* precisa de ajuda!\n\nEles estão precisando urgente de: *${itemNome}* ${descricaoItem}.\n\nQuer ajudar ou ver outras necessidades deles? Acesse o site:\n\n👉 https://ondeajudo.com.br\n\n_Ajude a espalhar o bem compartilhando!_ ❤️`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Onde Ajudo?',
        text: `🚨 ${instNome} precisa de ajuda!\n\nEles estão precisando urgente de: ${itemNome} ${descricaoItem}.\n\nQuer ajudar ou ver outras necessidades deles? Acesse o site:\n\n👉`,
        url: 'https://ondeajudo.com.br'
      }).catch(console.error);
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartilhamento)}`, '_blank');
    }
  };

  const compartilharSiteGeral = () => {
    const textoCompartilhamento = `*Onde Ajudo?*, conheça o aplicativo de solidariedade local!\n\nVeja as reais necessidades das instituições da nossa região e combine sua doação física, contribuição por pix ou fale direto com elas no WhatsApp.\n\n👉 Acesse: https://ondeajudo.com.br\n\nCompartilhe nos seus grupos e faça a diferença! 🤝✨`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Onde Ajudo?',
        text: `*Onde Ajudo?*, conheça o aplicativo de solidariedade local!\n\nVeja as reais necessidades das instituições da nossa região e combine sua doação física, contribuição por pix ou fale direto com elas no WhatsApp.\n\n👉 Acesse:`,
        url: 'https://ondeajudo.com.br'
      }).catch(console.error);
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartilhamento)}`, '_blank');
    }
  };

  const obterConfigUrgencia = (status: string) => {
    const s = status?.toLowerCase().trim();
    if (s === 'crítico' || s === 'critico') {
      return {
        border: 'border-[#ea9999]',
        badgeBg: 'bg-[#ea9999]/15 text-[#5C1D1B]',
        badgeText: 'Crítico (10%)',
        barWidth: '10%',
        barBg: 'bg-[#ea9999]',
        textIcon: 'fa-circle-exclamation text-[#ea9999]',
        textoStatus: 'Estoque crítico. Necessitamos de doações urgentes.',
        btnColor: 'bg-[#ceaa82] hover:bg-[#ceaa82]/90 text-white',
        exibirBotao: true,
        opacity: 'opacity-100'
      };
    } else if (s === 'atenção' || s === 'atencao') {
      return {
        border: 'border-[#ffe599]',
        badgeBg: 'bg-[#ffe599]/20 text-[#614B15]',
        badgeText: 'Atenção (50%)',
        barWidth: '50%',
        barBg: 'bg-[#ffe599]',
        textIcon: 'fa-clock text-[#C69C24]',
        textoStatus: 'Estoque moderado. Apoie para não faltar.',
        btnColor: 'bg-[#ffe599] hover:bg-[#ffe599]/90 text-[#614B15]',
        exibirBotao: true,
        opacity: 'opacity-100'
      };
    }
    return {
      border: 'border-[#A2D1A6]',
      badgeBg: 'bg-[#A2D1A6]/20 text-[#2D5331]',
      badgeText: 'Ok (100%)',
      barWidth: '100%',
      barBg: 'bg-[#A2D1A6]',
      textIcon: 'fa-circle-check text-[#2D5331]',
      textoStatus: 'Consumo totalmente garantido para este mês.',
      btnColor: 'hidden',
      exibirBotao: false,
      opacity: 'opacity-80'
    };
  };

  const instituicoesFiltradas = instituicoes.filter(inst => {
    const termo = busca.toLowerCase();
    return (
      inst.nome_instituicao.toLowerCase().includes(termo) ||
      inst.bairro.toLowerCase().includes(termo) ||
      inst.categoria.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="bg-slate-100 font-sans min-h-screen flex justify-center items-start p-0 sm:p-4 relative">
      
      {/* Simulador de Celular */}
      <div className="w-full max-w-md bg-[#faf5f0] min-h-screen sm:min-h-[850px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/80 relative">
        
        {/* TELA DE CARREGAMENTO CENTRALIZADA COM O LOGO OFICIAL SVG */}
        {carregando ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#faf5f0] text-center select-none animate-fadeIn">
            
            {/* Ícone do Pin com Proporções Féis ao SVG Fornecido */}
            <div className="w-28 h-28 mb-4 relative flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                {/* Pin do Logo Original */}
                <path d="M20 3C13.37 3 8 8.37 8 15c0 9 12 21 12 21s12-12 12-21c0-6.63-5.37-12-12-12z" fill="#ceaa82" />
                
                {/* Coração Animado em Pulsação */}
                <g className="animate-heart-beat">
                  <path d="M20 19.35l-1.16-1.05C14.72 14.6 12 12.14 12 9.11c0-2.46 1.94-4.39 4.4-4.39 1.39 0 2.73.65 3.6 1.67.87-1.02 2.21-1.67 3.6-1.67 2.46 0 4.4 1.93 4.4 4.39 0 3.03-2.72 5.49-6.84 9.2L20 19.35z" fill="#faf5f0" />
                </g>
              </svg>
            </div>

            {/* Texto com Tipografia Idêntica ao Logo */}
            <h1 className="font-logo font-black text-3xl tracking-tighter text-[#ceaa82] mb-2 leading-none">
              Onde Ajudo?
            </h1>
            
            <p className="font-logo font-semibold text-xs text-[#8C6D4C] tracking-wide animate-pulse mt-1">
              Carregando informações...
            </p>

          </div>
        ) : (
          <>
            {/* HEADER */}
            <header className="bg-white border-b border-[#ceaa82]/25 text-[#3E3327] px-4 py-3.5 flex items-center justify-between shadow-xs shrink-0 z-10">
              <div className="flex items-center gap-2">
                {instituicaoSelecionada ? (
                  <button 
                    onClick={() => setInstituicaoSelecionada(null)}
                    className="mr-2 text-[#3E3327] hover:text-[#ceaa82] transition text-sm font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                    <span>Voltar</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 40 40" className="w-8 h-8 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 3C13.37 3 8 8.37 8 15c0 9 12 21 12 21s12-12 12-21c0-6.63-5.37-12-12-12z" fill="#ceaa82" />
                      <g transform="translate(4.1, 6) scale(0.8)">
                        <path d="M20 19.35l-1.16-1.05C14.72 14.6 12 12.14 12 9.11c0-2.46 1.94-4.39 4.4-4.39 1.39 0 2.73.65 3.6 1.67.87-1.02 2.21-1.67 3.6-1.67 2.46 0 4.4 1.93 4.4 4.39 0 3.03-2.72 5.49-6.84 9.2L20 19.35z" fill="#faf5f0" />
                      </g>
                    </svg>
                    <div className="flex flex-col">
                      <h1 className="font-logo font-black tracking-tighter text-[20px] leading-none text-[#ceaa82]">Onde Ajudo?</h1>
                    </div>
                  </div>
                )}
              </div>
              <span className="bg-[#ceaa82]/15 text-[#8C6D4C] text-xs px-3 py-1 rounded-full font-bold">
                <i className="fa-solid fa-location-dot mr-1"></i>
                {instituicoes[0] ? `${instituicoes[0].cidade} - ${instituicoes[0].estado}` : 'SP'}
              </span>
            </header>

            {/* CONTEÚDO */}
            <main className="flex-1 overflow-y-auto p-4">
              {!instituicaoSelecionada ? (
                
                /* TELA 1: LISTAGEM */
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="text" 
                      placeholder="Buscar por nome, bairro ou categoria..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full bg-white border border-[#ceaa82]/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#3E3327] focus:outline-none focus:ring-2 focus:ring-[#ceaa82]/40 focus:border-[#ceaa82] transition shadow-xs"
                    />
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-[#8C6D4C] uppercase tracking-wider">
                      Instituições Cadastradas ({instituicoesFiltradas.length})
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {instituicoesFiltradas.length > 0 ? (
                      instituicoesFiltradas.map((inst) => {
                        const totalNec = obterNecessidadesDaInstituicao(inst.id).length;
                        const fotoExibicao = inst.foto_url && inst.foto_url.trim() !== "" 
                          ? inst.foto_url 
                          : "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200&h=200";

                        return (
                          <div 
                            key={inst.id}
                            onClick={() => setInstituicaoSelecionada(inst)}
                            className="bg-white rounded-2xl p-3.5 border border-[#ceaa82]/10 hover:border-[#ceaa82]/40 shadow-xs flex gap-3.5 items-center cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                          >
                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                              <img 
                                src={fotoExibicao} 
                                alt={inst.nome_instituicao}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200&h=200";
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0 py-0.5">
                              <span className="inline-block bg-[#ceaa82]/10 text-[#8C6D4C] text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1.5">
                                {inst.categoria}
                              </span>
                              <h3 className="text-[15px] font-bold text-[#3E3327] leading-snug truncate">
                                {inst.nome_instituicao}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                <i className="fa-solid fa-map-pin mr-1 text-[#ceaa82]"></i> Bairro: {inst.bairro}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2.5">
                                <span className="text-[11px] font-bold text-[#ceaa82]">
                                  <i className="fa-solid fa-circle-info mr-1"></i> Ver detalhes
                                </span>
                                {totalNec > 0 && (
                                  <span className="bg-[#ea9999]/15 text-[#5C1D1B] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                    {totalNec} {totalNec === 1 ? 'item pendente' : 'itens pendentes'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-slate-300 pr-1">
                              <i className="fa-solid fa-chevron-right text-sm text-[#ceaa82]/60"></i>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs italic">
                        Nenhuma instituição encontrada para sua busca. 🔍
                      </div>
                    )}
                  </div>

                  {/* Banner de Incentivo a Compartilhamento do Site */}
                  <div className="bg-[#ceaa82]/10 border border-[#ceaa82]/20 rounded-2xl p-4 text-center mt-6">
                    <span className="text-xl mb-1 block">🌟</span>
                    <h4 className="text-xs font-bold text-[#3E3327] mb-1">Gostou da nossa iniciativa?</h4>
                    <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                      Ajude a fortalecer o bem em nossa região divulgando o app para seus amigos e familiares!
                    </p>
                    <button
                      onClick={compartilharSiteGeral}
                      className="bg-[#ceaa82] hover:bg-[#ceaa82]/90 text-white text-xs font-bold py-2 px-4 rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <i className="fa-brands fa-whatsapp text-sm"></i> Compartilhar Onde Ajudo?
                    </button>
                  </div>

                </div>

              ) : (
                
                /* TELA 2: DETALHES */
                <div className="space-y-5 animate-fadeIn">
                  
                  <button 
                    onClick={() => setInstituicaoSelecionada(null)}
                    className="bg-white border border-[#ceaa82]/25 text-[#3E3327] px-3.5 py-2 rounded-full text-xs font-bold shadow-xs hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left"></i> Voltar para Lista
                  </button>

                  <div className="bg-white rounded-2xl p-4 border border-[#ceaa82]/10 shadow-sm">
                    
                    <div className="flex gap-4 items-start mb-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                        <img 
                          src={instituicaoSelecionada.foto_url && instituicaoSelecionada.foto_url.trim() !== "" 
                            ? instituicaoSelecionada.foto_url 
                            : "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=200&h=200"} 
                          alt={instituicaoSelecionada.nome_instituicao}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="bg-[#ceaa82]/10 text-[#8C6D4C] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          {instituicaoSelecionada.categoria}
                        </span>
                        <h2 className="text-lg font-extrabold text-[#3E3327] leading-tight mt-1 truncate">{instituicaoSelecionada.nome_instituicao}</h2>
                        <p className="text-xs font-bold text-[#ceaa82] mt-1">
                          <i className="fa-solid fa-map-pin mr-1"></i>Bairro: {instituicaoSelecionada.bairro}
                        </p>
                      </div>
                    </div>

                    {instituicaoSelecionada.publico_alvo && (
                      <div className="mb-4">
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-md">
                          <i className="fa-solid fa-users mr-1"></i> Atende: {instituicaoSelecionada.capacidade_atendimento} {instituicaoSelecionada.publico_alvo}
                        </span>
                      </div>
                    )}

                    {instituicaoSelecionada.descricao_breve && (
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {instituicaoSelecionada.descricao_breve}
                      </p>
                    )}
                    
                    {/* Grade Simétrica de 3 Colunas x 2 Linhas */}
                    <div className="grid grid-cols-3 gap-2">
                      
                      {/* Item 1: Instagram */}
                      {instituicaoSelecionada.link_instagram ? (
                        <a href={instituicaoSelecionada.link_instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 p-2 rounded-xl hover:bg-slate-50 transition shadow-xs text-pink-600 text-center min-h-[58px]">
                          <i className="fa-brands fa-instagram text-base"></i>
                          <span className="text-[10px] font-extrabold text-slate-700 leading-none">Instagram</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 opacity-40 border border-slate-200/60 p-2 rounded-xl text-slate-400 text-center min-h-[58px]">
                          <i className="fa-brands fa-instagram text-base"></i>
                          <span className="text-[10px] font-bold leading-none">Instagram</span>
                        </div>
                      )}

                      {/* Item 2: Facebook */}
                      {instituicaoSelecionada.link_facebook ? (
                        <a href={instituicaoSelecionada.link_facebook} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 p-2 rounded-xl hover:bg-slate-50 transition shadow-xs text-blue-800 text-center min-h-[58px]">
                          <i className="fa-brands fa-facebook text-base"></i>
                          <span className="text-[10px] font-extrabold text-slate-700 leading-none">Facebook</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 opacity-40 border border-slate-200/60 p-2 rounded-xl text-slate-400 text-center min-h-[58px]">
                          <i className="fa-brands fa-facebook text-base"></i>
                          <span className="text-[10px] font-bold leading-none">Facebook</span>
                        </div>
                      )}

                      {/* Item 3: Website */}
                      {instituicaoSelecionada.link_site ? (
                        <a href={instituicaoSelecionada.link_site} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 p-2 rounded-xl hover:bg-slate-50 transition shadow-xs text-blue-600 text-center min-h-[58px]">
                          <i className="fa-solid fa-globe text-base"></i>
                          <span className="text-[10px] font-extrabold text-slate-700 leading-none">Website</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 opacity-40 border border-slate-200/60 p-2 rounded-xl text-slate-400 text-center min-h-[58px]">
                          <i className="fa-solid fa-globe text-base"></i>
                          <span className="text-[10px] font-bold leading-none">Website</span>
                        </div>
                      )}

                      {/* Item 4: Telefone Fixo */}
                      {instituicaoSelecionada.telefone_fixo ? (
                        <a 
                          href={`tel:${instituicaoSelecionada.telefone_fixo.replace(/\D/g, '')}`} 
                          className="flex flex-col items-center justify-center gap-1 bg-white border border-[#ceaa82]/30 hover:bg-[#ceaa82]/5 text-[#8C6D4C] p-2 rounded-xl transition shadow-xs text-center min-h-[58px]"
                        >
                          <i className="fa-solid fa-phone text-sm text-slate-600"></i>
                          <span className="text-[10px] font-extrabold leading-none">Telefone</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 opacity-40 border border-slate-200/60 p-2 rounded-xl text-slate-400 text-center min-h-[58px]">
                          <i className="fa-solid fa-phone text-sm"></i>
                          <span className="text-[10px] font-bold leading-none">Telefone</span>
                        </div>
                      )}

                      {/* Item 5: WhatsApp */}
                      {instituicaoSelecionada.whatsapp_contato ? (
                        <a 
                          href={`https://api.whatsapp.com/send?phone=55${instituicaoSelecionada.whatsapp_contato.replace(/\D/g, '')}&text=Olá! Encontrei vocês no Onde Ajudo? e gostaria de apoiar.`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex flex-col items-center justify-center gap-1 bg-white border border-[#ceaa82]/30 hover:bg-[#ceaa82]/5 text-[#8C6D4C] p-2 rounded-xl transition shadow-xs text-center min-h-[58px]"
                        >
                          <i className="fa-brands fa-whatsapp text-lg text-emerald-600"></i>
                          <span className="text-[10px] font-extrabold leading-none">WhatsApp</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 opacity-40 border border-slate-200/60 p-2 rounded-xl text-slate-400 text-center min-h-[58px]">
                          <i className="fa-brands fa-whatsapp text-lg"></i>
                          <span className="text-[10px] font-bold leading-none">WhatsApp</span>
                        </div>
                      )}

                      {/* Item 6: Chave PIX */}
                      {instituicaoSelecionada.chave_pix ? (
                        <button 
                          onClick={() => copiarParaClipBoard(instituicaoSelecionada.chave_pix, instituicaoSelecionada.beneficiario_pix)} 
                          className="flex flex-col items-center justify-center gap-1 bg-[#ceaa82]/10 hover:bg-[#ceaa82]/20 transition shadow-xs text-[#8C6D4C] cursor-pointer p-2 rounded-xl border border-[#ceaa82]/20 text-center min-h-[58px]"
                        >
                          <i className="fa-solid fa-copy text-sm"></i>
                          <span className="text-[10px] font-extrabold leading-none">Chave PIX</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 opacity-40 border border-slate-200/60 p-2 rounded-xl text-slate-400 text-center min-h-[58px]">
                          <i className="fa-solid fa-copy text-sm"></i>
                          <span className="text-[10px] font-bold leading-none">Sem PIX</span>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Termômetros de Necessidades */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6D4C] mb-3 flex items-center gap-1.5">
                      <i className="fa-solid fa-list-check text-[#ceaa82]"></i> Termômetro de Necessidades
                    </h3>
                    
                    <div className="space-y-4">
                      {obterNecessidadesDaInstituicao(instituicaoSelecionada.id).length > 0 ? (
                        obterNecessidadesDaInstituicao(instituicaoSelecionada.id).map((nec) => {
                          const config = obterConfigUrgencia(nec.status_urgencia);
                          
                          const temWhats = instituicaoSelecionada.whatsapp_contato && instituicaoSelecionada.whatsapp_contato.trim() !== "";
                          const linkAcaoDoar = temWhats
                            ? `https://api.whatsapp.com/send?phone=55${instituicaoSelecionada.whatsapp_contato.replace(/\D/g, '')}&text=Olá! Vi no Onde Ajudo? e quero ajudar a doar o item: *${nec.item_nome}* (${nec.especificacoes || 'Sem especificações'})`
                            : (instituicaoSelecionada.telefone_fixo ? `tel:${instituicaoSelecionada.telefone_fixo.replace(/\D/g, '')}` : '#');
                          
                          return (
                            <div key={nec.id} className={`bg-white border-l-4 ${config.border} rounded-xl p-3.5 shadow-xs border border-slate-100 ${config.opacity}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-[#3E3327] text-sm">{nec.item_nome}</span>
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider ${config.badgeBg}`}>
                                  {config.badgeText}
                                </span>
                              </div>
                              
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2.5">
                                <div className={`${config.barBg} h-full rounded-full transition-all duration-500`} style={{ width: config.barWidth }}></div>
                              </div>
                              
                              <p className="text-xs text-slate-500 mb-3">
                                <i className={`fa-solid ${config.textIcon} mr-1`}></i>
                                {nec.especificacoes ? `(${nec.especificacoes}) ` : ''}{config.textoStatus}
                              </p>

                              {config.exibirBotao && (
                                <div className="grid grid-cols-5 gap-2">
                                  <a 
                                    href={linkAcaoDoar}
                                    target={temWhats ? "_blank" : undefined}
                                    rel={temWhats ? "noreferrer" : undefined}
                                    className="col-span-4 text-center bg-[#ffe599] hover:bg-[#ffe599]/90 text-[#614B15] font-bold py-2.5 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                                  >
                                    {temWhats ? (
                                      <>
                                        <i className="fa-brands fa-whatsapp text-sm"></i>
                                        <span>Quero Doar Este Item</span>
                                      </>
                                    ) : (
                                      <>
                                        <i className="fa-solid fa-phone text-xs"></i>
                                        <span>Ligar para Doar</span>
                                      </>
                                    )}
                                  </a>

                                  <button
                                    onClick={() => compartilharNecessidade(instituicaoSelecionada.nome_instituicao, nec.item_nome, nec.especificacoes)}
                                    className="col-span-1 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-500 rounded-lg flex items-center justify-center cursor-pointer transition shadow-xs"
                                    title="Compartilhar Necessidade"
                                  >
                                    <i className="fa-solid fa-share-nodes text-xs"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs italic">
                          Nenhuma necessidade cadastrada no momento. ❤️
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Endereço / GPS */}
                  <div className="bg-[#3E3327] text-[#FDFBF7] rounded-2xl p-5 shadow-md space-y-4">
                    <div className="flex items-center gap-2 text-[#ceaa82] font-bold text-sm">
                      <i className="fa-solid fa-truck-ramp-box"></i>
                      <h4>Pontos de Entrega Física</h4>
                    </div>
                    <div className="text-xs space-y-2 leading-relaxed text-slate-300">
                      <p><strong className="text-white">Endereço:</strong> {instituicaoSelecionada.endereco_completo} - {instituicaoSelecionada.bairro}</p>
                      <p><strong className="text-white">Cidade:</strong> {instituicaoSelecionada.cidade} - {instituicaoSelecionada.estado}</p>
                    </div>
                    
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(instituicaoSelecionada.nome_instituicao + ', ' + instituicaoSelecionada.endereco_completo)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-[#524435] hover:bg-[#524435]/80 border border-[#ceaa82]/35 text-[#FDFBF7] font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <i className="fa-solid fa-location-arrow text-[#ceaa82]"></i> Traçar Rota no GPS / Mapas
                    </a>
                  </div>

                </div>
              )}
            </main>

            {/* FOOTER */}
            <footer className="w-full bg-[#3E3327] border-t border-[#524435] px-4 py-3 text-center shrink-0">
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                Desenvolvido com ❤️ para nossa região
              </p>
              <a 
                href="mailto:ondeajudo@gmail.com" 
                className="text-[11px] text-[#ceaa82] hover:underline font-bold inline-flex items-center gap-1 mt-0.5"
              >
                <i className="fa-regular fa-envelope text-[10px]"></i> ondeajudo@gmail.com
              </a>
            </footer>
          </>
        )}

        {/* TOAST DO PIX */}
        {toastConfig.visivel && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl text-center border border-slate-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                📋
              </div>
              <h3 className="text-sm font-bold text-[#3E3327] mb-1">Chave Copiada!</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                A chave PIX foi copiada. Ao colar no app do seu banco, confirme se o beneficiário é:
              </p>
              <div className="bg-[#faf5f0] border border-[#ceaa82]/30 rounded-xl p-3 mb-4">
                <span className="text-xs font-bold text-[#3E3327] block break-words">
                  {toastConfig.beneficiario}
                </span>
              </div>
              <button 
                onClick={fecharToast}
                className="w-full bg-[#ceaa82] hover:bg-[#ceaa82]/90 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Entendi e vou Confirmar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}