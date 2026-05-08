"use client"

import {
  FormEvent,
  type MouseEvent as ReactMouseEvent,
  type UIEvent as ReactUIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ArrowClockwiseIcon as ArrowClockwise,
  ArrowRightIcon as ArrowRight,
  ArrowSquareOutIcon as ArrowSquareOut,
  BrainIcon as Brain,
  CaretDownIcon as CaretDown,
  CheckIcon as Check,
  CopyIcon as Copy,
  CubeIcon as Cube,
  DesktopIcon as Desktop,
  DeviceMobileIcon as DeviceMobile,
  DeviceTabletIcon as DeviceTablet,
  FileTextIcon as FileText,
  FilesIcon as Files,
  FlaskIcon as FlaskConical,
  GearIcon as Settings,
  HammerIcon as Hammer,
  InfoIcon as Info,
  KeyboardIcon as Keyboard,
  ListChecksIcon as ListTodo,
  MagnifyingGlassIcon as Search,
  MonitorIcon as Monitor,
  MoonIcon as Moon,
  PencilIcon as Pencil,
  PlusIcon as Plus,
  ArrowUpIcon as ArrowUp,
  SidebarSimpleIcon as PanelLeftClose,
  SidebarSimpleIcon as PanelLeftOpen,
  SparkleIcon as Sparkles,
  SpinnerGapIcon as Loader2,
  StopIcon as Stop,
  SunIcon as Sun,
  TerminalWindowIcon as Terminal,
  TrashIcon as Trash2,
  type Icon as PhosphorIcon,
  WrenchIcon as Wrench,
} from "@phosphor-icons/react"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useToast } from "@/components/toast"
import {
  applyTheme,
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme"
import { cn } from "@/lib/utils"

type Session = {
  id: string
  previewUrl: string
  projectPath: string
  models: ModelCatalogItem[]
  user: CurrentUser | null
}

type CurrentUser = {
  name: string
  email?: string
}

type ModelCatalogItem = {
  id: string
  label: string
  description?: string
  parameters: ModelParameterConfig[]
  defaultParams: ModelParam[]
}

type ModelParameterConfig = {
  id: string
  label: string
  values: ModelParameterValue[]
}

type ModelParameterValue = {
  id: string
  label: string
}

type ModelParam = {
  id: string
  value: string
}

type ChatMessage = {
  id: string
  activityCount?: number
  activityGroupKey?: string
  activityIcon?: ActivityIcon
  activityKey?: string
  activityState?: ActivityState
  activitySymbol?: string
  activityTargets?: string[]
  activityType?: StreamPayload["type"]
  role: "activity" | "assistant" | "user" | "system"
  content: string
}

type ProjectNameMessage = {
  role: "assistant" | "user"
  content: string
}

type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  input: string
  model: string
  session: Session | null
}

type PersistedAppState = {
  version: 2
  activeConversationId: string
  conversations: Conversation[]
}

type ConversationRuntimeState = {
  isRunning: boolean
  isCreatingSession: boolean
  isCursorTyping: boolean
  sessionError: string | null
}

type StreamPayload =
  | { type: "assistant_delta"; text: string }
  | { type: "thinking"; id?: string; text: string }
  | {
      type: "tool_call"
      callId?: string
      name: string
      status: string
      args?: unknown
      truncatedArgs?: boolean
    }
  | { type: "status"; status: string; message?: string }
  | { type: "task"; status?: string; text?: string }

type ActivityDescriptor = {
  groupKey: string
  icon: ActivityIcon
  key?: string
  state?: ActivityState
  symbol: string
  targets?: string[]
  content: string
}

type ActivityState = "active" | "complete"

type ActivityIcon =
  | "read"
  | "search"
  | "glob"
  | "edit"
  | "delete"
  | "shell"
  | "test"
  | "build"
  | "thinking"
  | "status"
  | "task"
  | "default"

type ToolParamDisplay = {
  target?: string
  details: string
}

type ProjectContextMenuState = {
  conversationId: string
  x: number
  y: number
}

type PreviewDeviceSize = "mobile" | "tablet" | "desktop"

const PREVIEW_DEVICE_OPTIONS: ReadonlyArray<{
  id: PreviewDeviceSize
  label: string
  description: string
  icon: PhosphorIcon
  width: number | null
}> = [
  {
    id: "mobile",
    label: "Mobile",
    description: "390 × auto",
    icon: DeviceMobile,
    width: 390,
  },
  {
    id: "tablet",
    label: "Tablet",
    description: "820 × auto",
    icon: DeviceTablet,
    width: 820,
  },
  {
    id: "desktop",
    label: "Desktop",
    description: "Fill",
    icon: Monitor,
    width: null,
  },
]

const SAVED_CURSOR_API_KEY = "app-builder.cursor-api-key"
const SAVED_CHAT_STATE = "app-builder.chat-state"
const CHAT_WIDTH_DEFAULT = 400

const STARTER_PROMPTS: ReadonlyArray<{
  title: string
  prompt: string
}> = [
  {
    title: "Todo list",
    prompt:
      "Build a clean to-do list app. I should be able to add, complete, and delete tasks, and the list should persist across page reloads using localStorage.",
  },
  {
    title: "Markdown editor",
    prompt:
      "Build a split-pane markdown editor: a textarea on the left and a live HTML preview on the right. Support headings, bold/italic, lists, links, and code blocks.",
  },
  {
    title: "Pomodoro timer",
    prompt:
      "Build a Pomodoro timer with 25-minute work blocks and 5-minute breaks, a start/pause/reset control, and a counter for completed sessions.",
  },
  {
    title: "Tic-tac-toe",
    prompt:
      "Build a two-player tic-tac-toe game with a 3x3 board, a status line showing whose turn it is, win/draw detection, and a reset button.",
  },
  {
    title: "Color palette",
    prompt:
      "Build a color palette generator that shows five harmonious colors with hex codes, a button to regenerate, and click-to-copy on each swatch.",
  },
  {
    title: "Weather card",
    prompt:
      "Build a friendly weather widget that lets me type a city, then displays a mocked current temperature, condition, and a 3-day forecast in cards.",
  },
]
const GROUPED_FILE_TARGET_LIMIT = 4
const PROJECT_NAME_TIMEOUT_MS = 15_000
const SAVED_API_KEY_READY_MESSAGE =
  "Saved Cursor API key updated. The local preview is ready."
const fallbackModels: ModelCatalogItem[] = [
  {
    id: "auto",
    label: "Auto",
    parameters: [],
    defaultParams: [],
  },
  {
    id: "composer-2",
    label: "Composer 2",
    parameters: [],
    defaultParams: [],
  },
]
const fallbackModelSelection = encodeModelSelection({ id: fallbackModels[0].id })

