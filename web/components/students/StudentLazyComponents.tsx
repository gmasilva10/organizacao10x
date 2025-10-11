import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load de modais pesados
export const StudentRelationshipModalLazy = dynamic(
  () => import('./StudentRelationshipModal'),
  {
    loading: () => <Skeleton className="h-[600px] w-full" />,
    ssr: false
  }
)

export const StudentOccurrenceModalLazy = dynamic(
  () => import('./StudentOccurrenceModal'),
  {
    loading: () => <Skeleton className="h-[500px] w-full" />,
    ssr: false
  }
)

export const AnamneseInviteModalLazy = dynamic(
  () => import('./modals/AnamneseInviteModal'),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false
  }
)

