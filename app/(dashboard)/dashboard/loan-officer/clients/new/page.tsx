import CreateClientForm from '@/components/CreateClientForm'

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const type = params.type === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL'

  return <CreateClientForm type={type} mode="page" />
}
