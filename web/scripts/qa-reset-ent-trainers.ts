import "dotenv/config"

const TENANT_ENT = "0f3ec75c-6eb9-4443-8c48-49eca6e6d00f"

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    console.error("Faltam variáveis: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const endpoint = `${url}/rest/v1/memberships?tenant_id=eq.${TENANT_ENT}&role=eq.trainer`
  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      Prefer: "return=representation",
    },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("Falha no reset:", res.status, body)
    process.exit(2)
  }

  const deleted = await res.json().catch(() => []) as Array<unknown>
  console.log(JSON.stringify({ ok: true, deletedCount: deleted.length }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(3)
})