export function AppBuilder() {
  const [initialAppState] = useState(readPersistedAppState)
  const [conversations, setConversations] = useState(
    initialAppState.conversations
  )
  const [activeConversationId, setActiveConversationId] = useState(
    initialAppState.activeConversationId
  )
  const [apiKey, setApiKey] = useState("")
  const [hasSavedApiKey, setHasSavedApiKey] = useState(false)
  const [runtimeByConversationId, setRuntimeByConversationId] = useState<
    Record<string, ConversationRuntimeState>
  >(() => {
    return {
      [initialAppState.activeConversationId]: createRuntimeState(),
    }
  })
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(true)
  const [isLogsPanelOpen, setIsLogsPanelOpen] = useState(false)
  const [previewRefreshCounter, setPreviewRefreshCounter] = useState(0)
  const [previewDeviceSize, setPreviewDeviceSize] =
    useState<PreviewDeviceSize>("desktop")
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => !isCursorApiKey(getSavedCursorApiKey() ?? "")
  )
  const [isApiKeySettingsOpen, setIsApiKeySettingsOpen] = useState(false)
  const [isApiKeyClearConfirming, setIsApiKeyClearConfirming] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const [titleGenerationConversationIds, setTitleGenerationConversationIds] =
    useState(() => new Set<string>())
  const [themePreference, setThemePreference] = useTheme()
  const { showToast } = useToast()
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const conversationsRef = useRef(conversations)
  const restoredConversationIdsRef = useRef(new Set<string>())
  const titleGenerationConversationIdsRef = useRef(new Set<string>())
  const abortControllersRef = useRef(new Map<string, AbortController>())
  const lastStreamEventTypeRef = useRef<
    Record<string, StreamPayload["type"] | null>
  >({})
  const activeConversation = useMemo(
    () =>
      getConversationById(conversations, activeConversationId) ??
      conversations[0] ??
      createEmptyConversation("Project 1"),
    [activeConversationId, conversations]
  )
  const activeRuntime =
    runtimeByConversationId[activeConversation.id] ?? createRuntimeState()
  const session = activeConversation.session
  const messages = activeConversation.messages
  const input = activeConversation.input
  const model = activeConversation.model
  const isRunning = activeRuntime.isRunning
  const isCreatingSession = activeRuntime.isCreatingSession
  const isCursorTyping = activeRuntime.isCursorTyping
  const sessionError = activeRuntime.sessionError
  const showProjectSetup = isCreatingSession && !session
  const availableModels = useMemo(
    () => ensureModelCatalog(session?.models),
    [session]
  )
  const sidebarConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations]
  )

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(async () => {
      if (cancelled) {
        return
      }

      const conversation = getConversationById(
        conversationsRef.current,
        activeConversationId
      )
      if (!conversation) {
        return
      }

      if (
        conversation.session &&
        restoredConversationIdsRef.current.has(conversation.id)
      ) {
        setIsOnboardingOpen(false)
        setConversationRuntime(conversation.id, (current) => ({
          ...current,
          isCursorTyping: false,
          isCreatingSession: false,
          sessionError: null,
        }))
        return
      }

      const savedApiKey = getSavedCursorApiKey()
      const restoredSessionId = conversation.session?.id
      const hasValidSavedApiKey = Boolean(
        savedApiKey && isCursorApiKey(savedApiKey)
      )
      const validSavedApiKey = hasValidSavedApiKey ? savedApiKey : undefined

      if (savedApiKey && !hasValidSavedApiKey) {
        window.localStorage.removeItem(SAVED_CURSOR_API_KEY)
      }

      setHasSavedApiKey(hasValidSavedApiKey)
      if (!validSavedApiKey) {
        setIsOnboardingOpen(true)
        setConversationRuntime(conversation.id, (current) => ({
          ...current,
          isCreatingSession: false,
          isCursorTyping: false,
          sessionError: null,
        }))
        return
      }

      setConversationRuntime(conversation.id, (current) => ({
        ...current,
        isCreatingSession: true,
        isCursorTyping: false,
        sessionError: null,
      }))

      try {
        const data = await requestSession(
          validSavedApiKey,
          restoredSessionId,
          { persistApiKey: hasValidSavedApiKey }
        )

        if (cancelled) {
          return
        }

        restoredConversationIdsRef.current.add(conversation.id)
        applySession(conversation.id, data)
        setIsOnboardingOpen(false)
        setHasSavedApiKey(true)
        setConversationRuntime(conversation.id, (current) => ({
          ...current,
          isCreatingSession: false,
          isCursorTyping: false,
          sessionError: null,
        }))
      } catch (error) {
        if (cancelled) {
          return
        }

        if (isMissingApiKeyError(error)) {
          setHasSavedApiKey(false)
          setIsOnboardingOpen(true)
          setConversationRuntime(conversation.id, (current) => ({
            ...current,
            isCreatingSession: false,
            isCursorTyping: false,
            sessionError: null,
          }))
          return
        }

        const message =
          error instanceof Error ? error.message : "Could not start preview."
        setHasSavedApiKey(true)
        setConversationRuntime(conversation.id, (current) => ({
          ...current,
          isCreatingSession: false,
          isCursorTyping: false,
          sessionError: message,
        }))
      } finally {
        if (!cancelled) {
          setConversationRuntime(conversation.id, (current) => ({
            ...current,
            isCreatingSession: false,
          }))
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
    // The restore pass is keyed only by active conversation; helper functions
    // intentionally read the latest state through refs inside the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [activeConversation.id, messages])

  useEffect(() => {
    writePersistedAppState({
      version: 2,
      activeConversationId,
      conversations: conversations.map((conversation) => ({
        ...conversation,
        messages: compactActivityMessages(conversation.messages),
      })),
    })
  }, [activeConversationId, conversations])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey
      if (!isMod) {
        return
      }

      const target = event.target
      const isInTextField =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)

      const key = event.key.toLowerCase()

      if (key === "/") {
        event.preventDefault()
        setIsShortcutsHelpOpen((current) => !current)
        return
      }

      if (key === "k" && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        chatInputRef.current?.focus()
        return
      }

      if (isInTextField) {
        return
      }

      if (key === "b" && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        setIsProjectSidebarOpen((current) => !current)
        return
      }

      if (!event.shiftKey) {
        return
      }

      if (key === "o") {
        event.preventDefault()
        if (hasSavedApiKey) {
          createConversation()
        } else {
          openOnboarding()
        }
        return
      }

      if (key === "l") {
        event.preventDefault()
        setIsLogsPanelOpen((current) => !current)
        return
      }

      if (key === "r") {
        event.preventDefault()
        setPreviewRefreshCounter((current) => current + 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // hasSavedApiKey/createConversation/openOnboarding are read via closures
    // and intentionally tracked through the dependency that affects them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSavedApiKey])

  useEffect(() => {
    for (const conversation of conversations) {
      if (
        !conversation.session ||
        !shouldGenerateProjectName(conversation) ||
        titleGenerationConversationIdsRef.current.has(conversation.id)
      ) {
        continue
      }

      const firstUserMessage = conversation.messages.find(
        (message) => message.role === "user"
      )
      if (!firstUserMessage?.content.trim()) {
        continue
      }

      void requestGeneratedConversationTitle(
        conversation.id,
        conversation.session.id,
        { prompt: firstUserMessage.content }
      )
    }
    // Title generation is triggered by conversation state; the request helper
    // has its own in-flight guard via titleGenerationConversationIdsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations])

  const canSubmit = useMemo(
    () => Boolean(session && input.trim() && !isRunning),
    [input, isRunning, session]
  )
  const visibleMessages = useMemo(() => compactActivityMessages(messages), [
    messages,
  ])
  const selectedModel = useMemo(
    () => getSelectedModel(availableModels, model),
    [availableModels, model]
  )

  function setConversationRuntime(
    conversationId: string,
    updater: (
      current: ConversationRuntimeState
    ) => ConversationRuntimeState
  ) {
    setRuntimeByConversationId((current) => {
      const previous = current[conversationId] ?? createRuntimeState()
      return {
        ...current,
        [conversationId]: updater(previous),
      }
    })
  }

  function setConversationTitleGenerationState(
    conversationId: string,
    isGenerating: boolean
  ) {
    setTitleGenerationConversationIds((current) => {
      const next = new Set(current)

      if (isGenerating) {
        next.add(conversationId)
      } else {
        next.delete(conversationId)
      }

      return next
    })
  }

  function updateConversation(
    conversationId: string,
    updater: (conversation: Conversation) => Conversation
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation
      )
    )
  }

  function setConversationMessages(
    conversationId: string,
    updater: (messages: ChatMessage[]) => ChatMessage[]
  ) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: updater(conversation.messages),
      updatedAt: Date.now(),
    }))
  }

  function setConversationInput(conversationId: string, nextInput: string) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      input: nextInput,
      updatedAt: Date.now(),
    }))
  }

  function setConversationModel(conversationId: string, nextModel: string) {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      model: nextModel,
      updatedAt: Date.now(),
    }))
  }

  function createConversation() {
    if (!hasSavedApiKey) {
      openOnboarding()
      return
    }

    const conversation = createEmptyConversation(
      getNextConversationTitle(conversations)
    )
    setConversations((current) => [conversation, ...current])
    setRuntimeByConversationId((current) => ({
      ...current,
      [conversation.id]: createRuntimeState(),
    }))
    setActiveConversationId(conversation.id)
    setApiKey("")
  }

  function openOnboarding() {
    setApiKey("")
    setIsOnboardingOpen(true)
    setConversationRuntime(activeConversation.id, (current) => ({
      ...current,
      sessionError: null,
    }))
  }

  function renameConversation(conversationId: string, title: string) {
    const nextTitle = sanitizeProjectTitle(title)
    if (!nextTitle) {
      return
    }

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: nextTitle,
      updatedAt: Date.now(),
    }))
  }

  function deleteConversation(conversationId: string) {
    const target = getConversationById(
      conversationsRef.current,
      conversationId
    )
    const sessionId = target?.session?.id
    const targetTitle = target?.title

    const controller = abortControllersRef.current.get(conversationId)
    if (controller) {
      controller.abort()
      abortControllersRef.current.delete(conversationId)
    }

    if (sessionId) {
      void fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      }).catch(() => {
        // Best-effort server-side cleanup; UI state is already removed.
      })
    }

    if (targetTitle) {
      showToast({
        title: "Project deleted",
        description: `Removed “${targetTitle}” and its preview workspace.`,
      })
    }

    restoredConversationIdsRef.current.delete(conversationId)
    titleGenerationConversationIdsRef.current.delete(conversationId)

    setTitleGenerationConversationIds((current) => {
      if (!current.has(conversationId)) {
        return current
      }
      const next = new Set(current)
      next.delete(conversationId)
      return next
    })

    setRuntimeByConversationId((current) => {
      if (!(conversationId in current)) {
        return current
      }
      const next = { ...current }
      delete next[conversationId]
      return next
    })

    let nextActiveId: string | null = null
    setConversations((current) => {
      const remaining = current.filter(
        (conversation) => conversation.id !== conversationId
      )

      if (conversationId === activeConversationId) {
        const sorted = [...remaining].sort(
          (a, b) => b.updatedAt - a.updatedAt
        )
        if (sorted.length > 0) {
          nextActiveId = sorted[0].id
          return remaining
        }

        const replacement = createEmptyConversation(
          getNextConversationTitle(remaining)
        )
        nextActiveId = replacement.id
        return [replacement]
      }

      return remaining
    })

    if (nextActiveId) {
      setActiveConversationId(nextActiveId)
      setRuntimeByConversationId((current) => {
        if (current[nextActiveId!]) {
          return current
        }
        return { ...current, [nextActiveId!]: createRuntimeState() }
      })
    }
  }

  function setApiKeySettingsOpen(open: boolean) {
    setIsApiKeySettingsOpen(open)
    setIsApiKeyClearConfirming(false)

    if (open) {
      setApiKey("")
    }
  }

  async function requestGeneratedConversationTitle(
    conversationId: string,
    sessionId: string,
    context: { prompt?: string; messages?: ProjectNameMessage[] },
    options: { force?: boolean; notifyOnError?: boolean } = {}
  ) {
    if (titleGenerationConversationIdsRef.current.has(conversationId)) {
      return
    }

    titleGenerationConversationIdsRef.current.add(conversationId)
    setConversationTitleGenerationState(conversationId, true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, PROJECT_NAME_TIMEOUT_MS)

    try {
      const response = await fetch("/api/project-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ sessionId, ...context }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: unknown
        title?: unknown
      }
      if (!response.ok || typeof data.title !== "string") {
        const message =
          typeof data.error === "string"
            ? data.error
            : "The API did not return a generated title."
        throw new Error(message)
      }

      const title = sanitizeProjectTitle(data.title)
      if (!title) {
        throw new Error("The generated project name was empty.")
      }

      updateConversation(conversationId, (conversation) =>
        options.force || shouldGenerateProjectName(conversation)
          ? { ...conversation, title, updatedAt: Date.now() }
          : conversation
      )
    } catch (error) {
      if (!options.notifyOnError) {
        return
      }

      const message = getProjectNameErrorMessage(error)
      setConversationMessages(conversationId, (current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: message,
        },
      ])
    } finally {
      window.clearTimeout(timeoutId)
      titleGenerationConversationIdsRef.current.delete(conversationId)
      setConversationTitleGenerationState(conversationId, false)
    }
  }

  async function generateConversationTitle(conversationId: string) {
    const conversation = getConversationById(
      conversationsRef.current,
      conversationId
    )
    if (!conversation?.session) {
      return
    }

    const messages = getProjectNameMessages(conversation)
    if (messages.length === 0) {
      return
    }

    await requestGeneratedConversationTitle(
      conversation.id,
      conversation.session.id,
      { messages },
      { force: true, notifyOnError: true }
    )
  }

  function applySession(conversationId: string, nextSession: Session) {
    const nextModels = ensureModelCatalog(nextSession.models)

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      session: { ...nextSession, models: nextModels },
      model: isModelSelectionAvailable(nextModels, conversation.model)
        ? conversation.model
        : encodeModelForCatalogItem(nextModels[0]),
      updatedAt: Date.now(),
    }))
  }

  function selectModel(modelId: string) {
    const nextModel = availableModels.find((item) => item.id === modelId)
    if (nextModel) {
      setConversationModel(
        activeConversation.id,
        encodeModelForCatalogItem(nextModel)
      )
    }
  }

  function selectModelParameter(parameterId: string, value: string) {
    const currentSelection = parseModelSelectionValue(model)
    const params = new Map(
      normalizeSelectedParams(selectedModel, currentSelection.params).map(
        (param) => [param.id, param.value]
      )
    )
    params.set(parameterId, value)

    setConversationModel(
      activeConversation.id,
      encodeModelSelection({
        id: selectedModel.id,
        params: Array.from(params.entries()).map(([id, paramValue]) => ({
          id,
          value: paramValue,
        })),
      })
    )
  }

  async function createSessionFromApiKey(
    rawApiKey: string,
    options: {
      openOnboardingOnError?: boolean
      persist: boolean
      readyMessage?: string
    },
    conversationId = activeConversation.id
  ) {
    if (!rawApiKey.trim() || isCreatingSession) {
      return false
    }

    const trimmedApiKey = rawApiKey.trim()
    const restoredSessionId = getConversationById(
      conversationsRef.current,
      conversationId
    )?.session?.id

    if (!isCursorApiKey(trimmedApiKey)) {
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        sessionError: "Cursor API keys start with crsr_. Please check the key.",
      }))
      return false
    }

    setConversationRuntime(conversationId, (current) => ({
      ...current,
      isCreatingSession: true,
      isCursorTyping: false,
      sessionError: null,
    }))

    try {
      const data = await requestSession(trimmedApiKey, restoredSessionId, {
        persistApiKey: options.persist,
      })

      restoredConversationIdsRef.current.add(conversationId)
      applySession(conversationId, data)
      if (options.persist) {
        window.localStorage.setItem(SAVED_CURSOR_API_KEY, trimmedApiKey)
      }
      setHasSavedApiKey(true)
      setApiKey("")
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isCreatingSession: false,
        isCursorTyping: false,
        sessionError: null,
      }))
      setIsOnboardingOpen(false)
      const readyMessage = options.readyMessage
      if (readyMessage) {
        setConversationMessages(conversationId, (current) =>
          appendReadyMessage(current, readyMessage)
        )
      }
      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start preview."
      const shouldOpenOnboarding = options.openOnboardingOnError ?? true
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isCreatingSession: false,
        isCursorTyping: false,
        sessionError: message,
      }))
      if (shouldOpenOnboarding) {
        setIsOnboardingOpen(true)
      }
      return false
    } finally {
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isCreatingSession: false,
      }))
    }
  }

  async function submitApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!apiKey.trim() || isCreatingSession) {
      return
    }

    const didStart = await createSessionFromApiKey(apiKey, {
      persist: true,
    })

    if (didStart) {
      setIsOnboardingOpen(false)
    }
  }

  async function submitApiKeySettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!apiKey.trim() || isCreatingSession) {
      return
    }

    const didSave = await createSessionFromApiKey(apiKey, {
      openOnboardingOnError: !activeConversation.session,
      persist: true,
      readyMessage: SAVED_API_KEY_READY_MESSAGE,
    })

    if (didSave) {
      setIsOnboardingOpen(false)
      setApiKeySettingsOpen(false)
      showToast({
        title: "Cursor API key saved",
        description: "The local preview is connected.",
      })
    }
  }

  async function clearSavedApiKey() {
    window.localStorage.removeItem(SAVED_CURSOR_API_KEY)
    await fetch("/api/settings/api-key", { method: "DELETE" }).catch(() => {})
    setHasSavedApiKey(false)
    setApiKey("")
    if (!activeConversation.session) {
      setIsOnboardingOpen(true)
    }
    setConversationRuntime(activeConversation.id, (current) => ({
      ...current,
      sessionError: null,
    }))
    showToast({
      title: "API key cleared",
      description: "Add a new Cursor key to start a session again.",
      variant: "info",
    })
  }

  async function confirmClearSavedApiKey() {
    if (!isApiKeyClearConfirming) {
      setIsApiKeyClearConfirming(true)
      return
    }

    await clearSavedApiKey()
    setIsApiKeyClearConfirming(false)
  }

  async function retrySavedApiKey() {
    const conversationId = activeConversation.id
    const restoredSessionId = activeConversation.session?.id
    const savedApiKey = getSavedCursorApiKey()
    const validSavedApiKey =
      savedApiKey && isCursorApiKey(savedApiKey) ? savedApiKey : undefined

    if (savedApiKey && !validSavedApiKey) {
      window.localStorage.removeItem(SAVED_CURSOR_API_KEY)
    }

    if (!validSavedApiKey) {
      setHasSavedApiKey(false)
      setIsOnboardingOpen(true)
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isCreatingSession: false,
        isCursorTyping: false,
        sessionError: null,
      }))
      return
    }

    setConversationRuntime(conversationId, (current) => ({
      ...current,
      isCreatingSession: true,
      isCursorTyping: false,
      sessionError: null,
    }))

    try {
      const data = await requestSession(validSavedApiKey, restoredSessionId, {
        persistApiKey: Boolean(validSavedApiKey),
      })
      restoredConversationIdsRef.current.add(conversationId)
      applySession(conversationId, data)
      setHasSavedApiKey(true)
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isCreatingSession: false,
        isCursorTyping: false,
        sessionError: null,
      }))
    } catch (error) {
      if (isMissingApiKeyError(error)) {
        setHasSavedApiKey(false)
        setIsOnboardingOpen(true)
        setConversationRuntime(conversationId, (current) => ({
          ...current,
          sessionError: null,
        }))
      } else {
        const message =
          error instanceof Error ? error.message : "Could not start preview."
        setConversationRuntime(conversationId, (current) => ({
          ...current,
          sessionError: message,
        }))
      }
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isCursorTyping: false,
      }))
    } finally {
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isCreatingSession: false,
      }))
    }
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (!session || !input.trim() || isRunning) {
      return
    }

    const conversationId = activeConversation.id
    const activeSession = session
    const activeModel = model
    const userText = input.trim()
    const assistantId = crypto.randomUUID()
    lastStreamEventTypeRef.current[conversationId] = null
    const controller = new AbortController()
    abortControllersRef.current.set(conversationId, controller)
    setConversationRuntime(conversationId, (current) => ({
      ...current,
      isRunning: true,
    }))
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      input: "",
      messages: [
        ...conversation.messages,
        { id: crypto.randomUUID(), role: "user", content: userText },
        {
          id: createAssistantSegmentId(assistantId),
          role: "assistant",
          content: "",
        },
      ],
      updatedAt: Date.now(),
    }))

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          message: userText,
          model: activeModel,
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? "The agent request failed.")
      }

      await readAgentStream(response.body, conversationId, assistantId)
    } catch (error) {
      if (isAbortError(error) || isCancelledError(error)) {
        setConversationMessages(conversationId, (current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: "Stopped.",
          },
        ])
      } else {
        const message = getFriendlyErrorMessage(error)
        setConversationMessages(conversationId, (current) => [
          ...current,
          { id: crypto.randomUUID(), role: "system", content: message },
        ])
      }
    } finally {
      setConversationMessages(conversationId, finalizeActiveThinkingMessages)
      setConversationRuntime(conversationId, (current) => ({
        ...current,
        isRunning: false,
      }))
      if (abortControllersRef.current.get(conversationId) === controller) {
        abortControllersRef.current.delete(conversationId)
      }
    }
  }

  function cancelMessage() {
    const conversationId = activeConversation.id
    const controller = abortControllersRef.current.get(conversationId)
    const sessionId = activeConversation.session?.id

    if (controller) {
      controller.abort()
    }

    if (sessionId) {
      void fetch("/api/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {
        // Best-effort cancellation; client-side abort already stopped the stream.
      })
    }
  }

  async function readAgentStream(
    body: ReadableStream<Uint8Array>,
    conversationId: string,
    assistantId: string
  ) {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split("\n\n")
      buffer = chunks.pop() ?? ""

      for (const chunk of chunks) {
        handleStreamChunk(chunk, conversationId, assistantId)
      }
    }

    if (buffer.trim()) {
      handleStreamChunk(buffer, conversationId, assistantId)
    }
  }

  function handleStreamChunk(
    chunk: string,
    conversationId: string,
    assistantId: string
  ) {
    const parsed = parseServerSentEvent(chunk)
    if (!parsed) {
      return
    }

    if (parsed.event === "error") {
      const data = parsed.data as { message?: string }
      throw new Error(data.message ?? "The agent run failed.")
    }

    if (parsed.event === "cancelled") {
      throw new AgentRunCancelledClientError()
    }

    if (parsed.event === "session") {
      applySession(conversationId, parsed.data as Session)
      return
    }

    if (parsed.event === "assistant_delta") {
      const data = parsed.data as StreamPayload
      if (data.type === "assistant_delta") {
        appendAssistantDelta(conversationId, assistantId, data.text)
      }
      return
    }

    if (
      parsed.event === "status" ||
      parsed.event === "tool_call" ||
      parsed.event === "task" ||
      parsed.event === "thinking"
    ) {
      updateActivity(parsed.data as StreamPayload, conversationId, assistantId)
    }
  }

  function appendAssistantDelta(
    conversationId: string,
    assistantId: string,
    text: string
  ) {
    if (!text) {
      return
    }

    lastStreamEventTypeRef.current[conversationId] = "assistant_delta"

    setConversationMessages(conversationId, (current) => {
      const nextMessages = finalizeActiveThinkingMessages(current)
      const lastMessage = nextMessages.at(-1)

      if (lastMessage && isAssistantSegment(lastMessage, assistantId)) {
        return nextMessages.map((message, index) =>
          index === nextMessages.length - 1
            ? { ...message, content: `${message.content}${text}` }
            : message
        )
      }

      return [
        ...nextMessages,
        {
          id: createAssistantSegmentId(assistantId),
          role: "assistant",
          content: text,
        },
      ]
    })
  }

  function updateActivity(
    payload: StreamPayload,
    conversationId: string,
    assistantId: string
  ) {
    const activity = formatActivity(payload)

    if (!activity) {
      if (payload.type !== "thinking") {
        lastStreamEventTypeRef.current[conversationId] = payload.type
        setConversationMessages(conversationId, finalizeActiveThinkingMessages)
      }
      return
    }

    const activityKey = activity.key
      ? `${assistantId}:${activity.key}`
      : undefined
    const shouldCoalesceThinking =
      payload.type === "thinking" &&
      !activityKey &&
      lastStreamEventTypeRef.current[conversationId] === "thinking"
    lastStreamEventTypeRef.current[conversationId] = payload.type

    setConversationMessages(conversationId, (current) => {
      const currentMessages =
        payload.type === "thinking"
          ? current
          : finalizeActiveThinkingMessages(current)
      const activityIndex = activityKey
        ? findActivityMessageIndex(currentMessages, activityKey)
        : -1

      if (activityIndex !== -1) {
        const currentActivity = currentMessages[activityIndex]
        const content = mergeActivityContent(currentActivity.content, activity)

        if (
          currentActivity.content === content &&
          currentActivity.activityGroupKey === activity.groupKey &&
          currentActivity.activityIcon === activity.icon &&
          currentActivity.activityState === activity.state &&
          currentActivity.activitySymbol === activity.symbol &&
          areStringArraysEqual(currentActivity.activityTargets, activity.targets) &&
          currentActivity.activityType === payload.type
        ) {
          return currentMessages
        }

        return currentMessages.map((message, index) =>
          index === activityIndex
            ? {
                ...message,
                activityKey,
                activityGroupKey: activity.groupKey,
                activityIcon: activity.icon,
                activityState: activity.state,
                activitySymbol: activity.symbol,
                activityTargets: activity.targets,
                activityType: payload.type,
                content,
              }
            : message
        )
      }

      const nextMessages = removeTrailingEmptyAssistantSegment(
        currentMessages,
        assistantId
      )
      const lastMessage = nextMessages.at(-1)

      if (
        !activityKey &&
        payload.type === "thinking" &&
        shouldCoalesceThinking &&
        lastMessage &&
        getMessageDisplayRole(lastMessage) === "activity" &&
        lastMessage.activityType === "thinking"
      ) {
        if (
          lastMessage.content === activity.content &&
          lastMessage.activityGroupKey === activity.groupKey &&
          lastMessage.activityIcon === activity.icon
        ) {
          return nextMessages
        }

        return nextMessages.map((message, index) =>
          index === nextMessages.length - 1
            ? {
                ...message,
                activityGroupKey: activity.groupKey,
                activityIcon: activity.icon,
                activityState: activity.state,
                activitySymbol: activity.symbol,
                content: activity.content,
              }
            : message
        )
      }

      if (lastMessage && canGroupActivityMessages(lastMessage, activity)) {
        return nextMessages.map((message, index) =>
          index === nextMessages.length - 1
            ? {
                ...message,
                activityCount: (message.activityCount ?? 1) + 1,
                content: activity.content,
              }
            : message
        )
      }

      return [
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          activityCount: 1,
          activityGroupKey: activity.groupKey,
          activityIcon: activity.icon,
          activityKey,
          activityState: activity.state,
          activitySymbol: activity.symbol,
          activityTargets: activity.targets,
          activityType: payload.type,
          role: "activity",
          content: activity.content,
        },
      ]
    })
  }

  function createAssistantSegmentId(assistantId: string) {
    return `${assistantId}:assistant:${crypto.randomUUID()}`
  }

  function isAssistantSegment(message: ChatMessage, assistantId: string) {
    return (
      message.role === "assistant" &&
      message.id.startsWith(`${assistantId}:assistant:`)
    )
  }

  function removeTrailingEmptyAssistantSegment(
    messages: ChatMessage[],
    assistantId: string
  ) {
    const lastMessage = messages.at(-1)

    if (
      lastMessage &&
      isAssistantSegment(lastMessage, assistantId) &&
      !lastMessage.content
    ) {
      return messages.slice(0, -1)
    }

    return messages
  }

  function canGroupActivityMessages(
    message: ChatMessage,
    activity: ActivityDescriptor
  ) {
    return (
      getMessageDisplayRole(message) === "activity" &&
      !message.activityKey &&
      !activity.key &&
      message.activityType === "tool_call" &&
      message.activityGroupKey === activity.groupKey &&
      message.activityIcon === activity.icon
    )
  }

  return (
    <main
      id="app-main"
      tabIndex={-1}
      className={cn(
        "flex h-screen gap-0 bg-background p-0 outline-none",
        session ? "" : "items-stretch"
      )}
    >
      {isProjectSidebarOpen ? (
        <ConversationSidebar
          conversations={sidebarConversations}
          activeConversationId={activeConversation.id}
          apiKey={apiKey}
          hasSavedApiKey={hasSavedApiKey}
          isApiKeyClearConfirming={isApiKeyClearConfirming}
          isApiKeySettingsOpen={isApiKeySettingsOpen}
          isCreatingSession={isCreatingSession}
          titleGenerationConversationIds={titleGenerationConversationIds}
          sessionError={sessionError}
          themePreference={themePreference}
          user={session?.user ?? null}
          onApiKeyChange={setApiKey}
          onApiKeySettingsOpenChange={setApiKeySettingsOpen}
          onClearSavedApiKey={confirmClearSavedApiKey}
          onCreateConversation={createConversation}
          onDeleteConversation={deleteConversation}
          onGenerateName={generateConversationTitle}
          onHideSidebar={() => {
            setIsProjectSidebarOpen(false)
            setApiKeySettingsOpen(false)
          }}
          onSelectConversation={(conversationId) => {
            setActiveConversationId(conversationId)
            setApiKey("")
            setIsApiKeyClearConfirming(false)
          }}
          onRenameConversation={renameConversation}
          onRequireApiKey={openOnboarding}
          onShowKeyboardShortcuts={() => setIsShortcutsHelpOpen(true)}
          onSubmitApiKey={submitApiKeySettings}
          onThemePreferenceChange={setThemePreference}
        />
      ) : (
        <CollapsedProjectSidebar
          onShowSidebar={() => setIsProjectSidebarOpen(true)}
        />
      )}
      <Card
        className={cn(
          "flex h-full gap-0 overflow-hidden rounded-none border-y-0 border-l-0 border-r-0 py-0 shadow-none ring-0",
          session ? "shrink-0 border-r border-border/80" : "min-w-0 flex-1"
        )}
        style={session ? { width: CHAT_WIDTH_DEFAULT } : undefined}
      >
        <CardContent className="relative flex min-h-0 flex-1 flex-col p-0">
          {session ? (
            <ProjectChatHeader
              conversation={activeConversation}
              session={session}
              title={activeConversation.title}
              updatedAt={activeConversation.updatedAt}
            />
          ) : null}
          <ScrollArea className="min-h-0 flex-1">
            <div
              className={cn(
                "flex min-h-full flex-col gap-2.5 p-3",
                session && "pb-48",
                !showProjectSetup && "justify-end",
                showProjectSetup && "items-center justify-center"
              )}
            >
              {showProjectSetup ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2
                    aria-hidden="true"
                    className="size-5 animate-spin text-muted-foreground"
                  />
                  <p className="text-sm font-medium text-muted-foreground">
                    Setting up project…
                  </p>
                </div>
              ) : isCursorTyping ? (
                <div className="mr-8 flex w-fit items-center gap-2 rounded-md bg-muted/70 px-2.5 py-1.5 text-sm text-muted-foreground">
                  <Loader2 aria-hidden="true" className="animate-spin" />
                  Cursor is typing...
                </div>
              ) : null}

              {session &&
              !showProjectSetup &&
              visibleMessages.length === 0 &&
              !isCursorTyping ? (
                <StarterPrompts
                  onSelect={(prompt) => {
                    setConversationInput(activeConversation.id, prompt)
                    chatInputRef.current?.focus()
                  }}
                />
              ) : null}

              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1 text-sm leading-6",
                    getMessageDisplayRole(message) === "user" &&
                      "w-fit max-w-[85%] self-end rounded-md bg-muted/80 px-3 py-2 text-foreground",
                    getMessageDisplayRole(message) === "assistant" &&
                      "py-1 text-foreground",
                    getMessageDisplayRole(message) === "activity" &&
                      "py-px text-xs leading-5 text-muted-foreground/85",
                    getMessageDisplayRole(message) === "system" &&
                      "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive"
                  )}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content || "Working..."}
                    </p>
                  ) : getMessageDisplayRole(message) === "activity" ? (
                    <ActivityMessage message={message} />
                  ) : message.role === "assistant" && !message.content ? (
                    <AssistantPending />
                  ) : (
                    <MarkdownMessage content={message.content || "Working..."} />
                  )}
                </div>
              ))}

              {!session && hasSavedApiKey && sessionError ? (
                <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
                  <p className="text-sm text-destructive">{sessionError}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={retrySavedApiKey}
                      disabled={isCreatingSession}
                      className="rounded-md"
                    >
                      {isCreatingSession ? (
                        <Loader2
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                      ) : (
                        <Sparkles data-icon="inline-start" />
                      )}
                      Retry
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setApiKeySettingsOpen(true)}
                      className="rounded-md"
                    >
                      Change API key
                    </Button>
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {session ? (
            <form
              className="absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-12"
              onSubmit={sendMessage}
            >
              <div className="rounded-xl border bg-background p-3 shadow-sm transition-colors focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/15">
                <Textarea
                  ref={chatInputRef}
                  value={input}
                  onChange={(event) =>
                    setConversationInput(
                      activeConversation.id,
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                  placeholder="What do you want to build?"
                  rows={1}
                  disabled={isRunning}
                  className="max-h-40 min-h-16 resize-none border-0 bg-transparent px-1 py-0 text-base shadow-none focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent"
                />
                <div className="flex items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
                  <div className="flex min-w-0 items-center gap-2">
                    <ModelConfigPopover
                      models={availableModels}
                      selectedModel={selectedModel}
                      model={model}
                      onModelChange={selectModel}
                      onParameterChange={selectModelParameter}
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isRunning ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        onClick={cancelMessage}
                        className="size-7 rounded-full bg-foreground text-background hover:bg-foreground/90 [&_svg:not([class*='size-'])]:size-4"
                        aria-label="Stop generation"
                        title="Stop"
                      >
                        <Stop
                          weight="fill"
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        size="icon-sm"
                        className="size-7 rounded-full bg-foreground text-background hover:bg-foreground/90 [&_svg:not([class*='size-'])]:size-4"
                        disabled={!canSubmit}
                        aria-label="Send message"
                      >
                        <ArrowUp aria-hidden="true" className="size-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {session ? (
        <Card className="flex min-w-0 flex-1 gap-0 overflow-hidden rounded-none border-0 py-0 shadow-none ring-0">
          <CardContent className="flex min-h-0 flex-1 flex-col bg-background p-0">
            <PreviewToolbar
              previewUrl={session.previewUrl}
              isLogsOpen={isLogsPanelOpen}
              previewDeviceSize={previewDeviceSize}
              onRefreshPreview={() =>
                setPreviewRefreshCounter((current) => current + 1)
              }
              onPreviewDeviceSizeChange={setPreviewDeviceSize}
              onToggleLogs={() =>
                setIsLogsPanelOpen((current) => !current)
              }
            />
            <PreviewFrame
              key={`${session.id}:${previewRefreshCounter}`}
              previewUrl={session.previewUrl}
              deviceSize={previewDeviceSize}
            />
            {isLogsPanelOpen ? (
              <LogsPanel
                key={session.id}
                sessionId={session.id}
                onClose={() => setIsLogsPanelOpen(false)}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {isOnboardingOpen ? (
        <ApiKeyOnboardingModal
          apiKey={apiKey}
          isCreatingSession={isCreatingSession}
          sessionError={sessionError}
          onApiKeyChange={setApiKey}
          onSubmit={submitApiKey}
        />
      ) : null}
      {isShortcutsHelpOpen ? (
        <KeyboardShortcutsHelpDialog
          onClose={() => setIsShortcutsHelpOpen(false)}
        />
      ) : null}
    </main>
  )
}

function findActivityMessageIndex(messages: ChatMessage[], activityKey: string) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].activityKey === activityKey) {
      return index
    }
  }

  return -1
}

function finalizeActiveThinkingMessages(messages: ChatMessage[]) {
  let changed = false
  const finalized = messages.map((message) => {
    if (
      getMessageDisplayRole(message) !== "activity" ||
      message.activityType !== "thinking" ||
      message.activityState !== "active"
    ) {
      return message
    }

    changed = true
    const content = finalizeThinkingContent(message.content)
    return {
      ...message,
      activityGroupKey: getActivityGroupKey(content),
      activityState: "complete" as const,
      activitySymbol: getActivitySymbol(content),
      content,
    }
  })

  return changed ? finalized : messages
}

function finalizeThinkingContent(content: string) {
  const normalized = normalizeActivityContent(content) ?? content
  const detail = normalized.replace(/^Thinking(?: through)?(?:\.\.\.)?:?\s*/i, "")

  return detail && detail !== normalized ? `Thought: ${detail}` : "Thought"
}

function mergeActivityContent(
  previousContent: string,
  nextActivity: ActivityDescriptor
) {
  if (nextActivity.content.includes(":")) {
    return nextActivity.content
  }

  const previousParams = getInlineActivityParams(previousContent)
  return previousParams ? `${nextActivity.content}: ${previousParams}` : nextActivity.content
}

function getInlineActivityParams(content: string) {
  const [, params] = content.match(/^[^:]+:\s*(.+)$/) ?? []
  return params
}

function getActivityGroupKey(content: string) {
  return stripActivityCount(content)
    .replace(/:\s*.+$/, "")
    .trim()
    .toLowerCase()
}

function formatActivity(payload: StreamPayload): ActivityDescriptor | null {
  if (payload.type === "tool_call") {
    const icon = getToolActivityIcon(payload.name)
    const content = formatToolActivity(
      payload.name,
      payload.status,
      payload.args,
      payload.truncatedArgs
    )
    return {
      groupKey: getActivityGroupKey(content),
      icon,
      key: payload.callId ? `tool:${payload.callId}` : undefined,
      symbol: getActivitySymbol(content),
      targets: getExactToolFileTargets(payload.name, payload.args, icon),
      content,
    }
  }

  if (payload.type === "thinking") {
    const content = formatThinkingActivity(payload.text)

    return {
      groupKey: getActivityGroupKey(content),
      icon: "thinking",
      key: payload.id ? `thinking:${payload.id}` : undefined,
      state: "active",
      symbol: getActivitySymbol(content),
      content,
    }
  }

  if (payload.type === "status") {
    const content = formatStatusActivity(payload.status, payload.message)

    return content
      ? {
          groupKey: getActivityGroupKey(content),
          icon: "status",
          symbol: getActivitySymbol(content),
          content,
        }
      : null
  }

  if (payload.type === "task") {
    const content = payload.text ?? formatStatusText(payload.status) ?? "Task updated"
    return {
      groupKey: getActivityGroupKey(content),
      icon: "task",
      symbol: getActivitySymbol(content),
      content,
    }
  }

  return null
}

function formatThinkingActivity(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim()

  if (
    !normalized ||
    /^(thinking|thinking\.{3}|working|working\.{3})$/i.test(normalized)
  ) {
    return "Thinking..."
  }

  return `Thinking...: ${truncateInline(normalized, 120)}`
}

function getToolActivityIcon(name: string): ActivityIcon {
  const normalized = name.toLowerCase()

  if (normalized.includes("search")) {
    return "search"
  }

  if (normalized.includes("glob") || normalized.includes("list")) {
    return "glob"
  }

  if (normalized.includes("read") || normalized.includes("fetch")) {
    return "read"
  }

  if (normalized.includes("delete") || normalized.includes("remove")) {
    return "delete"
  }

  if (
    normalized.includes("edit") ||
    normalized.includes("write") ||
    normalized.includes("patch") ||
    normalized.includes("update") ||
    normalized.includes("create")
  ) {
    return "edit"
  }

  if (normalized.includes("test")) {
    return "test"
  }

  if (normalized.includes("build")) {
    return "build"
  }

  if (
    normalized.includes("shell") ||
    normalized.includes("command") ||
    normalized.includes("terminal")
  ) {
    return "shell"
  }

  return "default"
}

function formatToolActivity(
  name: string,
  status: string,
  args: unknown,
  truncatedArgs: boolean | undefined
) {
  const toolName = humanizeToolName(name)
  const normalizedStatus = status.toLowerCase()
  const params = formatToolParams(args, truncatedArgs)
  const pathLabel = getPathToolActivityLabel(name, params.target)

  if (pathLabel) {
    const content =
      normalizedStatus === "error" || normalizedStatus === "failed"
        ? `${pathLabel} failed`
        : pathLabel
    return appendInlineDetails(content, params.details)
  }

  const suffix = params.details || params.target
  const contentSuffix = suffix ? `: ${suffix}` : ""

  if (
    normalizedStatus === "requested" ||
    normalizedStatus === "running" ||
    normalizedStatus === "in_progress"
  ) {
    return `${getRunningToolLabel(toolName)}${contentSuffix}`
  }

  if (normalizedStatus === "completed" || normalizedStatus === "success") {
    return `${getFinishedToolLabel(toolName)}${contentSuffix}`
  }

  if (normalizedStatus === "error" || normalizedStatus === "failed") {
    return `${getFailedToolLabel(toolName)}${contentSuffix}`
  }

  const statusText = formatStatusText(status)?.toLowerCase() ?? status
  return `${toolName} ${statusText}${contentSuffix}`
}

function appendInlineDetails(content: string, details: string) {
  return details ? `${content}: ${details}` : content
}

function getPathToolActivityLabel(name: string, target: string | undefined) {
  if (!target) {
    return null
  }

  const normalized = name.toLowerCase()

  if (
    normalized.includes("read") ||
    normalized.includes("search") ||
    normalized.includes("glob") ||
    normalized.includes("list") ||
    normalized.includes("fetch")
  ) {
    return `Read ${target}`
  }

  if (normalized.includes("delete") || normalized.includes("remove")) {
    return `Deleted ${target}`
  }

  if (normalized.includes("create")) {
    return `Created ${target}`
  }

  if (
    normalized.includes("edit") ||
    normalized.includes("write") ||
    normalized.includes("patch") ||
    normalized.includes("update")
  ) {
    return `Edited ${target}`
  }

  return null
}

function getExactToolFileTargets(
  name: string,
  args: unknown,
  icon: ActivityIcon
) {
  if (!isExactFileToolName(name, icon)) {
    return undefined
  }

  const paths = collectPathValues(parseMaybeJson(args))
    .filter(isExactFileActivityPath)
    .map(formatPathDisplay)
    .filter(Boolean)

  return normalizeActivityTargets(Array.from(new Set(paths)))
}

function isExactFileToolName(name: string, icon: ActivityIcon) {
  const normalized = name.toLowerCase()

  if (icon === "read") {
    return (
      normalized.includes("read") &&
      !normalized.includes("search") &&
      !normalized.includes("glob") &&
      !normalized.includes("list") &&
      !normalized.includes("fetch")
    )
  }

  if (icon === "edit") {
    return (
      normalized.includes("edit") ||
      normalized.includes("write") ||
      normalized.includes("patch") ||
      normalized.includes("update") ||
      normalized.includes("create")
    )
  }

  return false
}

function isExactFileActivityPath(path: string) {
  const trimmedPath = path.trim().replace(/[?#].*$/, "")

  return (
    Boolean(trimmedPath) &&
    !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedPath.replace(/^file:\/\//i, "")) &&
    !/[/\\]$/.test(trimmedPath) &&
    !/[*?\[\]{}]/.test(trimmedPath)
  )
}

function formatStatusActivity(status: string, message: string | undefined) {
  const normalizedStatus = status.toUpperCase()

  if (normalizedStatus === "RUNNING" || normalizedStatus === "FINISHED") {
    return null
  }

  return formatStatusText(message ?? status)
}

function getRunningToolLabel(toolName: string) {
  return toolName
}

function getFinishedToolLabel(toolName: string) {
  if (toolName.endsWith("ing files")) {
    return toolName.replace(/ing files$/, "ed files")
  }

  if (toolName.endsWith("ing changes")) {
    return toolName.replace(/ing changes$/, "ed changes")
  }

  if (toolName === "Reading context") {
    return "Read context"
  }

  if (toolName.endsWith("ing")) {
    return toolName.replace(/ing$/, "ed")
  }

  return `${toolName} done`
}

function getFailedToolLabel(toolName: string) {
  if (toolName.endsWith("ing files")) {
    return toolName.replace(/ing files$/, "ing files failed")
  }

  if (toolName.endsWith("ing changes")) {
    return toolName.replace(/ing changes$/, "ing changes failed")
  }

  return `${toolName} failed`
}

function formatToolParams(
  args: unknown,
  truncated: boolean | undefined
): ToolParamDisplay {
  if (args === undefined || args === null) {
    return { details: truncated ? "params truncated" : "" }
  }

  const redactedArgs = redactSensitiveValues(parseMaybeJson(args))
  const target = formatPathTarget(collectPathValues(redactedArgs))
  const details = formatParamDetails(redactedArgs)

  return {
    target,
    details: appendTruncatedDetails(details, truncated),
  }
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function appendTruncatedDetails(details: string, truncated: boolean | undefined) {
  if (!truncated) {
    return details
  }

  return details ? `${details} (truncated)` : "params truncated"
}

function collectPathValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectPathValues)
  }

  if (!value || typeof value !== "object") {
    return []
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, item]) => {
      if (isPathParamKey(key)) {
        return collectStringValues(item)
      }

      return collectPathValues(item)
    }
  )
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") {
    return value ? [value] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStringValues)
  }

  if (!value || typeof value !== "object") {
    return []
  }

  return Object.values(value as Record<string, unknown>).flatMap(
    collectStringValues
  )
}

