import { useFut } from '../estado/FutContext'

export function Recado() {
  const { recado } = useFut()
  if (!recado) return null
  return (
    <p className={`fut-recado ${recado.tipo === 'ok' ? 'fut-recado-ok' : 'fut-alerta'}`} role={recado.tipo === 'alerta' ? 'alert' : 'status'}>
      {recado.texto}
    </p>
  )
}
