import {
  EventName,
  MessageStatus,
  ExtensionType,
  ThreadMessage,
  events,
  ChatCompletionRole,
} from '@janhq/core'
import { ConversationalExtension, InferenceExtension } from '@janhq/core'
import { useAtomValue, useSetAtom } from 'jotai'
import { RefreshCcw, Copy, Trash2Icon, StopCircle } from 'lucide-react'

import { twMerge } from 'tailwind-merge'

import { toaster } from '@/containers/Toast'

import useSendChatMessage from '@/hooks/useSendChatMessage'

import { extensionManager } from '@/extension'
import {
  deleteMessageAtom,
  getCurrentChatMessagesAtom,
} from '@/helpers/atoms/ChatMessage.atom'
import { activeThreadAtom } from '@/helpers/atoms/Thread.atom'

const MessageToolbar = ({ message }: { message: ThreadMessage }) => {
  const deleteMessage = useSetAtom(deleteMessageAtom)
  const thread = useAtomValue(activeThreadAtom)
  const messages = useAtomValue(getCurrentChatMessagesAtom)
  const { resendChatMessage } = useSendChatMessage()

  const onStopInferenceClick = async () => {
    events.emit(EventName.OnInferenceStopped, {})

    setTimeout(() => {
      events.emit(EventName.OnMessageUpdate, {
        ...message,
        status: MessageStatus.Ready,
      })
    }, 300)
  }

  const onDeleteClick = async () => {
    deleteMessage(message.id ?? '')
    if (thread) {
      await extensionManager
        .get<ConversationalExtension>(ExtensionType.Conversational)
        ?.writeMessages(
          thread.id,
          messages.filter((msg) => msg.id !== message.id)
        )
    }
  }

  const onRegenerateClick = async () => {
    if (message.role !== ChatCompletionRole.User) {
      // Delete last response before regenerating
      await onDeleteClick()
    }
    resendChatMessage(message)
  }

  return (
    <div className={twMerge('flex flex-row items-center')}>
      <div className="flex overflow-hidden rounded-md border border-border bg-background/20">
        {message.status === MessageStatus.Pending && (
          <div
            className="cursor-pointer border-r border-border px-2 py-2 hover:bg-background/80"
            onClick={onStopInferenceClick}
          >
            <StopCircle size={14} />
          </div>
        )}
        {message.status !== MessageStatus.Pending &&
          message.id === messages[messages.length - 1]?.id && (
            <div
              className="cursor-pointer border-r border-border px-2 py-2 hover:bg-background/80"
              onClick={onRegenerateClick}
            >
              <RefreshCcw size={14} />
            </div>
          )}
        <div
          className="cursor-pointer border-r border-border px-2 py-2 hover:bg-background/80"
          onClick={() => {
            navigator.clipboard.writeText(message.content[0]?.text?.value ?? '')
            toaster({
              title: 'Copied to clipboard',
            })
          }}
        >
          <Copy size={14} />
        </div>
        {message.status === MessageStatus.Ready && (
          <div
            className="cursor-pointer px-2 py-2 hover:bg-background/80"
            onClick={onDeleteClick}
          >
            <Trash2Icon size={14} />
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageToolbar