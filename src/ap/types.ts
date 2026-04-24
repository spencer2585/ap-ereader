// Server -> Client message types

export interface RoomInfo {
    cmd: 'RoomInfo'
    version: NetworkVersion
    generator_version: NetworkVersion
    tags: string[]
    password: boolean
    permissions: Record<string, number>
    hint_cost: number
    location_check_points: number
    games: string[]
    datapackage_checksums: Record<string, string>
    seed_name: string
    time: number
}

export interface Connected {
    cmd: 'Connected'
    team: number
    slot: number
    players: NetworkPlayer[]
    missing_locations: number[]
    checked_locations: number[]
    slot_data: Record<string, unknown>
    slot_info: Record<string, NetworkSlot>
    hint_points: number
}

export interface ConnectionRefused {
    cmd: 'ConnectionRefused'
    errors?: string[]
}

export interface ReceivedItems {
    cmd: 'ReceivedItems'
    index: number
    items: NetworkItem[]
}

export interface PrintJSON {
    cmd: 'PrintJSON'
    data: JSONMessagePart[]
    type?: string
    receiving?: number
    item?: NetworkItem
    found?: boolean
    team?: number
    slot?: number
    message?: string
    tags?: string[]
    countdown?: number
}

export interface RoomUpdate {
    cmd: 'RoomUpdate'
    hint_points?: number
    players?: NetworkPlayer[]
    checked_locations?: number[]
    missing_locations?: number[]
    [key: string]: unknown
}

export type ServerMessage =
    | RoomInfo
    | Connected
    | ConnectionRefused
    | ReceivedItems
    | PrintJSON
    | RoomUpdate

// Client -> Server message types

export interface Connect {
    cmd: 'Connect'
    password: string
    game: string
    name: string
    uuid: string
    version: NetworkVersion
    items_handling: number
    tags: string[]
    slot_data?: boolean
}

export interface LocationChecks {
    cmd: 'LocationChecks'
    locations: number[]
}

export interface Sync {
    cmd: 'Sync'
}

export type ClientMessage = Connect | LocationChecks | Sync

// Shared protocol shapes

export interface NetworkVersion {
    major: number
    minor: number
    build: number
    class: 'Version'
}

export interface NetworkPlayer {
    team: number
    slot: number
    alias: string
    name: string
}

export interface NetworkSlot {
    name: string
    game: string
    type: number
    group_members: number[]
}

export interface NetworkItem {
    item: number
    location: number
    player: number
    flags: number
}

export interface JSONMessagePart {
    type?: string
    text?: string
    color?: string
    flags?: number
    player?: number
}