function formatPathTarget(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.map(formatPathDisplay))).filter(
    Boolean
  )

  if (uniquePaths.length === 0) {
    return undefined
  }

  if (uniquePaths.length <= 2) {
    return uniquePaths.join(", ")
  }

  return `${uniquePaths.slice(0, 2).join(", ")} +${uniquePaths.length - 2}`
}

function formatPathDisplay(path: string) {
  const trimmedPath = path.trim().replace(/[?#].*$/, "").replace(/[/\\]+$/, "")
  const normalizedPath = trimmedPath.replace(/^file:\/\//, "")
  const parts = normalizedPath.split(/[/\\]/).filter(Boolean)

  return parts.at(-1) ?? normalizedPath
}

function formatParamDetails(value: unknown) {
  if (value === undefined || value === null) {
    return ""
  }

  if (Array.isArray(value)) {
    return truncateInline(value.map(formatParamValue).join(", "))
  }

  if (typeof value !== "object") {
    return truncateInline(formatParamValue(value))
  }

  const details = Object.entries(value as Record<string, unknown>)
    .filter(
      ([key, item]) =>
        !isPathParamKey(key) &&
        !isVerboseParamKey(key) &&
        !isEmptyParamValue(item)
    )
    .map(([key, item]) => `${formatParamKey(key)}: ${formatParamValue(item)}`)
    .join(", ")

  return truncateInline(details)
}

function formatParamValue(value: unknown): string {
  if (value === undefined || value === null) {
    return ""
  }

  if (typeof value === "string") {
    return truncateInline(value)
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (Array.isArray(value)) {
    const values = value.slice(0, 3).map(formatParamValue).filter(Boolean)
    const hiddenCount = value.length - values.length
    const suffix = hiddenCount > 0 ? ` +${hiddenCount}` : ""
    return `[${values.join(", ")}${suffix}]`
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(
      ([key, item]) =>
        !isPathParamKey(key) &&
        !isVerboseParamKey(key) &&
        !isEmptyParamValue(item)
    )
    .slice(0, 3)
    .map(([key, item]) => `${formatParamKey(key)}: ${formatParamValue(item)}`)

  return `{${entries.join(", ")}}`
}

function formatParamKey(key: string) {
  return key.replace(/[_-]+/g, " ")
}

function isEmptyParamValue(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
}

function isPathParamKey(key: string) {
  const normalized = key.toLowerCase().replace(/[_\-\s]+/g, "")

  return (
    normalized.includes("path") ||
    normalized === "file" ||
    normalized === "files" ||
    normalized === "filename" ||
    normalized === "filenames" ||
    normalized === "targetfile" ||
    normalized === "targetfiles"
  )
}

function isVerboseParamKey(key: string) {
  const normalized = key.toLowerCase().replace(/[_\-\s]+/g, "")

  return (
    normalized === "content" ||
    normalized === "contents" ||
    normalized === "code" ||
    normalized === "diff" ||
    normalized === "patch" ||
    normalized === "oldstring" ||
    normalized === "newstring"
  )
}

function truncateInline(value: string, maxLength = 180) {
  const compact = value.replace(/\s+/g, " ").trim()
  return compact.length > maxLength
    ? `${compact.slice(0, maxLength - 3)}...`
    : compact
}

function redactSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValues)
  }

  if (!value || typeof value !== "object") {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      isSensitiveParamKey(key) ? "[redacted]" : redactSensitiveValues(item),
    ])
  )
}

