import { useEffect } from 'react'
import type { ReaderLocation } from './Reader'

interface Props{
    url:string
    onLocationChange: (loc: ReaderLocation) => void
    navCommands: 'prev'|'next'|null
    onCommandConsumed:()=>void
}

export function PdfReader({url, onLocationChange}: Props){
    useEffect(()=>{
        onLocationChange({
            label:'PdfReader stub:' + url,
            canGoPrev: false,
            canGoNext:false,
        })
    },[url, onLocationChange])

    return <div>PdfReader placeholder</div>
}