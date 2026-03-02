import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Typography,
} from '@mui/material'
import { useLayoutContext } from '@/components/layout/layout-context'
import { useSidebarRefresh } from '@/components/layout/sidebar-refresh-context'
import NiMessage from '@/icons/nexture/ni-message'
import NiUser from '@/icons/nexture/ni-user'
import NiSearch from '@/icons/nexture/ni-search'
import NiCalendar from '@/icons/nexture/ni-calendar'
import NiListSquare from '@/icons/nexture/ni-list-square'
import NiDuplicate from '@/icons/nexture/ni-duplicate'
import NiMenuSplit from '@/icons/nexture/ni-menu-split'
import NiChevronRightSmall from '@/icons/nexture/ni-chevron-right-small'
import ProfilePanel from '@/components/sidebar/ProfilePanel'
import SearchProfileCard from '@/components/sidebar/SearchProfileCard'
import ViewingCard from '@/components/sidebar/ViewingCard'
import DocumentPanel from '@/components/sidebar/DocumentPanel'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useSearchResults } from '@/hooks/useSearchResults'
import { useViewings } from '@/hooks/useViewings'
import { useDocuments } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'

export default function LeftMenu() {
  const { sidebarOpen, sidebarWidth } = useLayoutContext()
  const { registerProfileRefetch, registerSearchResultsRefetch, registerDocumentsRefetch } = useSidebarRefresh()
  const { profile, refetch: refetchProfile } = useUserProfile()
  const { grouped, refetch: refetchSearchResults } = useSearchResults()
  const { viewings, refetch: refetchViewings } = useViewings()
  const { documents, refetch: refetchDocuments } = useDocuments()

  // Register refetch callbacks so ChatPage can trigger them
  useEffect(() => {
    registerProfileRefetch(refetchProfile)
  }, [registerProfileRefetch, refetchProfile])

  useEffect(() => {
    registerSearchResultsRefetch(refetchSearchResults)
  }, [registerSearchResultsRefetch, refetchSearchResults])

  useEffect(() => {
    registerDocumentsRefetch(refetchDocuments)
  }, [registerDocumentsRefetch, refetchDocuments])

  // Initial data fetch when sidebar opens
  useEffect(() => {
    if (!sidebarOpen) return
    refetchProfile()
    refetchSearchResults()
    refetchViewings()
    refetchDocuments()
  }, [sidebarOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <nav
      className={cn(
        'bg-background-paper shadow-darker-xs fixed z-10 mt-20 flex h-[calc(100%-5rem)] flex-col overflow-hidden rounded-e-4xl transition-all duration-(--layout-duration)',
      )}
      style={{ width: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
    >
      <Box
        className="flex h-full flex-col gap-0.5 overflow-y-auto px-4 py-2.5"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Chat nav link */}
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            cn(
              'flex flex-row items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-grey-50 hover:text-text-primary',
            )
          }
        >
          <NiMessage size="medium" />
          <Typography variant="body2" component="span" className="font-medium">
            Chat
          </Typography>
        </NavLink>

        <Divider className="my-1" />

        {/* My Profile section */}
        <Accordion
          defaultExpanded
          elevation={0}
          disableGutters
          className="before:hidden"
          sx={{ backgroundColor: 'transparent' }}
        >
          <AccordionSummary
            expandIcon={<NiChevronRightSmall size="small" className="accordion-rotate" />}
            className="min-h-0 px-2 py-2"
            sx={{ flexDirection: 'row-reverse', gap: 0.5 }}
          >
            <Box className="flex items-center gap-2">
              <NiUser size="small" />
              <Typography variant="h6" className="text-primary text-sm font-semibold">
                My Profile
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className="px-2 pb-3 pt-0">
            <ProfilePanel profile={profile} />
          </AccordionDetails>
        </Accordion>

        {/* My Searches section */}
        <Accordion
          defaultExpanded
          elevation={0}
          disableGutters
          className="before:hidden"
          sx={{ backgroundColor: 'transparent' }}
        >
          <AccordionSummary
            expandIcon={<NiChevronRightSmall size="small" className="accordion-rotate" />}
            className="min-h-0 px-2 py-2"
            sx={{ flexDirection: 'row-reverse', gap: 0.5 }}
          >
            <Box className="flex items-center gap-2">
              <NiSearch size="small" />
              <Typography variant="h6" className="text-primary text-sm font-semibold">
                My Searches
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className="flex flex-col gap-1 px-2 pb-3 pt-0">
            {!profile || profile.searchProfiles.length === 0 ? (
              <Typography variant="caption" className="text-text-secondary px-2.5 italic">
                Start a search in chat →
              </Typography>
            ) : (
              profile.searchProfiles.map((sp) => (
                <SearchProfileCard
                  key={sp.profileId}
                  profile={sp}
                  results={grouped[sp.profileId] ?? []}
                />
              ))
            )}
          </AccordionDetails>
        </Accordion>

        {/* My Documents section */}
        <Accordion
          defaultExpanded
          elevation={0}
          disableGutters
          className="before:hidden"
          sx={{ backgroundColor: 'transparent' }}
        >
          <AccordionSummary
            expandIcon={<NiChevronRightSmall size="small" className="accordion-rotate" />}
            className="min-h-0 px-2 py-2"
            sx={{ flexDirection: 'row-reverse', gap: 0.5 }}
          >
            <Box className="flex items-center gap-2">
              <NiListSquare size="small" />
              <Typography variant="h6" className="text-primary text-sm font-semibold">
                My Documents
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className="px-2 pb-3 pt-0">
            <DocumentPanel documentList={documents} />
          </AccordionDetails>
        </Accordion>

        {/* My Viewings section */}
        <Accordion
          defaultExpanded
          elevation={0}
          disableGutters
          className="before:hidden"
          sx={{ backgroundColor: 'transparent' }}
        >
          <AccordionSummary
            expandIcon={<NiChevronRightSmall size="small" className="accordion-rotate" />}
            className="min-h-0 px-2 py-2"
            sx={{ flexDirection: 'row-reverse', gap: 0.5 }}
          >
            <Box className="flex items-center gap-2">
              <NiCalendar size="small" />
              <Typography variant="h6" className="text-primary text-sm font-semibold">
                My Viewings
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className="flex flex-col gap-1.5 px-2 pb-3 pt-0">
            {viewings.length === 0 ? (
              <Typography variant="caption" className="text-text-secondary px-2.5 italic">
                Schedule a viewing through chat →
              </Typography>
            ) : (
              viewings.map((v) => <ViewingCard key={v.viewingId} viewing={v} />)
            )}
          </AccordionDetails>
        </Accordion>

        {/* My Offers section (placeholder) */}
        <Accordion
          elevation={0}
          disableGutters
          className="before:hidden"
          sx={{ backgroundColor: 'transparent' }}
        >
          <AccordionSummary
            expandIcon={<NiChevronRightSmall size="small" className="accordion-rotate" />}
            className="min-h-0 px-2 py-2"
            sx={{ flexDirection: 'row-reverse', gap: 0.5 }}
          >
            <Box className="flex items-center gap-2">
              <NiDuplicate size="small" />
              <Typography variant="h6" className="text-primary text-sm font-semibold">
                My Offers
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className="px-2 pb-3 pt-0">
            <Typography variant="caption" className="text-text-secondary px-2.5 italic">
              Coming soon
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* My Home section (placeholder) */}
        <Accordion
          elevation={0}
          disableGutters
          className="before:hidden"
          sx={{ backgroundColor: 'transparent' }}
        >
          <AccordionSummary
            expandIcon={<NiChevronRightSmall size="small" className="accordion-rotate" />}
            className="min-h-0 px-2 py-2"
            sx={{ flexDirection: 'row-reverse', gap: 0.5 }}
          >
            <Box className="flex items-center gap-2">
              <NiMenuSplit size="small" />
              <Typography variant="h6" className="text-primary text-sm font-semibold">
                My Home
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails className="px-2 pb-3 pt-0">
            <Typography variant="caption" className="text-text-secondary px-2.5 italic">
              Coming soon
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </nav>
  )
}