function isSensitiveParamKey(key: string) {
  return /api[_-]?key|token|secret|password|credential/i.test(key)
}

function formatStatusText(value: string | undefined) {
  if (!value) {
    return null
  }

  const formatted = value.replace(/[_-]+/g, " ").trim()

  if (!formatted) {
    return null
  }

  const normalized =
    formatted === formatted.toUpperCase() ? formatted.toLowerCase() : formatted
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function humanizeToolName(name: string) {
  const normalized = name.toLowerCase()

  if (normalized.includes("read") || normalized.includes("search")) {
    return "Reading context"
  }

  if (
    normalized.includes("edit") ||
    normalized.includes("write") ||
    normalized.includes("patch")
  ) {
    return "Editing files"
  }

  if (
    normalized.includes("shell") ||
    normalized.includes("lint") ||
    normalized.includes("test") ||
    normalized.includes("build")
  ) {
    return "Checking changes"
  }

  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getMessageDisplayRole(message: ChatMessage) {
  if (
    message.role === "activity" ||
    (message.role === "system" &&
      (message.content.startsWith("**Activity**") ||
        message.content.startsWith("**Agent activity**")))
  ) {
    return "activity"
  }

  return message.role
}

const activityIconMap: Record<ActivityIcon, PhosphorIcon> = {
  read: FileText,
  search: Search,
  glob: Files,
  edit: Pencil,
  delete: Trash2,
  shell: Terminal,
  test: FlaskConical,
  build: Hammer,
  thinking: Brain,
  status: Info,
  task: ListTodo,
  default: Wrench,
}

function ActivityMessage({ message }: { message: ChatMessage }) {
  const content = normalizeActivityContent(message.content) ?? ""
  const Icon = activityIconMap[getActivityIcon(message, content)]
  const segments = getActivityInlineSegments(content)
  const count = message.activityCount ?? getActivityCount(content)

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="grid size-4 shrink-0 place-items-center rounded-sm bg-muted/70 text-muted-foreground/80"
      >
        <Icon className="size-2.5" />
      </span>
      <span className="min-w-0 truncate text-muted-foreground/85">
        {segments.map((segment, index) =>
          segment.kind === "code" ? (
            <code
              key={index}
              className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground/85"
            >
              {segment.text}
            </code>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        )}
      </span>
      {count > 1 ? (
        <span className="shrink-0 rounded-sm bg-muted px-1 py-0.5 font-mono text-[10px] leading-none text-muted-foreground">
          x{count}
        </span>
      ) : null}
    </div>
  )
}

function getActivityInlineSegments(content: string) {
  const displayContent = stripActivityCount(content)
  const commandMatch = displayContent.match(
    /^(.*?\bcommand:\s*)(.*?)(?=,\s*[a-z][a-z\s-]*:\s|$)(.*)$/i
  )

  if (!commandMatch) {
    return [{ kind: "text" as const, text: displayContent }]
  }

  const [, beforeCommand, command, afterCommand] = commandMatch
  return [
    { kind: "text" as const, text: beforeCommand },
    { kind: "code" as const, text: command.trim() },
    { kind: "text" as const, text: afterCommand },
  ].filter((segment) => segment.text)
}

function getActivityIcon(message: ChatMessage, content: string): ActivityIcon {
  if (message.activityIcon) {
    return message.activityIcon
  }

  if (message.activityType === "thinking") {
    return "thinking"
  }

  if (message.activityType === "status") {
    return "status"
  }

  if (message.activityType === "task") {
    return "task"
  }

  const normalized = content.toLowerCase()

  if (normalized.startsWith("read ")) {
    return "read"
  }

  if (normalized.startsWith("edited ") || normalized.startsWith("created ")) {
    return "edit"
  }

  if (normalized.startsWith("deleted ")) {
    return "delete"
  }

  if (normalized.includes("test")) {
    return "test"
  }

  if (normalized.includes("build")) {
    return "build"
  }

  if (normalized.includes("shell") || normalized.includes("command")) {
    return "shell"
  }

  return "default"
}


function cleanActivityContent(content: string) {
  return stripActivityCount(content)
    .replace(/^\*\*(Agent activity|Activity)\*\*\s*/i, "")
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" · ")
}

function stripActivityCount(content: string) {
  return content.replace(/\s+x\d+$/i, "").trim()
}

function getActivityCount(content: string) {
  const [, count] = content.match(/\s+x(\d+)$/i) ?? []
  return count ? Number(count) : 1
}

function compactActivityMessages(messages: ChatMessage[]) {
  return messages.reduce<ChatMessage[]>((compacted, message) => {
    const normalizedMessage = normalizeActivityMessage(message)

    if (!normalizedMessage) {
      return compacted
    }

    const lastMessage = compacted.at(-1)
    const canCoalesceActivity =
      getMessageDisplayRole(normalizedMessage) === "activity" &&
      lastMessage &&
      getMessageDisplayRole(lastMessage) === "activity" &&
      (normalizedMessage.activityKey
        ? lastMessage.activityKey === normalizedMessage.activityKey
        : normalizedMessage.activityType === "thinking" &&
          lastMessage.activityType === "thinking")
    const canGroupActivity =
      getMessageDisplayRole(normalizedMessage) === "activity" &&
      lastMessage &&
      getMessageDisplayRole(lastMessage) === "activity" &&
      !normalizedMessage.activityKey &&
      !lastMessage.activityKey &&
      normalizedMessage.activityType === "tool_call" &&
      lastMessage.activityType === "tool_call" &&
      normalizedMessage.activityGroupKey === lastMessage.activityGroupKey &&
      normalizedMessage.activityIcon === lastMessage.activityIcon

    if (canCoalesceActivity) {
      compacted[compacted.length - 1] = normalizedMessage
      return compacted
    }

    if (canGroupActivity) {
      compacted[compacted.length - 1] = {
        ...lastMessage,
        activityCount:
          (lastMessage.activityCount ?? 1) +
          (normalizedMessage.activityCount ?? 1),
        content: normalizedMessage.content,
      }
      return compacted
    }

    const groupedFileMessage =
      lastMessage && mergeFileActivityMessages(lastMessage, normalizedMessage)

    if (groupedFileMessage) {
      compacted[compacted.length - 1] = groupedFileMessage
      return compacted
    }

    compacted.push(normalizedMessage)
    return compacted
  }, [])
}

function appendReadyMessage(messages: ChatMessage[], readyMessage: string) {
  if (
    messages.some(
      (message) => message.role === "assistant" && message.content === readyMessage
    )
  ) {
    return messages
  }

  return [
    ...messages,
    {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: readyMessage,
    },
  ]
}

function mergeFileActivityMessages(
  previousMessage: ChatMessage,
  nextMessage: ChatMessage
) {
  const previousContent = normalizeActivityContent(previousMessage.content)
  const nextContent = normalizeActivityContent(nextMessage.content)

  if (!previousContent || !nextContent) {
    return null
  }

  const previousActivity = getGroupableFileActivity(
    previousMessage,
    previousContent
  )
  const nextActivity = getGroupableFileActivity(nextMessage, nextContent)

  if (
    !previousActivity ||
    !nextActivity ||
    previousActivity.verb !== nextActivity.verb
  ) {
    return null
  }

  const previousCount =
    previousMessage.activityCount ?? getActivityCount(previousMessage.content)
  const nextCount = nextMessage.activityCount ?? getActivityCount(nextMessage.content)

  if (
    previousActivity.targets.length === 1 &&
    nextActivity.targets.length === 1 &&
    previousActivity.targets[0] === nextActivity.targets[0]
  ) {
    return {
      ...previousMessage,
      activityCount: previousCount + nextCount,
      activityKey: undefined,
      content: nextContent,
    }
  }

  if (previousCount > 1 || nextCount > 1) {
    return null
  }

  const activityTargets = [...previousActivity.targets, ...nextActivity.targets]
  const content = formatGroupedFileActivityContent(
    previousActivity.verb,
    activityTargets
  )

  return {
    ...previousMessage,
    activityCount: 1,
    activityGroupKey: getActivityGroupKey(content),
    activityIcon: previousActivity.icon,
    activityKey: undefined,
    activityState: nextMessage.activityState ?? previousMessage.activityState,
    activitySymbol: getActivitySymbol(content),
    activityTargets,
    activityType: previousMessage.activityType ?? nextMessage.activityType,
    content,
  }
}

type GroupableFileActivityVerb = "Created" | "Edited" | "Read"

type GroupableFileActivity = {
  icon: ActivityIcon
  targets: string[]
  verb: GroupableFileActivityVerb
}

function getGroupableFileActivity(
  message: ChatMessage,
  content: string
): GroupableFileActivity | null {
  const icon = getActivityIcon(message, content)
  const verb = getFileActivityVerb(content)

  if (!verb || !isGroupableFileActivityIcon(icon, verb)) {
    return null
  }

  const targetText = getFileActivityTargetText(content, verb)

  if (!targetText || /\b(failed|done|complete)$/i.test(targetText)) {
    return null
  }

  const explicitTargets = normalizeActivityTargets(message.activityTargets)
  if (explicitTargets && !explicitTargets.some(isBroadFileActivityTarget)) {
    return { icon, targets: explicitTargets, verb }
  }

  const targets = getFileActivityTargetsFromTargetText(targetText)
  return targets ? { icon, targets, verb } : null
}

function getFileActivityTargetsFromContent(message: ChatMessage, content: string) {
  const activity = getGroupableFileActivity(message, content)
  return activity?.targets
}

function getFileActivityVerb(content: string): GroupableFileActivityVerb | null {
  const [, verb] =
    stripActivityCount(content).match(/^(Created|Edited|Read)\s+/i) ?? []

  if (!verb) {
    return null
  }

  return `${verb.charAt(0).toUpperCase()}${verb
    .slice(1)
    .toLowerCase()}` as GroupableFileActivityVerb
}

function isGroupableFileActivityIcon(
  icon: ActivityIcon,
  verb: GroupableFileActivityVerb
) {
  if (verb === "Read") {
    return icon === "read"
  }

  return icon === "edit"
}

function getFileActivityTargetText(
  content: string,
  verb: GroupableFileActivityVerb
) {
  const pattern = new RegExp(`^${verb}\\s+(.+)$`, "i")
  return stripActivityCount(content)
    .match(pattern)?.[1]
    ?.replace(/:\s*.*$/, "")
    .replace(/\s+\+\d+$/i, "")
    .trim()
}

function getFileActivityTargetsFromTargetText(targetText: string) {
  const targets = targetText.split(/\s*,\s*/).filter(Boolean)

  if (targets.length === 0 || targets.some(isBroadFileActivityTarget)) {
    return undefined
  }

  return normalizeActivityTargets(targets)
}

function isBroadFileActivityTarget(target: string) {
  const normalized = target.toLowerCase()

  return (
    normalized === "context" ||
    normalized === "files" ||
    normalized === "params truncated" ||
    /[*?\[\]{}]/.test(target)
  )
}

function formatGroupedFileActivityContent(
  verb: GroupableFileActivityVerb,
  targets: string[]
) {
  const visibleTargets = targets.slice(0, GROUPED_FILE_TARGET_LIMIT)
  const hiddenCount = targets.length - visibleTargets.length

  return `${verb} ${visibleTargets.join(", ")}${
    hiddenCount > 0 ? ` +${hiddenCount}` : ""
  }`
}

function normalizeActivityTargets(targets: string[] | undefined) {
  if (!targets) {
    return undefined
  }

  const normalizedTargets = targets
    .map((target) => target.trim())
    .filter(Boolean)

  return normalizedTargets.length > 0 ? normalizedTargets : undefined
}

function areStringArraysEqual(
  previous: string[] | undefined,
  next: string[] | undefined
) {
  const previousValues = normalizeActivityTargets(previous) ?? []
  const nextValues = normalizeActivityTargets(next) ?? []

  return (
    previousValues.length === nextValues.length &&
    previousValues.every((value, index) => value === nextValues[index])
  )
}

function normalizeActivityMessage(message: ChatMessage) {
  if (getMessageDisplayRole(message) !== "activity") {
    return message
  }

  const content = normalizeActivityContent(message.content)
  return content
    ? {
        ...message,
        activityCount: message.activityCount ?? getActivityCount(message.content),
        activityGroupKey: message.activityGroupKey ?? getActivityGroupKey(content),
        activityTargets:
          normalizeActivityTargets(message.activityTargets) ??
          getFileActivityTargetsFromContent(message, content),
        content,
      }
    : null
}

function normalizeActivityContent(content: string) {
  const cleaned = cleanActivityContent(content)
  const normalized = cleaned.trim()

  if (
    /^(running|finished)$/i.test(normalized) ||
    /^run (finished|completed|success)$/i.test(normalized)
  ) {
    return null
  }

  if (/^editing files complete$/i.test(normalized)) {
    return "Edited files"
  }

  if (/^checking changes complete$/i.test(normalized)) {
    return "Checked changes"
  }

  if (/^reading context complete$/i.test(normalized)) {
    return "Read context"
  }

  return normalized.replace(/\bcomplete$/i, "done")
}

function getActivitySymbol(content: string) {
  const words = content
    .replace(/^\*\*(Agent activity|Activity)\*\*\s*/i, "")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)

  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
  }

  return (words[0] ?? "?").slice(0, 2).padEnd(2, "?").toUpperCase()
}

