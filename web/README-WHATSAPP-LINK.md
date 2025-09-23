# Configuração de URL pública para link no WhatsApp

Para que o link enviado ao WhatsApp seja clicável, a URL precisa ser pública (ou um IP da rede local) — `localhost` não vira hyperlink no WhatsApp.

## Variável de ambiente
Defina uma das seguintes variáveis (a aplicação resolve na ordem a seguir):

1. `NEXT_PUBLIC_PUBLIC_APP_URL`
2. `NEXT_PUBLIC_SITE_URL`
3. `NEXT_PUBLIC_APP_URL`

Recomendado em produção/staging (Vercel):

```env
NEXT_PUBLIC_PUBLIC_APP_URL=https://omarsoki.com
```

Em desenvolvimento (rede local), use seu IP local:

```env
NEXT_PUBLIC_PUBLIC_APP_URL=http://192.168.0.15:3000
```

> Dica: em Windows PowerShell, para descobrir o IP local:
>
> ```powershell
> (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual'}).IPAddress
> ```

## Onde setar no Vercel
- Vercel → Project → Settings → Environment Variables → Add:
  - Name: `NEXT_PUBLIC_PUBLIC_APP_URL`
  - Value: `https://omarsoki.com` (ou o domínio de produção)
  - Target: Production / Preview (conforme desejar)
- Faça o redeploy.

## Status no código
- O link público é gerado com base no valor resolvido acima. A mensagem do WhatsApp foi ajustada para deixar o link sozinho em uma linha (melhor compatibilidade com hyperlink).
