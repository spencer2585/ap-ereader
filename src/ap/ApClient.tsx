import { useState } from 'react'
import { useApClient } from '../ap/useApClient'
import type { JSONMessagePart } from '../ap/types'

function partClass(part: JSONMessagePart): string {
    const classes = ['ap-log-part']
    if (part.type) classes.push(`ap-log-part-${part.type}`)
    if (part.flags) {
        if (part.flags & 1) classes.push('ap-log-part-progression')
        if (part.flags & 2) classes.push('ap-log-part-useful')
        if (part.flags & 4) classes.push('ap-log-part-trap')
    }
    return classes.join(' ')
}

function partText(part: JSONMessagePart): string {
    if (part.text !== undefined) return part.text
    return ''
}

function itemClass(flags: number): string {
    const classes = ['ap-item']
    if (flags & 1) classes.push('ap-item-progression')
    if (flags & 2) classes.push('ap-item-useful')
    if (flags & 4) classes.push('ap-item-trap')
    return classes.join(' ')
}

function LocationCheckTest({
                               sendChecks,
                           }: {
    sendChecks: (ids: number[]) => void
}) {
    const [input, setInput] = useState('')

    function handleSend() {
        const ids = input
            .split(/[\s,]+/)
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n))
        if (ids.length === 0) return
        sendChecks(ids)
        setInput('')
    }

    return (
        <section className="ap-location-test">
            <h3>Send Location Checks (test)</h3>
            <div className="ap-location-form">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Location IDs (comma or space separated)"
                />
                <button onClick={handleSend} disabled={!input.trim()}>
                    Send
                </button>
            </div>
        </section>
    )
}

export function ApClient() {
    const ap = useApClient()

    const [address, setAddress] = useState('archipelago.gg')
    const [port, setPort] = useState('')
    const [slotName, setSlotName] = useState('')
    const [game, setGame] = useState('')
    const [password, setPassword] = useState('')
    const [useTLS, setUseTLS] = useState(true)

    function handleConnect() {
        const portNum = parseInt(port, 10)
        if (!portNum) {
            alert('Invalid port')
            return
        }
        ap.connect({
            address,
            port: portNum,
            slotName,
            game,
            password,
            useTLS,
        })
    }

    const isConnected = ap.status === 'connected'
    const isConnecting = ap.status === 'connecting' || ap.status === 'roomInfo'

    return (
        <div className="ap-client">
            <section className="ap-connection">
                <h2>Connection</h2>
                <div className="ap-form">
                    <label>
                        Address
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={isConnected || isConnecting}
                        />
                    </label>
                    <label>
                        Port
                        <input
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            disabled={isConnected || isConnecting}
                            placeholder="e.g. 38281"
                        />
                    </label>
                    <label>
                        Slot Name
                        <input
                            value={slotName}
                            onChange={(e) => setSlotName(e.target.value)}
                            disabled={isConnected || isConnecting}
                        />
                    </label>
                    <label>
                        Game
                        <input
                            value={game}
                            onChange={(e) => setGame(e.target.value)}
                            disabled={isConnected || isConnecting}
                            placeholder="e.g. A Link to the Past"
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isConnected || isConnecting}
                        />
                    </label>
                    <label className="ap-tls">
                        <input
                            type="checkbox"
                            checked={useTLS}
                            onChange={(e) => setUseTLS(e.target.checked)}
                            disabled={isConnected || isConnecting}
                        />
                        Use TLS (wss://)
                    </label>

                    <div className="ap-actions">
                        {isConnected || isConnecting ? (
                            <button onClick={ap.disconnect}>Disconnect</button>
                        ) : (
                            <button onClick={handleConnect}>Connect</button>
                        )}
                    </div>

                    <div className="ap-status">
                        Status: <strong>{ap.status}</strong>
                        {ap.lastError && <div className="ap-error">{ap.lastError}</div>}
                    </div>
                </div>
            </section>

            {ap.roomInfo && (
                <section className="ap-room-info">
                    <h3>Room Info</h3>
                    <div>Seed: {ap.roomInfo.seed_name}</div>
                    <div>Games: {ap.roomInfo.games.join(', ')}</div>
                    <div>Password required: {ap.roomInfo.password ? 'yes' : 'no'}</div>
                </section>
            )}

            {ap.connectedInfo && (
                <section className="ap-connected-info">
                    <h3>Connected</h3>
                    <div>Team: {ap.connectedInfo.team}</div>
                    <div>Slot: {ap.connectedInfo.slot}</div>
                    <div>Checked: {ap.connectedInfo.checked_locations.length}</div>
                    <div>Missing: {ap.connectedInfo.missing_locations.length}</div>
                </section>
            )}

            {ap.receivedItems.length > 0 && (
                <section className="ap-items">
                    <h3>Received Items ({ap.receivedItems.length})</h3>
                    <ol className="ap-items-list">
                        {ap.receivedItems.map((item, idx) => (
                            <li key={idx} className={itemClass(item.flags)}>
                                <span className="ap-item-id">#{item.item}</span>
                                <span className="ap-item-meta">
            from slot {item.player}, location {item.location}
          </span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {ap.messageLog.length > 0 && (
                <section className="ap-log">
                    <h3>Message Log ({ap.messageLog.length})</h3>
                    <div className="ap-log-list">
                        {ap.messageLog.map((entry) => (
                            <div key={entry.id} className="ap-log-entry">
                                {entry.parts.map((part, idx) => (
                                    <span key={idx} className={partClass(part)}>
              {partText(part)}
            </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {ap.status === 'connected' && (
                <LocationCheckTest sendChecks={ap.sendLocationChecks} />
            )}
        </div>
    )
}