function StarterPrompts({
  onSelect,
}: {
  onSelect: (prompt: string) => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 py-6">
      <div className="flex flex-col gap-1 text-center">
        <div className="mx-auto grid size-8 place-items-center rounded-lg bg-muted text-foreground">
          <Sparkles aria-hidden="true" weight="duotone" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">
          What do you want to build?
        </h2>
        <p className="text-xs text-muted-foreground">
          Pick a starter idea or describe your own app to get going.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STARTER_PROMPTS.map((entry) => (
          <button
            key={entry.title}
            type="button"
            onClick={() => onSelect(entry.prompt)}
            className="group flex flex-col gap-1 rounded-md border border-border bg-card p-2.5 text-left text-xs leading-5 text-muted-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted hover:text-foreground hover:shadow-sm motion-reduce:transform-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="text-sm font-medium text-foreground">
              {entry.title}
            </span>
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {entry.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function AssistantPending() {
  return (
    <div
      className="flex items-center gap-1 py-1 text-muted-foreground"
      aria-label="Assistant is thinking"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  )
}

type KeyboardShortcut = {
  keys: string[]
  description: string
}

const KEYBOARD_SHORTCUTS: ReadonlyArray<KeyboardShortcut> = [
  { keys: ["mod", "k"], description: "Focus the chat input" },
  { keys: ["mod", "/"], description: "Show keyboard shortcuts" },
  { keys: ["mod", "b"], description: "Toggle the projects sidebar" },
  { keys: ["mod", "shift", "o"], description: "Start a new project" },
  { keys: ["mod", "shift", "r"], description: "Refresh the preview" },
  { keys: ["mod", "shift", "l"], description: "Toggle the logs panel" },
]

function KeyboardShortcutsHelpDialog({ onClose }: { onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
  const modLabel = isMac ? "⌘" : "Ctrl"
  const shiftLabel = isMac ? "⇧" : "Shift"

  function renderKey(key: string): string {
    if (key === "mod") return modLabel
    if (key === "shift") return shiftLabel
    if (key === "alt") return isMac ? "⌥" : "Alt"
    return key.length === 1 ? key.toUpperCase() : key
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-md border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2
              id="shortcuts-help-title"
              className="text-base font-semibold tracking-tight"
            >
              Keyboard shortcuts
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Press {modLabel}+/ to toggle this panel.
            </p>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-md text-muted-foreground"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        <ul className="flex flex-col gap-1 p-2 text-sm">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.keys.join("+")}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5"
            >
              <span className="text-foreground">{shortcut.description}</span>
              <span className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((key, index) => (
                  <span key={index} className="flex items-center gap-1">
                    {index > 0 ? (
                      <span className="text-xs text-muted-foreground">+</span>
                    ) : null}
                    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-foreground">
                      {renderKey(key)}
                    </kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ApiKeyOnboardingModal({
  apiKey,
  isCreatingSession,
  sessionError,
  onApiKeyChange,
  onSubmit,
}: {
  apiKey: string
  isCreatingSession: boolean
  sessionError: string | null
  onApiKeyChange: (apiKey: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-onboarding-title"
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-md border bg-card text-card-foreground shadow-lg"
        onSubmit={onSubmit}
      >
        <div className="border-b px-4 py-3">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <div className="grid size-6 place-items-center rounded-md bg-muted text-foreground">
              <Cube aria-hidden="true" size={14} weight="duotone" />
            </div>
            <span className="text-xs font-medium">App Builder</span>
          </div>
          <h2
            id="api-key-onboarding-title"
            className="text-base font-semibold tracking-tight"
          >
            Connect Cursor to start building
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            Add your Cursor API key to start a local preview workspace. You can
            update or clear it later from settings.
          </p>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <label
            htmlFor="onboarding-cursor-api-key"
            className="text-xs font-medium"
          >
            Cursor API key
          </label>
          <Input
            id="onboarding-cursor-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="crsr_..."
            autoComplete="off"
            disabled={isCreatingSession}
            className="h-9 rounded-md font-mono text-sm"
            autoFocus
          />
          {sessionError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
              {sessionError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={!apiKey.trim() || isCreatingSession}
            className="h-9 rounded-md"
          >
            {isCreatingSession ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <ArrowRight data-icon="inline-start" weight="bold" />
            )}
            Start local builder
          </Button>
        </div>
      </form>
    </div>
  )
}

function ConversationSidebar({
  conversations,
  activeConversationId,
  apiKey,
  hasSavedApiKey,
  isApiKeyClearConfirming,
  isApiKeySettingsOpen,
  isCreatingSession,
  sessionError,
  themePreference,
  titleGenerationConversationIds,
  user,
  onApiKeyChange,
  onApiKeySettingsOpenChange,
  onClearSavedApiKey,
  onCreateConversation,
  onDeleteConversation,
  onGenerateName,
  onHideSidebar,
  onRenameConversation,
  onRequireApiKey,
  onSelectConversation,
  onShowKeyboardShortcuts,
  onSubmitApiKey,
  onThemePreferenceChange,
}: {
  conversations: Conversation[]
  activeConversationId: string
  apiKey: string
  hasSavedApiKey: boolean
  isApiKeyClearConfirming: boolean
  isApiKeySettingsOpen: boolean
  isCreatingSession: boolean
  sessionError: string | null
  themePreference: ThemePreference
  titleGenerationConversationIds: ReadonlySet<string>
  user: CurrentUser | null
  onApiKeyChange: (apiKey: string) => void
  onApiKeySettingsOpenChange: (open: boolean) => void
  onClearSavedApiKey: () => void
  onCreateConversation: () => void
  onDeleteConversation: (conversationId: string) => void
  onGenerateName: (conversationId: string) => void
  onHideSidebar: () => void
  onRenameConversation: (conversationId: string, title: string) => void
  onRequireApiKey: () => void
  onSelectConversation: (conversationId: string) => void
  onShowKeyboardShortcuts: () => void
  onSubmitApiKey: (event: FormEvent<HTMLFormElement>) => void
  onThemePreferenceChange: (preference: ThemePreference) => void
}) {
  const [contextMenu, setContextMenu] = useState<ProjectContextMenuState | null>(
    null
  )
  const [renameState, setRenameState] = useState<{
    conversationId: string
    title: string
  } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const filteredConversations = useMemo(
    () => filterConversationsByQuery(conversations, searchQuery),
    [conversations, searchQuery]
  )
  const trimmedSearch = searchQuery.trim()
  const activeRenameConversationId = renameState?.conversationId
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const contextMenuConversation = contextMenu
    ? conversations.find(
        (conversation) => conversation.id === contextMenu.conversationId
      )
    : undefined
  const isContextMenuGeneratingName = Boolean(
    contextMenu &&
      titleGenerationConversationIds.has(contextMenu.conversationId)
  )
  const canGenerateName = Boolean(
    contextMenuConversation?.session &&
      getProjectNameMessages(contextMenuConversation).length > 0 &&
      !isContextMenuGeneratingName
  )

  useEffect(() => {
    if (!contextMenu) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (
        target instanceof Node &&
        contextMenuRef.current?.contains(target)
      ) {
        return
      }

      setContextMenu(null)
      setRenameState(null)
      setDeleteConfirmId(null)
    }

    function handleKeyDown(event: WindowEventMap["keydown"]) {
      if (event.key === "Escape") {
        setContextMenu(null)
        setRenameState(null)
        setDeleteConfirmId(null)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [contextMenu])

  useEffect(() => {
    if (!activeRenameConversationId) {
      return
    }

    renameInputRef.current?.focus()
    renameInputRef.current?.select()
  }, [activeRenameConversationId])

  function openProjectContextMenu(
    event: ReactMouseEvent<HTMLButtonElement>,
    conversationId: string
  ) {
    event.preventDefault()
    event.stopPropagation()

    const margin = 8
    const menuWidth = 176
    const menuHeight = 160
    setContextMenu({
      conversationId,
      x: Math.min(
        Math.max(event.clientX, margin),
        window.innerWidth - menuWidth - margin
      ),
      y: Math.min(
        Math.max(event.clientY, margin),
        window.innerHeight - menuHeight - margin
      ),
    })
    setRenameState(null)
    setDeleteConfirmId(null)
  }

  function startRename() {
    if (!contextMenuConversation) {
      return
    }

    setRenameState({
      conversationId: contextMenuConversation.id,
      title: contextMenuConversation.title,
    })
  }

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!renameState) {
      return
    }

    onRenameConversation(renameState.conversationId, renameState.title)
    setContextMenu(null)
    setRenameState(null)
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/30">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 px-2 pt-2">
          <div className="mb-1 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              className="min-w-0 flex-1 justify-start rounded-md px-2 py-1.5 text-sm text-muted-foreground"
              onClick={hasSavedApiKey ? onCreateConversation : onRequireApiKey}
            >
              <Plus data-icon="inline-start" />
              New project
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-md text-muted-foreground"
              aria-label="Hide projects sidebar"
              title="Hide projects sidebar"
              onClick={onHideSidebar}
            >
              <PanelLeftClose aria-hidden="true" />
            </Button>
          </div>
          {conversations.length > 1 ? (
            <div className="relative mb-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects"
                aria-label="Search projects"
                className="h-8 rounded-md pl-7 text-sm"
              />
            </div>
          ) : null}
          {filteredConversations.length === 0 && trimmedSearch ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              No projects match &ldquo;{trimmedSearch}&rdquo;.
            </p>
          ) : null}
          {filteredConversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId
            const isGeneratingName = titleGenerationConversationIds.has(
              conversation.id
            )

            return (
              <Button
                key={conversation.id}
                type="button"
                variant="ghost"
                className={cn(
                  "relative h-auto w-full justify-start rounded-md px-2 py-1.5 text-left text-muted-foreground",
                  isActive && "bg-muted text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setContextMenu(null)
                  setDeleteConfirmId(null)
                  onSelectConversation(conversation.id)
                }}
                onContextMenu={(event) =>
                  openProjectContextMenu(event, conversation.id)
                }
              >
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
                    <span className="truncate">{conversation.title}</span>
                    {isGeneratingName ? (
                      <Loader2
                        aria-label="Generating project name"
                        className="size-3 shrink-0 animate-spin text-muted-foreground"
                      />
                    ) : null}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground/80">
                    {getConversationPreview(conversation)}
                  </span>
                </span>
              </Button>
            )
          })}
          {contextMenu ? (
            <div
              ref={contextMenuRef}
              role="menu"
              aria-label="Project actions"
              className="fixed z-50 min-w-44 rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-lg"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {renameState ? (
                <form
                  className="flex flex-col gap-2 p-1"
                  onSubmit={submitRename}
                >
                  <Input
                    ref={renameInputRef}
                    value={renameState.title}
                    onChange={(event) =>
                      setRenameState((current) =>
                        current
                          ? { ...current, title: event.target.value }
                          : current
                      )
                    }
                    aria-label="Project name"
                    className="h-8 rounded-sm"
                  />
                  <div className="flex gap-1">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 flex-1 rounded-sm"
                      disabled={!renameState.title.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 flex-1 rounded-sm"
                      onClick={() => setRenameState(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                    onClick={startRename}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                    Rename
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canGenerateName}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => {
                      if (!canGenerateName) {
                        return
                      }

                      const conversationId = contextMenu.conversationId
                      setContextMenu(null)
                      onGenerateName(conversationId)
                    }}
                  >
                    {isContextMenuGeneratingName ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Sparkles aria-hidden="true" className="size-4" />
                    )}
                    {isContextMenuGeneratingName
                      ? "Generating name..."
                      : "Generate name"}
                  </button>
                  {deleteConfirmId === contextMenu.conversationId ? (
                    <div className="flex flex-col gap-1 px-1 py-1">
                      <p className="px-1.5 text-xs text-muted-foreground">
                        Delete this project? The local preview workspace will
                        be removed.
                      </p>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 flex-1 rounded-sm"
                          onClick={() => {
                            const conversationId = contextMenu.conversationId
                            setContextMenu(null)
                            setDeleteConfirmId(null)
                            onDeleteConversation(conversationId)
                          }}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 flex-1 rounded-sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
                      onClick={() =>
                        setDeleteConfirmId(contextMenu.conversationId)
                      }
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      Delete project
                    </button>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>
      </ScrollArea>
      <div className="flex items-center justify-between gap-2 py-2 pl-4 pr-2">
        <div className="min-w-0 flex-1">
          {user ? (
            <p
              className="truncate text-xs font-medium text-muted-foreground"
              title={user.email ? `${user.name} (${user.email})` : user.name}
            >
              {user.name}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-md text-muted-foreground"
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts"
            onClick={onShowKeyboardShortcuts}
          >
            <Keyboard aria-hidden="true" />
          </Button>
          <ThemeToggle
            preference={themePreference}
            onPreferenceChange={onThemePreferenceChange}
          />
          <ApiKeySettingsPopover
            apiKey={apiKey}
            hasSavedApiKey={hasSavedApiKey}
            isClearConfirming={isApiKeyClearConfirming}
            isCreatingSession={isCreatingSession}
            open={isApiKeySettingsOpen}
            sessionError={sessionError}
            onApiKeyChange={onApiKeyChange}
            onClearSavedApiKey={onClearSavedApiKey}
            onOpenChange={onApiKeySettingsOpenChange}
            onSubmit={onSubmitApiKey}
          />
        </div>
      </div>
    </aside>
  )
}

function ApiKeySettingsPopover({
  apiKey,
  hasSavedApiKey,
  isClearConfirming,
  isCreatingSession,
  open,
  sessionError,
  onApiKeyChange,
  onClearSavedApiKey,
  onOpenChange,
  onSubmit,
}: {
  apiKey: string
  hasSavedApiKey: boolean
  isClearConfirming: boolean
  isCreatingSession: boolean
  open: boolean
  sessionError: string | null
  onApiKeyChange: (apiKey: string) => void
  onClearSavedApiKey: () => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-md text-muted-foreground"
            aria-label="Open Cursor API key settings"
            title="Open Cursor API key settings"
          />
        }
      >
        <Settings aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-md">
        <PopoverHeader>
          <PopoverTitle>Cursor API key</PopoverTitle>
          <PopoverDescription>
            {hasSavedApiKey ? "Saved for future projects." : "Required to start."}
          </PopoverDescription>
        </PopoverHeader>
        <form className="flex flex-col gap-2" onSubmit={onSubmit}>
          <FieldGroup className="gap-2">
            <Field>
              <FieldLabel htmlFor="settings-cursor-api-key">API key</FieldLabel>
              <Input
                id="settings-cursor-api-key"
                type="password"
                value={apiKey}
                onChange={(event) => onApiKeyChange(event.target.value)}
                placeholder="crsr_..."
                autoComplete="off"
                disabled={isCreatingSession}
                className="rounded-md"
              />
            </Field>
            {sessionError ? (
              <p role="alert" className="text-sm text-destructive">
                {sessionError}
              </p>
            ) : null}
            <Button
              type="submit"
              className="rounded-md"
              disabled={!apiKey.trim() || isCreatingSession}
            >
              {isCreatingSession ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <ArrowRight data-icon="inline-start" weight="bold" />
              )}
              Save key
            </Button>
          </FieldGroup>
        </form>
        <div className="border-t pt-2">
          <Button
            type="button"
            variant={isClearConfirming ? "destructive" : "ghost"}
            size="sm"
            className="w-full justify-start rounded-md text-muted-foreground"
            disabled={!hasSavedApiKey || isCreatingSession}
            onClick={onClearSavedApiKey}
          >
            {isClearConfirming ? "Confirm clear saved key" : "Clear saved key"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ThemeToggle({
  preference,
  onPreferenceChange,
}: {
  preference: ThemePreference
  onPreferenceChange: (preference: ThemePreference) => void
}) {
  const next = getNextThemePreference(preference)
  const { icon: Icon, label } = getThemePresentation(preference)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="rounded-md text-muted-foreground"
      aria-label={`Theme: ${label}. Switch to ${getThemePresentation(next).label}.`}
      title={`Theme: ${label}`}
      onClick={() => onPreferenceChange(next)}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}

function getThemePresentation(preference: ThemePreference) {
  if (preference === "light") {
    return { icon: Sun, label: "Light" } as const
  }
  if (preference === "dark") {
    return { icon: Moon, label: "Dark" } as const
  }
  return { icon: Desktop, label: "System" } as const
}

function getNextThemePreference(current: ThemePreference): ThemePreference {
  if (current === "system") {
    return "light"
  }
  if (current === "light") {
    return "dark"
  }
  return "system"
}

function useTheme(): [ThemePreference, (preference: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(
    readStoredThemePreference
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    applyTheme(preference)
    if (preference !== "system") {
      return
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [preference])

  const updatePreference = (next: ThemePreference) => {
    setPreference(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    }
    applyTheme(next)
  }

  return [preference, updatePreference]
}

function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system"
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemePreference(stored) ? stored : "system"
}

function CollapsedProjectSidebar({
  onShowSidebar,
}: {
  onShowSidebar: () => void
}) {
  return (
    <div className="flex h-full w-12 shrink-0 flex-col items-center border-r border-border/70 bg-muted/30 py-2 shadow-inner">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-md text-muted-foreground"
        aria-label="Show projects sidebar"
        title="Show projects sidebar"
        onClick={onShowSidebar}
      >
        <PanelLeftOpen aria-hidden="true" />
      </Button>
    </div>
  )
}

function PreviewFrame({
  previewUrl,
  deviceSize,
}: {
  previewUrl: string
  deviceSize: PreviewDeviceSize
}) {
  const option = PREVIEW_DEVICE_OPTIONS.find((entry) => entry.id === deviceSize)
  const width = option?.width ?? null

  if (!width) {
    return (
      <iframe
        title="Generated app preview"
        src={previewUrl}
        className="min-h-0 flex-1 border-0 bg-white"
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-muted/20 p-6">
      <div
        className="flex h-full max-h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-lg"
        style={{ width, maxWidth: "100%" }}
      >
        <iframe
          title="Generated app preview"
          src={previewUrl}
          className="min-h-0 flex-1 border-0 bg-white"
        />
      </div>
    </div>
  )
}

function formatPreviewUrlForToolbar(url: string, maxLength = 52) {
  if (url.length <= maxLength) {
    return url
  }
  const keep = Math.max(8, Math.floor((maxLength - 1) / 2))
  return `${url.slice(0, keep)}…${url.slice(-keep)}`
}

function PreviewToolbar({
  previewUrl,
  isLogsOpen,
  previewDeviceSize,
  onPreviewDeviceSizeChange,
  onRefreshPreview,
  onToggleLogs,
}: {
  previewUrl: string
  isLogsOpen: boolean
  previewDeviceSize: PreviewDeviceSize
  onPreviewDeviceSizeChange: (size: PreviewDeviceSize) => void
  onRefreshPreview: () => void
  onToggleLogs: () => void
}) {
  const { showToast } = useToast()
  const [isCopied, setIsCopied] = useState(false)
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current)
      }
    }
  }, [])

  async function copyPreviewUrl() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return
    }
    try {
      await navigator.clipboard.writeText(previewUrl)
      setIsCopied(true)
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current)
      }
      copyResetRef.current = setTimeout(() => setIsCopied(false), 1_500)
      showToast({
        title: "Preview URL copied",
        description: previewUrl,
      })
    } catch {
      showToast({
        title: "Could not copy preview URL",
        description: "Clipboard access was blocked.",
        variant: "error",
      })
    }
  }

  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b bg-muted/30 px-3 text-xs text-muted-foreground">
      <a
        href={previewUrl}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 truncate font-mono text-muted-foreground transition-colors hover:text-foreground"
        title={previewUrl}
      >
        {formatPreviewUrlForToolbar(previewUrl)}
      </a>
      <div className="flex shrink-0 items-center gap-1">
        <ToggleGroup
          value={[previewDeviceSize]}
          onValueChange={(next) => {
            const value = next[0]
            if (
              value === "mobile" ||
              value === "tablet" ||
              value === "desktop"
            ) {
              onPreviewDeviceSizeChange(value)
            }
          }}
          size="sm"
          variant="outline"
          className="mr-1 h-7 rounded-md border-0 bg-transparent data-[size=sm]:rounded-md"
        >
          {PREVIEW_DEVICE_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = option.id === previewDeviceSize
            return (
              <ToggleGroupItem
                key={option.id}
                value={option.id}
                aria-label={`${option.label} preview (${option.description})`}
                title={`${option.label} (${option.description})`}
                className={cn(
                  "size-7 rounded-md p-0 text-muted-foreground group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-md group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-md data-[state=on]:bg-muted data-[state=on]:text-foreground",
                  isActive && "ring-1 ring-inset ring-border"
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-md"
          aria-label="Refresh preview"
          title="Refresh preview"
          onClick={onRefreshPreview}
        >
          <ArrowClockwise aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-md"
          aria-label={isCopied ? "Preview URL copied" : "Copy preview URL"}
          title={isCopied ? "Copied!" : "Copy preview URL"}
          onClick={copyPreviewUrl}
        >
          {isCopied ? (
            <Check
              aria-hidden="true"
              className="size-4 text-emerald-500"
              weight="bold"
            />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          className="size-7 rounded-md"
          aria-label="Open preview in new tab"
          title="Open preview in new tab"
          render={
            <a href={previewUrl} target="_blank" rel="noreferrer" />
          }
        >
          <ArrowSquareOut aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant={isLogsOpen ? "secondary" : "ghost"}
          size="icon-sm"
          className="size-7 rounded-md"
          aria-label={isLogsOpen ? "Hide logs" : "Show logs"}
          aria-pressed={isLogsOpen}
          title={isLogsOpen ? "Hide logs" : "Show logs"}
          onClick={onToggleLogs}
        >
          <Terminal aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  )
}

type LogEntryView = {
  id: number
  source: string
  line: string
  timestamp: number
}

function LogsPanel({
  sessionId,
  onClose,
}: {
  sessionId: string
  onClose: () => void
}) {
  const { showToast } = useToast()
  const [entries, setEntries] = useState<LogEntryView[]>([])
  const [status, setStatus] = useState<
    "connecting" | "live" | "error"
  >("connecting")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [isCopied, setIsCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPinnedToBottomRef = useRef(true)
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const source = new EventSource(
      `/api/sessions/${encodeURIComponent(sessionId)}/logs`
    )

    const ingest = (incoming: LogEntryView[]) => {
      if (incoming.length === 0) {
        return
      }
      setEntries((current) => {
        const merged = [...current, ...incoming]
        const overflow = merged.length - 500
        return overflow > 0 ? merged.slice(overflow) : merged
      })
    }

    source.addEventListener("snapshot", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as {
          entries?: LogEntryView[]
        }
        ingest(data.entries ?? [])
        setStatus("live")
      } catch {
        // Ignore malformed snapshots; live updates will recover the view.
      }
    })

    source.addEventListener("log", (event) => {
      try {
        const entry = JSON.parse(
          (event as MessageEvent).data
        ) as LogEntryView
        ingest([entry])
      } catch {
        // Ignore malformed entries.
      }
    })

    source.addEventListener("error", (event) => {
      const data = (event as MessageEvent).data
      if (typeof data === "string" && data.length > 0) {
        try {
          const parsed = JSON.parse(data) as { message?: string }
          if (parsed.message) {
            setErrorMessage(parsed.message)
          }
        } catch {
          setErrorMessage("Lost connection to log stream.")
        }
      } else {
        setErrorMessage("Lost connection to log stream.")
      }
      setStatus("error")
    })

    return () => {
      source.close()
    }
  }, [sessionId])

  const sources = useMemo(() => {
    const unique = new Set<string>()
    for (const entry of entries) {
      unique.add(entry.source)
    }
    return Array.from(unique).sort()
  }, [entries])

  const effectiveSourceFilter =
    sourceFilter === "all" || sources.includes(sourceFilter)
      ? sourceFilter
      : "all"

  const visibleEntries = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase()
    return entries.filter((entry) => {
      if (
        effectiveSourceFilter !== "all" &&
        entry.source !== effectiveSourceFilter
      ) {
        return false
      }
      if (!trimmedQuery) {
        return true
      }
      return (
        entry.line.toLowerCase().includes(trimmedQuery) ||
        entry.source.toLowerCase().includes(trimmedQuery)
      )
    })
  }, [entries, searchQuery, effectiveSourceFilter])

  useEffect(() => {
    if (!isPinnedToBottomRef.current) {
      return
    }
    const node = scrollRef.current
    if (!node) {
      return
    }
    node.scrollTop = node.scrollHeight
  }, [visibleEntries])

  function handleScroll(event: ReactUIEvent<HTMLDivElement>) {
    const node = event.currentTarget
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight
    isPinnedToBottomRef.current = distanceFromBottom < 24
  }

  function clearLogs() {
    setEntries([])
    isPinnedToBottomRef.current = true
  }

  function formatEntriesAsText(items: LogEntryView[]) {
    return items
      .map(
        (entry) =>
          `${formatLogTimestamp(entry.timestamp)} [${entry.source}] ${entry.line}`
      )
      .join("\n")
  }

  async function copyVisibleEntries() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return
    }
    if (visibleEntries.length === 0) {
      return
    }
    try {
      await navigator.clipboard.writeText(formatEntriesAsText(visibleEntries))
      setIsCopied(true)
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current)
      }
      copyResetRef.current = setTimeout(() => setIsCopied(false), 1_500)
      showToast({
        title: "Logs copied",
        description: `${visibleEntries.length} ${
          visibleEntries.length === 1 ? "line" : "lines"
        } on the clipboard.`,
      })
    } catch {
      showToast({
        title: "Could not copy logs",
        description: "Clipboard access was blocked.",
        variant: "error",
      })
    }
  }

  function downloadVisibleEntries() {
    if (typeof window === "undefined" || visibleEntries.length === 0) {
      return
    }
    const text = formatEntriesAsText(visibleEntries)
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace(/Z$/, "")
    const filename = `app-builder-logs-${stamp}.txt`
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast({
      title: "Logs downloaded",
      description: filename,
    })
  }

  const trimmedSearch = searchQuery.trim()
  const isFiltering = Boolean(trimmedSearch) || effectiveSourceFilter !== "all"

  return (
    <div className="flex h-64 shrink-0 flex-col border-t bg-zinc-950 text-zinc-100">
      <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 text-xs">
        <div className="flex items-center gap-2">
          <Terminal aria-hidden="true" className="size-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-200">Logs</span>
          <LogsStatusBadge status={status} />
          {isFiltering ? (
            <span className="text-[10px] text-zinc-500">
              {visibleEntries.length}/{entries.length}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyVisibleEntries}
            disabled={visibleEntries.length === 0}
            className="rounded-sm px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title={isCopied ? "Copied!" : "Copy visible logs"}
          >
            {isCopied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={downloadVisibleEntries}
            disabled={visibleEntries.length === 0}
            className="rounded-sm px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title="Download visible logs as a text file"
          >
            Download
          </button>
          <button
            type="button"
            onClick={clearLogs}
            className="rounded-sm px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            title="Clear logs"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            title="Close logs"
            aria-label="Close logs"
          >
            Close
          </button>
        </div>
      </div>
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-zinc-800 px-3">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter logs"
            aria-label="Filter logs"
            className="h-6 w-full rounded-sm border border-zinc-800 bg-zinc-900 pl-6 pr-2 text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <select
          value={effectiveSourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
          aria-label="Filter logs by source"
          className="h-6 max-w-32 rounded-sm border border-zinc-800 bg-zinc-900 px-1.5 text-[11px] text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="all">All sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
      >
        {entries.length === 0 && status !== "error" ? (
          <p className="text-zinc-500">
            {status === "connecting"
              ? "Connecting to session log stream..."
              : "Waiting for output..."}
          </p>
        ) : null}
        {entries.length > 0 && visibleEntries.length === 0 ? (
          <p className="text-zinc-500">
            No log lines match the current filters.
          </p>
        ) : null}
        {errorMessage && status === "error" ? (
          <p className="text-rose-300">{errorMessage}</p>
        ) : null}
        {visibleEntries.map((entry) => (
          <div key={entry.id} className="whitespace-pre-wrap break-words">
            <span className="mr-2 text-zinc-500">
              {formatLogTimestamp(entry.timestamp)}
            </span>
            <span className="mr-2 text-emerald-300">[{entry.source}]</span>
            <span className="text-zinc-100">{entry.line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LogsStatusBadge({
  status,
}: {
  status: "connecting" | "live" | "error"
}) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Live
      </span>
    )
  }

  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-400">
        <span className="size-1.5 rounded-full bg-zinc-500" />
        Connecting
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-rose-300">
      <span className="size-1.5 rounded-full bg-rose-400" />
      Disconnected
    </span>
  )
}

function formatLogTimestamp(value: number) {
  const date = new Date(value)
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

function ProjectChatHeader({
  conversation,
  session,
  title,
  updatedAt,
}: {
  conversation: Conversation
  session: Session
  title: string
  updatedAt: number
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-2 border-b px-3 py-1.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatHeaderUpdatedAt(updatedAt)}
        </p>
      </div>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-md text-muted-foreground"
              aria-label="Show project information"
              title="Show project information"
            />
          }
        >
          <Info aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 rounded-md">
          <PopoverHeader>
            <PopoverTitle>Project info</PopoverTitle>
            <PopoverDescription>
              Local preview and workspace metadata.
            </PopoverDescription>
          </PopoverHeader>
          <dl className="flex flex-col gap-2 text-xs">
            <ProjectInfoRow label="Path" value={session.projectPath} mono />
            <ProjectInfoRow label="Preview" value={session.previewUrl} mono />
            <ProjectInfoRow label="Session" value={session.id} mono />
            <ProjectInfoRow
              label="Created"
              value={formatMetadataTimestamp(conversation.createdAt)}
            />
            <ProjectInfoRow
              label="Updated"
              value={formatMetadataTimestamp(conversation.updatedAt)}
            />
          </dl>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ProjectInfoRow({
  label,
  mono,
  value,
}: {
  label: string
  mono?: boolean
  value: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "break-all rounded-md bg-muted/50 px-2 py-1 text-foreground",
          mono && "font-mono"
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function formatHeaderUpdatedAt(updatedAt: number) {
  if (!isFiniteTimestamp(updatedAt)) {
    return "Updated recently"
  }

  const elapsedMs = Date.now() - updatedAt
  if (elapsedMs < 0 || elapsedMs < 60_000) {
    return "Updated just now"
  }

  const elapsedSeconds = Math.round(elapsedMs / 1000)
  const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
    style: "narrow",
  })
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]

  const [unit, secondsPerUnit] =
    units.find(([, secondsPerUnit]) => elapsedSeconds >= secondsPerUnit) ??
    units[units.length - 1]
  const value = -Math.round(elapsedSeconds / secondsPerUnit)

  return `Updated ${relativeTimeFormat.format(value, unit)}`
}

function formatMetadataTimestamp(value: number) {
  if (!isFiniteTimestamp(value)) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function ModelConfigPopover({
  models,
  selectedModel,
  model,
  onModelChange,
  onParameterChange,
}: {
  models: ModelCatalogItem[]
  selectedModel: ModelCatalogItem
  model: string
  onModelChange: (modelId: string) => void
  onParameterChange: (parameterId: string, value: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 max-w-56 rounded-full border border-transparent px-2.5 text-sm font-normal leading-5 text-muted-foreground hover:bg-muted focus-visible:bg-muted focus-visible:text-foreground"
          />
        }
      >
        <Brain aria-hidden="true" className="size-4" />
        <span className="min-w-0 truncate">
          {getModelSelectionLabel(selectedModel, model)}
        </span>
        <CaretDown aria-hidden="true" className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-md">
        <PopoverHeader>
          <PopoverTitle>Model</PopoverTitle>
          <PopoverDescription>
            Choose a base model and configure its available attributes.
          </PopoverDescription>
        </PopoverHeader>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>Base model</FieldLabel>
            <Select
              items={models.map((option) => ({
                label: option.label,
                value: option.id,
              }))}
              value={selectedModel.id}
              onValueChange={(value) => {
                if (value) {
                  onModelChange(value)
                }
              }}
            >
              <SelectTrigger aria-label="Base model" className="rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" className="rounded-md">
                <SelectGroup>
                  {models.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedModel.description ? (
              <FieldDescription>{selectedModel.description}</FieldDescription>
            ) : null}
          </Field>

          {selectedModel.parameters.map((parameter) => (
            <ModelParameterControl
              key={parameter.id}
              parameter={parameter}
              value={getSelectedParameterValue(model, selectedModel, parameter)}
              onChange={(value) => onParameterChange(parameter.id, value)}
            />
          ))}

          {selectedModel.parameters.length === 0 ? (
            <FieldDescription>
              This model does not expose extra configuration.
            </FieldDescription>
          ) : null}
        </FieldGroup>
      </PopoverContent>
    </Popover>
  )
}

function ModelParameterControl({
  parameter,
  value,
  onChange,
}: {
  parameter: ModelParameterConfig
  value: string
  onChange: (value: string) => void
}) {
  const booleanOptions = getBooleanParameterOptions(parameter)
  if (booleanOptions) {
    const isOn = value === booleanOptions.on.id
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{parameter.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label={parameter.label}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border p-0 transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            isOn ? "border-primary bg-primary" : "border-input bg-muted"
          )}
          onClick={() => {
            onChange(
              isOn ? booleanOptions.off.id : booleanOptions.on.id
            )
          }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0.5 top-1/2 size-4 -translate-y-1/2 rounded-full bg-background shadow-sm transition-transform",
              isOn ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>
    )
  }

  if (parameter.values.length <= 4) {
    return (
      <Field>
        <FieldLabel>{parameter.label}</FieldLabel>
        <ToggleGroup
          value={[value]}
          onValueChange={(nextValue) => {
            if (nextValue[0]) {
              onChange(nextValue[0])
            }
          }}
          size="sm"
          variant="outline"
          className="rounded-md bg-muted/40 data-[size=sm]:rounded-md"
        >
          {parameter.values.map((option) => (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              aria-label={`${parameter.label}: ${option.label}`}
              className="h-7 rounded-md px-2 text-xs text-muted-foreground group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-md group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-md data-[state=on]:bg-background data-[state=on]:text-foreground"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
    )
  }

  return (
    <Field>
      <FieldLabel>{parameter.label}</FieldLabel>
      <Select
        items={parameter.values.map((option) => ({
          label: option.label,
          value: option.id,
        }))}
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onChange(nextValue)
          }
        }}
      >
        <SelectTrigger
          aria-label={parameter.label}
          size="sm"
          className="h-7 rounded-md border-0 bg-muted/60 px-2.5 text-xs font-medium text-muted-foreground data-[size=sm]:rounded-md"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-md">
          <SelectGroup>
            {parameter.values.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="max-w-none text-sm leading-6 text-foreground">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="whitespace-pre-wrap break-words">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="ml-4 list-disc whitespace-normal">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-4 list-decimal whitespace-normal">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          code: ({ children }) => (
            <code className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
              {children}
            </code>
          ),
          pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function MarkdownCodeBlock({ children }: { children: React.ReactNode }) {
  const codeText = useMemo(() => extractTextContent(children), [children])
  const [isCopied, setIsCopied] = useState(false)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  async function copy() {
    if (typeof navigator === "undefined" || !navigator.clipboard || !codeText) {
      return
    }
    try {
      await navigator.clipboard.writeText(codeText)
      setIsCopied(true)
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
      resetTimeoutRef.current = setTimeout(() => setIsCopied(false), 1_500)
    } catch {
      // Clipboard access may be blocked; the code is still selectable inside the block.
    }
  }

  return (
    <div className="group relative my-2 max-w-full">
      <pre className="max-w-full overflow-x-auto rounded-md border bg-muted p-3 text-sm text-foreground">
        {children}
      </pre>
      {codeText ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1.5 top-1.5 size-6 rounded-md bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={isCopied ? "Code copied" : "Copy code"}
          title={isCopied ? "Copied!" : "Copy code"}
          onClick={copy}
        >
          {isCopied ? (
            <Check
              aria-hidden="true"
              className="size-3.5 text-emerald-500"
              weight="bold"
            />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
        </Button>
      ) : null}
    </div>
  )
}

function extractTextContent(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("")
  }
  if (typeof node === "object" && "props" in node) {
    const element = node as { props?: { children?: React.ReactNode } }
    return extractTextContent(element.props?.children)
  }
  return ""
}

function parseServerSentEvent(chunk: string) {
  const eventLine = chunk
    .split("\n")
    .find((line) => line.startsWith("event: "))
  const dataLines = chunk
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length))

  if (!eventLine || dataLines.length === 0) {
    return null
  }

  return {
    event: eventLine.slice("event: ".length),
    data: JSON.parse(dataLines.join("\n")) as unknown,
  }
}

function isCursorApiKey(value: string) {
  return value.startsWith("crsr_")
}

function getSavedCursorApiKey() {
  if (typeof window === "undefined") {
    return undefined
  }

  return window.localStorage.getItem(SAVED_CURSOR_API_KEY)?.trim()
}

class AgentRunCancelledClientError extends Error {
  constructor() {
    super("The agent run was cancelled.")
    this.name = "AgentRunCancelledClientError"
  }
}

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "ResponseAborted")
  )
}

function isCancelledError(error: unknown) {
  return error instanceof AgentRunCancelledClientError
}

function getFriendlyErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "The agent request failed."

  if (message.toLowerCase().includes("already has active run")) {
    return "Cursor is still working on the previous request. Wait a moment and try again."
  }

  return message
}

function sanitizeModelCatalog(models: unknown[]) {
  const byId = new Map<string, ModelCatalogItem>()
  for (const model of models) {
    const catalogItem = toModelCatalogItem(model)
    if (catalogItem && !byId.has(catalogItem.id)) {
      byId.set(catalogItem.id, catalogItem)
    }
  }

  return Array.from(byId.values())
}

function ensureModelCatalog(models: unknown[] | undefined) {
  if (!models?.length) {
    return fallbackModels
  }

  const catalog = sanitizeModelCatalog(models)
  return catalog.length ? catalog : fallbackModels
}

function toModelCatalogItem(value: unknown): ModelCatalogItem | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const maybeCatalogItem = value as Partial<ModelCatalogItem>
  if (
    typeof maybeCatalogItem.id === "string" &&
    typeof maybeCatalogItem.label === "string" &&
    Array.isArray(maybeCatalogItem.parameters)
  ) {
    return {
      id: maybeCatalogItem.id,
      label: maybeCatalogItem.label,
      description:
        typeof maybeCatalogItem.description === "string"
          ? maybeCatalogItem.description
          : undefined,
      parameters: maybeCatalogItem.parameters.filter(isModelParameterConfig),
      defaultParams: Array.isArray(maybeCatalogItem.defaultParams)
        ? maybeCatalogItem.defaultParams.filter(isModelParam)
        : [],
    }
  }

  return null
}

function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") {
    return false
  }

  const user = value as Partial<CurrentUser>
  return (
    typeof user.name === "string" &&
    (typeof user.email === "string" || user.email === undefined)
  )
}

function isModelParameterConfig(value: unknown): value is ModelParameterConfig {
  if (!value || typeof value !== "object") {
    return false
  }

  const parameter = value as Partial<ModelParameterConfig>
  return (
    typeof parameter.id === "string" &&
    typeof parameter.label === "string" &&
    Array.isArray(parameter.values) &&
    parameter.values.every(isModelParameterValue)
  )
}

function isModelParameterValue(value: unknown): value is ModelParameterValue {
  if (!value || typeof value !== "object") {
    return false
  }

  const option = value as Partial<ModelParameterValue>
  return typeof option.id === "string" && typeof option.label === "string"
}

function isModelParam(value: unknown): value is ModelParam {
  if (!value || typeof value !== "object") {
    return false
  }

  const param = value as Partial<ModelParam>
  return typeof param.id === "string" && typeof param.value === "string"
}

function getSelectedModel(models: ModelCatalogItem[], value: string) {
  const selection = parseModelSelectionValue(value)
  return models.find((model) => model.id === selection.id) ?? models[0] ?? fallbackModels[0]
}

function isModelSelectionAvailable(models: ModelCatalogItem[], value: string) {
  const selection = parseModelSelectionValue(value)
  return models.some((model) => model.id === selection.id)
}

function encodeModelForCatalogItem(model: ModelCatalogItem) {
  return encodeModelSelection({
    id: model.id,
    params: normalizeSelectedParams(model, model.defaultParams),
  })
}

function getSelectedParameterValue(
  encodedSelection: string,
  selectedModel: ModelCatalogItem,
  parameter: ModelParameterConfig
) {
  const selection = parseModelSelectionValue(encodedSelection)
  const selectedParam = selection.params?.find(
    (param) => param.id === parameter.id
  )
  const defaultParam = selectedModel.defaultParams.find(
    (param) => param.id === parameter.id
  )

  return (
    selectedParam?.value ??
    defaultParam?.value ??
    parameter.values[0]?.id ??
    ""
  )
}

function getModelSelectionLabel(
  selectedModel: ModelCatalogItem,
  encodedSelection: string
) {
  const selection = parseModelSelectionValue(encodedSelection)
  const configuredValues = selectedModel.parameters
    .map((parameter) => {
      const selectedValue = getSelectedParameterValue(
        encodedSelection,
        selectedModel,
        parameter
      )
      const option = parameter.values.find((value) => value.id === selectedValue)
      return getModelParameterLabel(parameter, option)
    })
    .filter(Boolean)

  if (!configuredValues.length || selection.id !== selectedModel.id) {
    return selectedModel.label
  }

  return `${selectedModel.label} · ${configuredValues.join(" · ")}`
}

function getModelParameterLabel(
  parameter: ModelParameterConfig,
  option: ModelParameterValue | undefined
) {
  if (!option) {
    return undefined
  }

  const booleanOptions = getBooleanParameterOptions(parameter)
  if (!booleanOptions) {
    return option.label
  }

  if (option.id === booleanOptions.off.id) {
    return undefined
  }

  return getBooleanOnLabel(parameter, option)
}

function getBooleanParameterOptions(parameter: ModelParameterConfig) {
  if (parameter.values.length !== 2) {
    return null
  }

  const on = parameter.values.find((value) => isOnValue(value))
  const off = parameter.values.find((value) => isOffValue(value))

  return on && off ? { on, off } : null
}

function getBooleanOnLabel(
  parameter: ModelParameterConfig,
  option: ModelParameterValue
) {
  return isGenericBooleanLabel(option.label) ? parameter.label : option.label
}

function isOnValue(option: ModelParameterValue) {
  const value = normalizeBooleanValue(option.id)
  const label = normalizeBooleanValue(option.label)
  return (
    ["true", "on", "enabled", "enable", "yes"].includes(value) ||
    label === "true"
  )
}

function isOffValue(option: ModelParameterValue) {
  const value = normalizeBooleanValue(option.id)
  const label = normalizeBooleanValue(option.label)
  return (
    ["false", "off", "disabled", "disable", "no"].includes(value) ||
    label === "false"
  )
}

function isGenericBooleanLabel(label: string) {
  return ["true", "on", "enabled", "enable", "yes"].includes(
    normalizeBooleanValue(label)
  )
}

function normalizeBooleanValue(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "")
}

function normalizeSelectedParams(
  model: ModelCatalogItem,
  selectedParams: ModelParam[] | undefined
) {
  return model.parameters.map((parameter) => {
    const selectedParam = selectedParams?.find(
      (param) => param.id === parameter.id
    )
    const defaultParam = model.defaultParams.find(
      (param) => param.id === parameter.id
    )

    return {
      id: parameter.id,
      value:
        selectedParam?.value ??
        defaultParam?.value ??
        parameter.values[0]?.id ??
        "",
    }
  })
}

function encodeModelSelection(selection: { id: string; params?: ModelParam[] }) {
  const params = selection.params?.filter((param) => param.value)
  return JSON.stringify({
    id: selection.id,
    ...(params?.length ? { params } : {}),
  })
}

function parseModelSelectionValue(value: string): {
  id: string
  params?: ModelParam[]
} {
  try {
    const parsed = JSON.parse(value) as { id?: unknown; params?: unknown }
    if (typeof parsed.id === "string") {
      return {
        id: parsed.id,
        params: Array.isArray(parsed.params)
          ? parsed.params.filter(isModelParam)
          : undefined,
      }
    }
  } catch {}

  return { id: fallbackModels[0].id }
}

class SessionRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message)
  }
}

function isMissingApiKeyError(error: unknown) {
  return error instanceof SessionRequestError && error.code === "missing_api_key"
}

async function requestSession(
  apiKey?: string,
  sessionId?: string,
  options?: { persistApiKey?: boolean }
): Promise<Session> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      persistApiKey: options?.persistApiKey,
      sessionId,
    }),
  })
  const data = (await response.json()) as {
    code?: string
    error?: string
  }

  if (!response.ok) {
    throw new SessionRequestError(
      data.error ?? "Failed to create a session.",
      data.code
    )
  }

  return data as Session
}

