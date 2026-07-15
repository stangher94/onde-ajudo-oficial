import { useEffect, useState } from 'react';

// Interfaces para tipagem dos dados
interface Instituicao {
  id: string;
  nome_instituicao: string;
  categoria: string;
  whatsapp_contato: string;
  link_instagram: string;
  link_facebook: string;
  chave_pix: string;
  beneficiario_pix: string;
  endereco_completo: string;
  bairro: string;
  cidade: string;
  estado: string;
  descricao_breve: string;
  capacidade_atendimento: string;
  publico_alvo: string;
}

interface Necessidade {
  id: string;
  instituicao_id: string;
  categoria: string;
  item_nome: string; // Nome correto de acordo com a planilha
  status_urgencia: string;
  especificacoes: string;
}

export default function App() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [necessidades, setNecessidades] = useState<Necessidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Estado para controlar o balão personalizado de PIX copiado
  const [mostrarToast, setMostrarToast] = useState(false);

  // Seus links do Google Sheets oficiais
  const URL_INSTITUICOES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaWeGht1cmXAtk0D5tpJmkgGIBSqWQ4vvu-guflduOTzpXZSAvfMblOfZGmxtXA-eijzP_ZdBFWPGB/pub?gid=0&single=true&output=csv";
  const URL_NECESSIDADES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSaWeGht1cmXAtk0D5tpJmkgGIBSqWQ4vvu-guflduOTzpXZSAvfMblOfZGmxtXA-eijzP_ZdBFWPGB/pub?gid=1406763821&single=true&output=csv";

  // INJEÇÃO DO TAILWIND E FONTAWESOME EM TEMPO REAL
  useEffect(() => {
    const scriptTailwind = document.createElement('script');
    scriptTailwind.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(scriptTailwind);

    const linkFontAwesome = document.createElement('link');
    linkFontAwesome.rel = "stylesheet";
    linkFontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(linkFontAwesome);

    return () => {
      document.head.removeChild(scriptTailwind);
      document.head.removeChild(linkFontAwesome);
    };
  }, []);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const resInst = await fetch(URL_INSTITUICOES);
        const textInst = await resInst.text();
        const dadosInst = interpretarCSV(textInst) as Instituicao[];

        const resNec = await fetch(URL_NECESSIDADES);
        const textNec = await resNec.text();
        const dadosNec = interpretarCSV(textNec) as Necessidade[];

        setInstituicoes(dadosInst.filter(i => i.nome_instituicao && i.id));
        setNecessidades(dadosNec.filter(n => n.item_nome && n.instituicao_id));
      } catch (error) {
        console.error("Erro ao conectar planilhas:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  function interpretarCSV(textoCsv: string): any[] {
    const linhas = textoCsv.split(/\r?\n/).filter(linha => linha.trim() !== "");
    if (linhas.length === 0) return [];

    const cabecalhos = linhas[0].split(',').map(c => c.replace(/"/g, '').trim().toLowerCase());

    return linhas.slice(1).map(linha => {
      const colunas: string[] = [];
      let valorAtual = '';
      let dentroDeAspas = false;

      for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
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

  const obterNecessidadesDaInstituicao = (idInst: string) => {
    const limpo = String(idInst).trim();
    return necessidades.filter(n => String(n.instituicao_id).trim() === limpo);
  };

  const copiarParaClipBoard = (pix: string) => {
    navigator.clipboard.writeText(pix);
    
    // Mostra o feedback visual moderno na tela e esconde depois de 2 segundos
    setMostrarToast(true);
    setTimeout(() => {
      setMostrarToast(false);
    }, 2000);
  };

  const obterConfigUrgencia = (status: string) => {
    const s = status?.toLowerCase().trim();
    if (s === 'crítico' || s === 'critico') {
      return {
        border: 'border-rose-500',
        badgeBg: 'bg-rose-50 text-rose-600',
        badgeText: 'Crítico (10%)',
        barWidth: '10%',
        barBg: 'bg-rose-500',
        textIcon: 'fa-circle-exclamation text-rose-500',
        textoStatus: 'Estoque crítico. Necessitamos de doações urgentes.',
        btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
        exibirBotao: true,
        opacity: 'opacity-100'
      };
    } else if (s === 'atenção' || s === 'atencao') {
      return {
        border: 'border-amber-500',
        badgeBg: 'bg-amber-50 text-amber-600',
        badgeText: 'Atenção (50%)',
        barWidth: '50%',
        barBg: 'bg-amber-500',
        textIcon: 'fa-clock text-amber-500',
        textoStatus: 'Estoque moderado. Apoie para não faltar.',
        btnColor: 'bg-amber-500 hover:bg-amber-600 text-white',
        exibirBotao: true,
        opacity: 'opacity-100'
      };
    }
    return {
      border: 'border-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-600',
      badgeText: 'Ok (100%)',
      barWidth: '100%',
      barBg: 'bg-emerald-500',
      textIcon: 'fa-circle-check text-emerald-500',
      textoStatus: 'Consumo totalmente garantido para este mês.',
      btnColor: 'hidden',
      exibirBotao: false,
      opacity: 'opacity-80'
    };
  };

  return (
    <div className="bg-slate-100 font-sans min-h-screen flex justify-center items-start p-0 sm:p-4 relative">
      
      {/* Simulador de Tela de Celular */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[850px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 relative">
        
        {/* Header Fixo */}
        <header className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-heart-circle-check text-xl text-emerald-200"></i>
            <h1 className="font-extrabold tracking-wide text-lg">Onde Ajudo?</h1>
          </div>
          <span className="bg-emerald-700 text-emerald-100 text-xs px-2.5 py-1 rounded-full font-medium">
            <i className="fa-solid fa-location-dot mr-1"></i>
            {instituicoes[0] ? `${instituicoes[0].cidade} - ${instituicoes[0].estado}` : 'Carregando...'}
          </span>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto p-4 space-y-5">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-sm font-semibold">Carregando dados das instituições...</p>
            </div>
          ) : (
            instituicoes.map((inst) => {
              const minhasNecessidades = obterNecessidadesDaInstituicao(inst.id);
              const linkWhats = `https://api.whatsapp.com/send?phone=55${inst.whatsapp_contato.replace(/\D/g, '')}&text=Olá! Gostaria de ajudar a instituição.`;
              const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inst.nome_instituicao + ', ' + inst.endereco_completo)}`;

              return (
                <div key={inst.id} className="space-y-5">
                  
                  {/* Card de Identificação */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">{inst.nome_instituicao}</h2>
                        <p className="text-sm font-semibold text-emerald-600">
                          <i className="fa-solid fa-map-pin mr-1"></i>Bairro: {inst.bairro}
                        </p>
                      </div>
                      {inst.publico_alvo && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md shrink-0">
                          {inst.capacidade_atendimento} {inst.publico_alvo}
                        </span>
                      )}
                    </div>
                    {inst.descricao_breve && (
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {inst.descricao_breve}
                      </p>
                    )}
                    
                    {/* Botões de Ação Rápida */}
                    <div className="grid grid-cols-3 gap-2">
                      {inst.link_instagram ? (
                        <a href={inst.link_instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center bg-white border border-slate-200 py-2 rounded-xl hover:bg-slate-100 transition shadow-sm text-pink-600">
                          <i className="fa-brands fa-instagram text-lg mb-0.5"></i>
                          <span className="text-[10px] font-bold text-slate-700">Instagram</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-slate-100 opacity-40 border border-slate-200 py-2 rounded-xl text-slate-400">
                          <i className="fa-brands fa-instagram text-lg mb-0.5"></i>
                          <span className="text-[10px] font-bold">Sem Instagram</span>
                        </div>
                      )}

                      <a href={linkWhats} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center bg-white border border-slate-200 py-2 rounded-xl hover:bg-slate-100 transition shadow-sm text-emerald-600">
                        <i className="fa-brands fa-whatsapp text-lg mb-0.5"></i>
                        <span className="text-[10px] font-bold text-slate-700">WhatsApp</span>
                      </a>

                      {inst.chave_pix ? (
                        <button onClick={() => copiarParaClipBoard(inst.chave_pix)} className="flex flex-col items-center justify-center bg-emerald-50 border border-emerald-200 py-2 rounded-xl hover:bg-emerald-100 transition shadow-sm text-emerald-700 cursor-pointer">
                          <i className="fa-solid fa-copy text-lg mb-0.5"></i>
                          <span className="text-[10px] font-bold text-emerald-800">Copiar PIX</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-slate-100 opacity-40 border border-slate-200 py-2 rounded-xl text-slate-400">
                          <i className="fa-solid fa-copy text-lg mb-0.5"></i>
                          <span className="text-[10px] font-bold">Sem PIX</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Termômetros */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <i className="fa-solid fa-list-check"></i> Termômetro de Necessidades
                    </h3>
                    
                    <div className="space-y-4">
                      {minhasNecessidades.length > 0 ? (
                        minhasNecessidades.map((nec) => {
                          const config = obterConfigUrgencia(nec.status_urgencia);
                          const linkDoacaoWhats = `https://api.whatsapp.com/send?phone=55${inst.whatsapp_contato.replace(/\D/g, '')}&text=Olá! Quero ajudar a doar o item: *${nec.item_nome}* (${nec.especificacoes || 'Sem especificações'})`;
                          
                          return (
                            <div key={nec.id} className={`bg-white border-l-4 ${config.border} rounded-xl p-3 shadow-xs border border-slate-100 ${config.opacity}`}>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-bold text-slate-800 text-sm">{nec.item_nome}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide ${config.badgeBg}`}>
                                  {config.badgeText}
                                </span>
                              </div>
                              
                              {/* Barra de Progresso */}
                              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-2">
                                <div className={`${config.barBg} h-full rounded-full transition-all duration-500`} style={{ width: config.barWidth }}></div>
                              </div>
                              
                              <p className="text-xs text-slate-500 mb-2.5">
                                <i className={`fa-solid ${config.textIcon} mr-1`}></i>
                                {nec.especificacoes ? `(${nec.especificacoes}) ` : ''}{config.textoStatus}
                              </p>

                              {config.exibirBotao && (
                                <a 
                                  href={linkDoacaoWhats}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`block text-center w-full ${config.btnColor} font-bold py-2.5 rounded-lg text-xs transition shadow-sm cursor-pointer`}
                                >
                                  Quero Doar Este Item
                                </a>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-400 text-xs italic">
                          Nenhuma necessidade cadastrada no momento. ❤️
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logística (Card Escuro) */}
                  <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 shadow-md space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <i className="fa-solid fa-truck-ramp-box"></i>
                      <h4>Pontos de Entrega Física</h4>
                    </div>
                    <div className="text-xs space-y-1.5 leading-relaxed text-slate-300">
                      <p><strong className="text-white">Endereço:</strong> {inst.endereco_completo} - {inst.bairro}</p>
                      <p><strong className="text-white">Cidade:</strong> {inst.cidade} - {inst.estado}</p>
                    </div>
                    <a 
                      href={linkMaps}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-location-arrow text-emerald-400"></i> Traçar Rota no GPS / Mapas
                    </a>
                  </div>

                </div>
              );
            })
          )}
        </main>

        {/* TOAST DE CONFIRMAÇÃO DE PIX COPIADO PREMIUM */}
        {mostrarToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-3 px-6 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 animate-bounce transition-all duration-300 z-50">
            <span className="text-emerald-400 text-sm">❤️</span> Chave PIX copiada com sucesso!
          </div>
        )}

      </div>
    </div>
  );
}