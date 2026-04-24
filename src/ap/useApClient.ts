import { useCallback, useEffect, useReducer, useRef } from 'react'
import type {
    ServerMessage,
    ClientMessage,
    RoomInfo,
    Connected,
    NetworkItem,
    JSONMessagePart,
} from './types'

export type ConnectionStatus =
    | 'idle'
    | 'connecting'
    | 'roomInfo'
    | 'connected'
    | 'refused'
    | 'disconnected'
    | 'error'

export interface ApState {
    status: ConnectionStatus
    roomInfo: RoomInfo | null
    connectedInfo: Connected | null
    receivedItems: NetworkItem[]
    messageLog: PrintJSONEntry[]
    lastError: string | null
}

export interface PrintJSONEntry {
    id: number
    parts: JSONMessagePart[]
    type?: string
    timestamp: number
}

type Action =
    | { type: 'CONNECTING' }
    | { type: 'SOCKET_OPEN' }
    | { type: 'ROOM_INFO'; payload: RoomInfo }
    | { type: 'CONNECTED'; payload: Connected }
    | { type: 'REFUSED'; errors: string[] }
    | { type: 'RECEIVED_ITEMS'; index: number; items: NetworkItem[] }
    | { type: 'PRINT_JSON'; entry: PrintJSONEntry }
    | { type: 'DISCONNECTED' }
    | { type: 'ERROR'; message: string }
    | { type: 'RESET' }

const initialState: ApState = {
    status: 'idle',
    roomInfo: null,
    connectedInfo: null,
    receivedItems: [],
    messageLog: [],
    lastError: null,
}

function reducer(state: ApState, action: Action): ApState {
    switch (action.type) {
        case 'CONNECTING':
            return { ...initialState, status: 'connecting' }
        case 'SOCKET_OPEN':
            return { ...state, status: 'connecting' }
        case 'ROOM_INFO':
            return { ...state, status: 'roomInfo', roomInfo: action.payload }
        case 'CONNECTED':
            return { ...state, status: 'connected', connectedInfo: action.payload }
        case 'REFUSED':
            return {
                ...state,
                status: 'refused',
                lastError: action.errors.join(', ') || 'Connection refused',
            }
        case 'RECEIVED_ITEMS': {
            const existing = state.receivedItems.slice(0, action.index)
            return { ...state, receivedItems: [...existing, ...action.items] }
        }
        case 'PRINT_JSON':
            return {
                ...state,
                messageLog: [...state.messageLog, action.entry].slice(-500),
            }
        case 'DISCONNECTED':
            return { ...state, status: 'disconnected' }
        case 'ERROR':
            return { ...state, status: 'error', lastError: action.message }
        case 'RESET':
            return initialState
        default:
            return state
    }
}

export interface ConnectParams {
    address: string
    port: number
    slotName: string
    game: string
    password: string
    useTLS: boolean
}

export function useApClient() {
    const [state, dispatch] = useReducer(reducer, initialState)
    const socketRef = useRef<WebSocket | null>(null)
    const printJsonIdRef = useRef(0)

    const send = useCallback((msg: ClientMessage) => {
        const socket = socketRef.current
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn('Attempted to send while socket not open:', msg)
            return
        }
        socket.send(JSON.stringify([msg]))
    }, [])

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
        dispatch({ type: 'DISCONNECTED' })
    }, [])

    const connect = useCallback((params: ConnectParams) => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }

        dispatch({ type: 'CONNECTING' })

        const protocol = params.useTLS ? 'wss' : 'ws'
        const url = `${protocol}://${params.address}:${params.port}`

        let socket: WebSocket
        try {
            socket = new WebSocket(url)
        } catch (err) {
            dispatch({
                type: 'ERROR',
                message: err instanceof Error ? err.message : 'Failed to create socket',
            })
            return
        }

        socketRef.current = socket

        socket.onopen = () => {
            dispatch({ type: 'SOCKET_OPEN' })
        }

        socket.onmessage = (event) => {
            let messages: ServerMessage[]
            try {
                messages = JSON.parse(event.data)
            } catch (err) {
                console.error('Failed to parse server message:', event.data)
                return
            }

            for (const msg of messages) {
                handleServerMessage(msg, dispatch, send, params, printJsonIdRef)
            }
        }

        socket.onerror = () => {
            dispatch({ type: 'ERROR', message: 'WebSocket error' })
        }

        socket.onclose = () => {
            socketRef.current = null
            dispatch({ type: 'DISCONNECTED' })
        }
    }, [send])

    const sendLocationChecks = useCallback((locationIds: number[]) => {
        if (locationIds.length === 0) return
        send({ cmd: 'LocationChecks', locations: locationIds })
    }, [send])

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' })
    }, [])

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
            }
        }
    }, [])

    return {
        ...state,
        connect,
        disconnect,
        sendLocationChecks,
        reset,
    }
}

function handleServerMessage(
    msg: ServerMessage,
    dispatch: React.Dispatch<Action>,
    send: (msg: ClientMessage) => void,
    params: ConnectParams,
    printJsonIdRef: React.MutableRefObject<number>,
) {
    switch (msg.cmd) {
        case 'RoomInfo': {
            dispatch({ type: 'ROOM_INFO', payload: msg })
            send({
                cmd: 'Connect',
                password: params.password,
                game: params.game,
                name: params.slotName,
                uuid: crypto.randomUUID(),
                version: { major: 0, minor: 5, build: 0, class: 'Version' },
                items_handling: 0b111,
                tags: ['AP'],
                slot_data: true,
            })
            break
        }
        case 'Connected':
            dispatch({ type: 'CONNECTED', payload: msg })
            break
        case 'ConnectionRefused':
            dispatch({ type: 'REFUSED', errors: msg.errors ?? [] })
            break
        case 'ReceivedItems':
            dispatch({ type: 'RECEIVED_ITEMS', index: msg.index, items: msg.items })
            break
        case 'PrintJSON': {
            printJsonIdRef.current += 1
            dispatch({
                type: 'PRINT_JSON',
                entry: {
                    id: printJsonIdRef.current,
                    parts: msg.data,
                    type: msg.type,
                    timestamp: Date.now(),
                },
            })
            break
        }
        case 'RoomUpdate':
            // TODO: handle room updates (checked locations, hint points, etc.)
            break
    }
}