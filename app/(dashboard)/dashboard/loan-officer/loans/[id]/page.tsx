import LoanDetailPage from '@/components/LoanDetailPage'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LoanDetailPage loanId={id} role="LOAN_OFFICER" />
}
