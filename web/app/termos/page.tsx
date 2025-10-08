export const metadata = { title: "Termos de Uso - Personal Global" }

export default function Page() {
  return (
    <div className="container py-10 prose prose-slate max-w-3xl">
      <h1>Termos de Uso</h1>
      <p>Estes Termos de Uso regulam o acesso e utilização da plataforma Personal Global.</p>
      <h2>1. Aceite</h2>
      <p>Ao utilizar a plataforma, você concorda com estes Termos.</p>
      <h2>2. Conta</h2>
      <p>Você é responsável por manter a segurança da sua conta e credenciais.</p>
      <h2>3. Uso aceitável</h2>
      <p>É proibido utilizar o serviço para atividades ilícitas, abusivas ou que infrinjam direitos.</p>
      <h2>4. Privacidade</h2>
      <p>Consulte a nossa <a href="/privacidade">Política de Privacidade</a> para saber como tratamos seus dados.</p>
      <h2>5. Alterações</h2>
      <p>Podemos atualizar estes Termos a qualquer momento. A versão vigente será publicada nesta página.</p>
      <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString()}</p>
    </div>
  )
}


