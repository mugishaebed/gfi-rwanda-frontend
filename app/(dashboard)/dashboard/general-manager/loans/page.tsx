import LoanManagement from '@/components/LoanManagement'

interface PageProps {
  searchParams?: Promise<{ filter?: string }>
}

export default async function GMLoansPage({ searchParams }: PageProps) {
  const params = await searchParams

  return <LoanManagement role="GENERAL_MANAGER" initialFilter={params?.filter} />
}
