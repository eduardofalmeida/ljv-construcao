import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, Users, FileText, DollarSign, HardHat, X } from 'lucide-react'

const acoes = [
  { icon: Building2, label: 'Nova Obra', rota: '/admin/obras', cor: 'bg-blue-500' },
  { icon: Users, label: 'Novo Cliente', rota: '/admin/clientes', cor: 'bg-emerald-500' },
  { icon: FileText, label: 'Novo Orçamento', rota: '/admin/orcamentos', cor: 'bg-violet-500' },
  { icon: DollarSign, label: 'Nova Transação', rota: '/admin/financeiro', cor: 'bg-accent-500' },
  { icon: HardHat, label: 'Novo Funcionário', rota: '/admin/funcionarios', cor: 'bg-orange-500' },
]

export default function FabMenu() {
  const [aberto, setAberto] = useState(false)
  const navigate = useNavigate()

  const handleAcao = (rota: string) => {
    navigate(`${rota}?novo=1`)
    setAberto(false)
  }

  return (
    <>
      {/* Overlay */}
      {aberto && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setAberto(false)}
        />
      )}

      {/* FAB e submenu */}
      <div className="fixed bottom-24 lg:bottom-6 right-3 lg:right-6 z-50 flex flex-col items-end gap-3">
        {/* Ações */}
        {aberto && (
          <div className="flex flex-col items-end gap-2 animate-slide-up">
            {acoes.map((acao) => (
              <button
                key={acao.label}
                onClick={() => handleAcao(acao.rota)}
                className="flex items-center gap-3"
              >
                <span className="bg-white text-primary-800 text-sm font-semibold px-3 py-2.5 rounded-xl shadow-card whitespace-nowrap">
                  {acao.label}
                </span>
                <div className={`w-12 h-12 ${acao.cor} rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform`}>
                  <acao.icon size={20} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Botão principal */}
        <button
          onClick={() => setAberto(!aberto)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300
            ${aberto
              ? 'bg-primary-900 rotate-45 scale-110'
              : 'bg-accent-500 hover:bg-accent-600 hover:scale-110'
            }`}
        >
          {aberto ? <X size={24} className="text-white" /> : <Plus size={28} className="text-white" />}
        </button>
      </div>
    </>
  )
}
