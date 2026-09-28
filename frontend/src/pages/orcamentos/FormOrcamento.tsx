import { useMemo, useRef, useState } from 'react'
import { Plus, Trash2, MessageCircle } from 'lucide-react'
import api from '../../services/api'
import ClienteSelect from '../../components/ui/ClienteSelect'
import { maskCurrency } from '../../utils/masks'
import type { ItemOrcamento, Orcamento, StatusOrcamento } from '../../types'
import { statusOrcamento } from '../../utils/orcamentoStatus'
import { telefoneWhatsApp } from '../../utils/whatsappOrcamento'
import toast from 'react-hot-toast'

const UNIDADES = ['vb', 'un', 'm²', 'm', 'm³', 'kg', 'h', 'pç', 'lt']

const FORMAS = ['PIX', 'Dinheiro', 'Transferência', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'Cheque']

function itemVazio(ordem: number): ItemOrcamento {
  return { descricao: '', observacao: '', unidade: 'vb', quantidade: 1, valorUnitario: 0, valorTotal: 0, ordem }
}

function parseMoeda(raw: string) {
  const digits = raw.replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

export default function FormOrcamento({ orcamento, onSalvar, onFechar }: {
  orcamento: Partial<Orcamento> | null
  onSalvar: (salvo: Orcamento, opcoes?: { whatsapp?: boolean }) => void
  onFechar: () => void
}) {
  const [form, setForm] = useState<Partial<Orcamento>>(() => ({
    status: 'RASCUNHO',
    desconto: 0,
    numeroParcelas: 1,
    entradaPercentual: 0,
    ...(orcamento || {}),
    itens: orcamento?.itens && orcamento.itens.length > 0 ? orcamento.itens : [itemVazio(0)],
  }))
  const [salvando, setSalvando] = useState(false)
  const enviarWhatsRef = useRef(false)

  const temWhats = !!telefoneWhatsApp(form.cliente)

  const set = (campo: keyof Orcamento, valor: unknown) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const itens = form.itens || []

  const atualizarItem = (idx: number, patch: Partial<ItemOrcamento>) => {
    setForm(f => {
      const lista = [...(f.itens || [])]
      const atual = { ...lista[idx], ...patch }
      const qtd = Number(atual.quantidade) || 0
      const unit = Number(atual.valorUnitario) || 0
      atual.valorTotal = Math.round(qtd * unit * 100) / 100
      lista[idx] = atual
      return { ...f, itens: lista }
    })
  }

  const adicionarItem = () => {
    setForm(f => ({ ...f, itens: [...(f.itens || []), itemVazio((f.itens || []).length)] }))
  }

  const removerItem = (idx: number) => {
    setForm(f => {
      const lista = (f.itens || []).filter((_, i) => i !== idx)
      return { ...f, itens: lista.length ? lista : [itemVazio(0)] }
    })
  }

  const subtotal = useMemo(
    () => itens.reduce((s, i) => s + (Number(i.valorTotal) || 0), 0),
    [itens]
  )
  const desconto = Number(form.desconto) || 0
  const total = Math.max(0, subtotal - desconto)

  const formasSel = (form.formaPagamento || '').split(',').map(s => s.trim()).filter(Boolean)

  const toggleForma = (forma: string) => {
    const seta = new Set(formasSel)
    if (seta.has(forma)) seta.delete(forma)
    else seta.add(forma)
    set('formaPagamento', Array.from(seta).join(','))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo?.trim()) return toast.error('Título é obrigatório')
    const itensValidos = itens.filter(i => i.descricao.trim())
    if (itensValidos.length === 0) return toast.error('Adicione pelo menos um item com descrição e valor')
    if (enviarWhatsRef.current && !temWhats) return toast.error('Cadastre o celular do cliente para enviar no WhatsApp')
    const enviarWhats = enviarWhatsRef.current
    setSalvando(true)
    try {
      const payload = {
        ...form,
        itens: itensValidos.map((i, ordem) => ({ ...i, ordem, id: undefined })),
        valorTotal: subtotal,
        desconto,
        valorFinal: total,
        cliente: form.cliente?.id ? {
          id: form.cliente.id,
          nome: form.cliente.nome,
          telefone: form.cliente.telefone,
          celular: form.cliente.celular,
          email: form.cliente.email,
        } : undefined,
      }
      const { data } = form.id
        ? await api.put<Orcamento>(`/orcamentos/${form.id}`, payload)
        : await api.post<Orcamento>('/orcamentos', payload)
      toast.success(form.id ? 'Orçamento atualizado!' : 'Orçamento criado!')
      onSalvar({ ...data, cliente: data.cliente || form.cliente, itens: data.itens || itensValidos }, { whatsapp: enviarWhats })
    } catch {
      toast.error('Erro ao salvar orçamento')
    } finally {
      setSalvando(false)
      enviarWhatsRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Título do orçamento *</label>
          <input className="input" placeholder="Ex: Reforma residencial — sala e cozinha" value={form.titulo || ''} onChange={e => set('titulo', e.target.value)} required />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'RASCUNHO'} onChange={e => set('status', e.target.value as StatusOrcamento)}>
            {(Object.keys(statusOrcamento) as StatusOrcamento[]).map(k => (
              <option key={k} value={k}>{statusOrcamento[k].label}</option>
            ))}
          </select>
          {form.status === 'APROVADO' && (
            <p className="text-xs text-emerald-600 mt-1">Ao salvar como Aceito, o sistema cria uma obra com este cliente e valor.</p>
          )}
        </div>
        <div>
          <label className="label">Validade da proposta</label>
          <input type="date" className="input" value={form.dataValidade || ''} onChange={e => set('dataValidade', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descrição geral</label>
          <textarea className="input min-h-[72px] resize-none" placeholder="Resumo do que será executado..." value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <ClienteSelect label="Cliente" value={form.cliente || null} onChange={(c) => set('cliente', c)} />
          {form.cliente && !telefoneWhatsApp(form.cliente) && (
            <p className="text-xs text-amber-600 mt-1">Cadastre o celular do cliente para enviar o PDF no WhatsApp.</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Local da obra / serviço</label>
          <input className="input" placeholder="Endereço onde o serviço será feito" value={form.localServico || ''} onChange={e => set('localServico', e.target.value)} />
        </div>
      </div>

      <div className="border-t border-stone-100 pt-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Itens do orçamento</h3>
          <button type="button" onClick={adicionarItem} className="btn-outline py-2 px-3 text-xs">
            <Plus size={14} /> Adicionar item
          </button>
        </div>
        <p className="text-xs text-primary-400 mb-3">Cada linha é um serviço ou material. O total é a soma de todos os itens.</p>

        <div className="space-y-3">
          {itens.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3 sm:p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-black text-primary-400 uppercase tracking-wider pt-1">Item {idx + 1}</span>
                <button type="button" onClick={() => removerItem(idx)} className="p-2 text-primary-300 hover:text-red-500 hover:bg-red-50 rounded-lg" aria-label="Remover item">
                  <Trash2 size={15} />
                </button>
              </div>
              <div>
                <label className="label">Descrição *</label>
                <input
                  className="input"
                  placeholder="Ex: Assentamento de porcelanato 60x60"
                  value={item.descricao}
                  onChange={e => atualizarItem(idx, { descricao: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Detalhe (opcional)</label>
                <input
                  className="input"
                  placeholder="Ex: Inclui argamassa, rejunte e mão de obra"
                  value={item.observacao || ''}
                  onChange={e => atualizarItem(idx, { observacao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="label">Unidade</label>
                  <select className="input" value={item.unidade || 'vb'} onChange={e => atualizarItem(idx, { unidade: e.target.value })}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Qtd</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={item.quantidade}
                    onChange={e => atualizarItem(idx, { quantidade: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Valor unit.</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary-400">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="input pl-8"
                      value={item.valorUnitario ? maskCurrency(item.valorUnitario) : ''}
                      onChange={e => atualizarItem(idx, { valorUnitario: parseMoeda(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Total</label>
                  <div className="input bg-white font-bold text-primary-900 flex items-center">
                    {maskCurrency(item.valorTotal || 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={adicionarItem} className="mt-3 w-full min-h-[44px] rounded-xl border-2 border-dashed border-stone-300 text-sm font-semibold text-primary-500 hover:border-accent-400 hover:text-accent-600">
          + Adicionar outro item
        </button>

        <div className="mt-4 rounded-2xl bg-primary-950 text-white p-4 space-y-2">
          <div className="flex justify-between text-sm text-white/70">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Desconto</label>
            <div className="relative max-w-[200px] ml-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/50">R$</span>
              <input
                type="text"
                inputMode="decimal"
                className="input pl-8 bg-white/10 border-white/10 text-white placeholder-white/30"
                placeholder="0,00"
                value={desconto ? maskCurrency(desconto) : ''}
                onChange={e => set('desconto', parseMoeda(e.target.value))}
              />
            </div>
          </div>
          <div className="flex justify-between items-end pt-2 border-t border-white/10">
            <span className="text-sm font-bold text-accent-400">Total do orçamento</span>
            <span className="text-2xl font-black text-accent-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-5 space-y-4">
        <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Condições e pagamento</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Prazo de execução</label>
            <input className="input" placeholder="Ex: 45 dias úteis" value={form.prazoExecucao || ''} onChange={e => set('prazoExecucao', e.target.value)} />
          </div>
          <div>
            <label className="label">Garantia</label>
            <input className="input" placeholder="Ex: 12 meses de mão de obra" value={form.garantia || ''} onChange={e => set('garantia', e.target.value)} />
          </div>
          <div>
            <label className="label">Entrada (%)</label>
            <input type="number" min="0" max="100" className="input" placeholder="Ex: 40" value={form.entradaPercentual ?? ''} onChange={e => set('entradaPercentual', e.target.value === '' ? undefined : Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Parcelas</label>
            <input type="number" min="1" className="input" placeholder="Ex: 3" value={form.numeroParcelas ?? ''} onChange={e => set('numeroParcelas', e.target.value === '' ? undefined : Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Formas de pagamento aceitas</label>
          <div className="flex flex-wrap gap-2">
            {FORMAS.map(forma => {
              const ativa = formasSel.includes(forma)
              return (
                <button
                  key={forma}
                  type="button"
                  onClick={() => toggleForma(forma)}
                  className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold border-2 transition-all ${
                    ativa ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 text-primary-500'
                  }`}
                >
                  {forma}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="label">Detalhes do pagamento</label>
          <textarea className="input min-h-[70px] resize-none" placeholder="Ex: 40% na assinatura, saldo em 3x no PIX a cada 15 dias" value={form.condicoesPagamento || ''} onChange={e => set('condicoesPagamento', e.target.value)} />
        </div>
        <div>
          <label className="label">O que está incluso</label>
          <textarea className="input min-h-[70px] resize-none" placeholder="Ex: Material, mão de obra, remoção de entulho" value={form.incluso || ''} onChange={e => set('incluso', e.target.value)} />
        </div>
        <div>
          <label className="label">O que não está incluso</label>
          <textarea className="input min-h-[70px] resize-none" placeholder="Ex: Mobiliário, cortinas, taxas de prefeitura" value={form.naoIncluso || ''} onChange={e => set('naoIncluso', e.target.value)} />
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input min-h-[70px] resize-none" value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Lembrar de acompanhar em</label>
            <input type="date" className="input" value={form.proximoFollowUp || ''} onChange={e => set('proximoFollowUp', e.target.value)} />
            <p className="text-xs text-primary-400 mt-1">No envio pelo WhatsApp, o sistema sugere 3 dias se ficar vazio.</p>
          </div>
          <div>
            <label className="label">Anotação de acompanhamento</label>
            <input className="input" placeholder="Ex: Cliente pediu desconto e vai responder sexta" value={form.notaAcompanhamento || ''} onChange={e => set('notaAcompanhamento', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="modal-actions flex-col sm:flex-row">
        <button type="button" onClick={onFechar} className="sm:flex-1 btn-outline min-h-[48px]">Cancelar</button>
        <button type="submit" disabled={salvando} onClick={() => { enviarWhatsRef.current = false }} className="sm:flex-1 btn-outline min-h-[48px]">
          {salvando && !enviarWhatsRef.current ? 'Salvando...' : form.id ? 'Atualizar' : 'Criar orçamento'}
        </button>
        <button
          type="submit"
          disabled={salvando}
          onClick={() => { enviarWhatsRef.current = true }}
          className="sm:flex-[1.3] btn-primary min-h-[48px]"
        >
          <MessageCircle size={16} />
          {salvando ? 'Preparando...' : 'Salvar e enviar no WhatsApp'}
        </button>
      </div>
    </form>
  )
}
