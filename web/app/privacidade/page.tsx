export const metadata = { title: "Política de Privacidade - Personal Global" }

export default function Page() {
  return (
    <div className="container py-10 prose prose-slate max-w-3xl">
      <h1>Política de Privacidade</h1>
      <p>Explicamos aqui como coletamos, utilizamos e protegemos os seus dados pessoais.</p>
      <h2>1. Dados coletados</h2>
      <p>Coletamos dados de cadastro, uso da plataforma e comunicações necessárias à prestação do serviço.</p>
      <h2>2. Finalidades</h2>
      <p>Utilizamos os dados para autenticação, operação do serviço, comunicação e melhorias.</p>
      <h2>3. Compartilhamento</h2>
      <p>Poderemos compartilhar dados com provedores estritamente necessários para a execução do serviço.</p>
      <h2>4. Direitos do titular</h2>
      <p>Você pode solicitar acesso, correção, portabilidade e exclusão conforme legislação aplicável.</p>
      <h2>5. Segurança</h2>
      <p>Adotamos medidas técnicas e organizacionais para proteger os dados contra acessos não autorizados.</p>
      <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString()}</p>
    </div>
  )
}


