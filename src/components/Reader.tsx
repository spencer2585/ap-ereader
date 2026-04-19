import { useState } from 'react'
import { EpubReader } from './EpubReader'
import { PdfReader } from './PdfReader'

type BookFormat = 'epub' | 'pdf'

export interface ReaderLocation {
    label: string
    canGoPrev: boolean
    canGoNext: boolean
}

interface Props {
    file: File
    format: BookFormat
    url: string
    onClose: () => void
}

export function Reader({ file, format, url, onClose}: Props){
    const [location, setLocation] = useState<ReaderLocation>({
        label: 'Loading...',
        canGoPrev: false,
        canGoNext: false,
    })

    const [navCommand, setNavCommand] = useState<'prev' | 'next' | null>(null)

    function goPrev(){
        setNavCommand('prev')
    }

    function goNext(){
        setNavCommand('next')
    }

    function handleCommandConsumed(){
        setNavCommand(null)
    }

    return(
        <div className="reader">
            <header className="reader-header">
                <button onClick={onClose}> Close</button>
                <span className="reader-title">{file.name}</span>
            </header>

            <div className="reader=viewport">
                {format === 'epub'? (
                    <EpubReader
                    file={file}
                    onLocationChange={setLocation}
                    navCommand={navCommand}
                    onCommandConsumed={handleCommandConsumed}
                    />
                ):(
                    <PdfReader
                    url={url}
                    onLocationChange={setLocation}
                    navCommand={navCommand}
                    onCommandConsumed={handleCommandConsumed}
                    />
                )}
            </div>

            <footer className="reader-footer">
                <button onClick={goPrev} disabled={!location.canGoPrev}>
                    Previous
                </button>
                <span className="reader-location">{location.label}</span>
                <button onClick={goNext} disabled={!location.canGoNext}>
                    Next
                </button>
            </footer>
        </div>
    )
}