function getConversationById(
  conversations: Conversation[],
  conversationId: string
) {
  return conversations.find((conversation) => conversation.id === conversationId)
}

function createRuntimeState(): ConversationRuntimeState {
  return {
    isRunning: false,
    isCreatingSession: false,
    isCursorTyping: false,
    sessionError: null,
  }
}

function createEmptyConversation(title: string): Conversation {
  const now = Date.now()
  return {
    id: createConversationId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
    input: "",
    model: fallbackModelSelection,
    session: null,
  }
}

function createConversationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `conversation-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getNextConversationTitle(conversations: Conversation[]) {
  const nextNumber =
    conversations.reduce((highest, conversation) => {
      const [, number] = conversation.title.match(/^Project (\d+)$/) ?? []
      return number ? Math.max(highest, Number(number)) : highest
    }, 0) + 1

  return `Project ${nextNumber}`
}

function shouldGenerateProjectName(conversation: Conversation) {
  return isPlaceholderProjectTitle(conversation.title)
}

function isPlaceholderProjectTitle(title: string) {
  const normalized = title.trim()
  return (
    !normalized ||
    normalized === "Untitled project" ||
    /^Project \d+$/i.test(normalized)
  )
}

function sanitizeProjectTitle(value: string) {
  const title = value
    .replace(/[`*_#>]+/g, "")
    .replace(/^[-\s"']+|[-\s"'.:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()

  if (!title) {
    return ""
  }

  return title.length > 42 ? `${title.slice(0, 39).trim()}...` : title
}

function getProjectNameErrorMessage(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "Project name generation timed out. Try again."
  }

  const message = error instanceof Error ? error.message.trim() : ""
  if (!message) {
    return "Could not generate a project name."
  }

  if (/project name generation timed out/i.test(message)) {
    return message
  }

  if (/^could not generate (a )?project name\.?$/i.test(message)) {
    return "Could not generate a project name."
  }

  return `Could not generate a project name. ${message}`
}

