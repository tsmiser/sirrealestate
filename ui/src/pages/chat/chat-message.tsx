import { Conversation } from './types'
import DsMarkdown from 'ds-markdown'
import { useState } from 'react'
import { Box, Button, Card, CardContent, Fade, Typography } from '@mui/material'
import NiDuplicate from '@/icons/nexture/ni-duplicate'
import NiLike from '@/icons/nexture/ni-like'
import NiShare from '@/icons/nexture/ni-share'
import NiUnlike from '@/icons/nexture/ni-unlike'
import { cn } from '@/lib/utils'

type ChatMessageProps = {
  conversation: Conversation
  onAnimationEnd: () => void
  onAnimationStart: () => void
}

export default function ChatMessage({
  conversation,
  onAnimationEnd,
  onAnimationStart,
}: ChatMessageProps) {
  const [isAnimating, setIsAnimating] = useState(true)

  return (
    <Box key={conversation.id} className="w-full">
      <Card className={cn('w-full', conversation.type === 'User' && 'ms-auto max-w-xs md:max-w-lg')}>
        <CardContent className="relative">
          {conversation.type === 'AI' ? (
            <>
              <DsMarkdown
                answerType="answer"
                interval={10}
                onEnd={() => {
                  setIsAnimating(false)
                  onAnimationEnd()
                }}
                onStart={() => {
                  setIsAnimating(true)
                  onAnimationStart()
                }}
                disableTyping={!conversation.animate}
              >
                {conversation.message}
              </DsMarkdown>

              <Fade in={!isAnimating} timeout={{ enter: 200 }}>
                <Box className="mt-4 flex flex-row items-end gap-1">
                  <Button
                    size="tiny"
                    color="grey"
                    variant="pastel"
                    startIcon={<NiLike size="small" />}
                    className="[.active]:text-primary [.active]:bg-grey-25 hover:text-primary icon-only min-w-0 md:min-w-16"
                  />
                  <Button
                    size="tiny"
                    color="grey"
                    variant="pastel"
                    startIcon={<NiUnlike size="small" />}
                    className="[.active]:text-primary [.active]:bg-grey-25 hover:text-primary icon-only min-w-0 md:min-w-16"
                  />
                  <Button
                    size="tiny"
                    color="grey"
                    variant="pastel"
                    startIcon={<NiDuplicate size="small" />}
                    className="[.active]:text-primary [.active]:bg-grey-25 hover:text-primary icon-only min-w-0 md:min-w-16"
                    onClick={() => navigator.clipboard.writeText(conversation.message)}
                  />
                  <Button
                    size="tiny"
                    color="grey"
                    variant="pastel"
                    startIcon={<NiShare size="small" />}
                    className="[.active]:text-primary [.active]:bg-grey-25 hover:text-primary icon-only min-w-0 md:min-w-16"
                  />
                </Box>
              </Fade>
            </>
          ) : (
            <Typography variant="body1" className="whitespace-pre-line">
              {conversation.message}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
