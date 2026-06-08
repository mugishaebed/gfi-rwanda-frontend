import LoanManagement from '@/components/LoanManagement'

interface PageProps {
  searchParams?: Promise<{ filter?: string }>
}

export default async function LoansPage({ searchParams }: PageProps) {
  const params = await searchParams

  return <LoanManagement initialFilter={params?.filter} />
}