function filterConversationsByQuery(
  conversations: Conversation[],
  query: string
): Conversation[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return conversations
  }

  return conversations.filter((conversation) => {
    if (conversation.title.toLowerCase().includes(trimmed)) {
      return true
    }

    return conversation.messages.some((message) => {
      if (
        message.role !== "user" &&
        message.role !== "assistant" &&
        message.role !== "system"
      ) {
        return false
      }
      return message.content.toLowerCase().includes(trimmed)
    })
  })
}

function getConversationPreview(conversation: Conversation) {
  const lastMessage = [...conversation.messages]
    .reverse()
    .find((message) => getMessageDisplayRole(message) !== "activity")
  const preview = lastMessage?.content.replace(/\s+/g, " ").trim()

  if (preview) {
    return preview.length > 48 ? `${preview.slice(0, 45)}...` : preview
  }

  return conversation.session ? "Preview ready" : "No preview yet"
}

function getProjectNameMessages(conversation: Conversation): ProjectNameMessage[] {
  const messages = conversation.messages
    .filter(
      (message): message is ChatMessage & { role: ProjectNameMessage["role"] } =>
        message.role === "assistant" || message.role === "user"
    )
    .map((message) => ({
      role: message.role,
      content: message.content.replace(/\s+/g, " ").trim(),
    }))
    .filter((message) => message.content)

  const firstUserMessageIndex = messages.findIndex(
    (message) => message.role === "user"
  )
  if (firstUserMessageIndex === -1) {
    return []
  }

  const conversationContext = messages.slice(firstUserMessageIndex)
  return conversationContext.length > 12
    ? [conversationContext[0], ...conversationContext.slice(-11)]
    : conversationContext
}

function readPersistedAppState(): PersistedAppState {
  if (typeof window === "undefined") {
    return createInitialAppState()
  }

  try {
    const raw = window.localStorage.getItem(SAVED_CHAT_STATE)
    if (!raw) {
      return createInitialAppState()
    }

    const parsed = JSON.parse(raw) as unknown
    const appState = parsePersistedAppState(parsed)
    if (appState) {
      return appState
    }
  } catch {
    return createInitialAppState()
  }

  return createInitialAppState()
}

function createInitialAppState(): PersistedAppState {
  const conversation = createEmptyConversation("Project 1")
  return {
    version: 2,
    activeConversationId: conversation.id,
    conversations: [conversation],
  }
}

function parsePersistedAppState(value: unknown): PersistedAppState | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const parsed = value as Partial<PersistedAppState>
  if (parsed.version !== 2 || !Array.isArray(parsed.conversations)) {
    return null
  }

  const conversations = parsed.conversations
    .map(normalizePersistedConversation)
    .filter((conversation): conversation is Conversation => Boolean(conversation))

  if (conversations.length === 0) {
    return null
  }

  const activeConversationId =
    typeof parsed.activeConversationId === "string" &&
    conversations.some(
      (conversation) => conversation.id === parsed.activeConversationId
    )
      ? parsed.activeConversationId
      : conversations[0].id

  return {
    version: 2,
    activeConversationId,
    conversations,
  }
}

function normalizePersistedConversation(value: unknown): Conversation | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const conversation = value as Partial<Conversation>
  if (
    typeof conversation.id !== "string" ||
    typeof conversation.title !== "string"
  ) {
    return null
  }

  return {
    id: conversation.id,
    title: conversation.title || "Untitled project",
    createdAt: isFiniteTimestamp(conversation.createdAt)
      ? conversation.createdAt
      : Date.now(),
    updatedAt: isFiniteTimestamp(conversation.updatedAt)
      ? conversation.updatedAt
      : Date.now(),
    messages: Array.isArray(conversation.messages)
      ? compactActivityMessages(conversation.messages.filter(isChatMessage))
      : [],
    input: typeof conversation.input === "string" ? conversation.input : "",
    model:
      typeof conversation.model === "string"
        ? conversation.model
        : fallbackModelSelection,
    session: normalizeSession(conversation.session),
  }
}

function normalizeSession(value: unknown): Session | null {
  if (!isSession(value)) {
    return null
  }

  return {
    ...value,
    models: ensureModelCatalog(value.models),
    user: isCurrentUser(value.user) ? value.user : null,
  }
}

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function writePersistedAppState(state: PersistedAppState) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(SAVED_CHAT_STATE, JSON.stringify(state))
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false
  }

  const message = value as Partial<ChatMessage>
  return (
    typeof message.id === "string" &&
    typeof message.content === "string" &&
    (message.activityCount === undefined ||
      (typeof message.activityCount === "number" &&
        Number.isFinite(message.activityCount))) &&
    (message.activityGroupKey === undefined ||
      typeof message.activityGroupKey === "string") &&
    (message.activityIcon === undefined ||
      isActivityIcon(message.activityIcon)) &&
    (message.activityState === undefined ||
      message.activityState === "active" ||
      message.activityState === "complete") &&
    (message.activityTargets === undefined ||
      (Array.isArray(message.activityTargets) &&
        message.activityTargets.every((target) => typeof target === "string"))) &&
    (message.role === "activity" ||
      message.role === "assistant" ||
      message.role === "user" ||
      message.role === "system")
  )
}

function isActivityIcon(value: unknown): value is ActivityIcon {
  return typeof value === "string" && value in activityIconMap
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") {
    return false
  }

  const session = value as Partial<Session>
  return (
    typeof session.id === "string" &&
    typeof session.previewUrl === "string" &&
    typeof session.projectPath === "string" &&
    Array.isArray(session.models) &&
    (session.user === null ||
      session.user === undefined ||
      isCurrentUser(session.user))
  )
}
