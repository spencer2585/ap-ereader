import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { ReaderLocation } from './Reader'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface Props {
    file: File
    onLocationChange: (loc: ReaderLocation) => void
    navCommand: 'prev' | 'next' | null
    onCommandConsumed: () => void
}

export function PdfReader({
    file,
    onLocationChange,
    navCommand,
    onCommandConsumed,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const pdfRef = useRef<PDFDocumentProxy | null>(null)
    const renderTaskRef = useRef <RenderTask | null>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const [numPages, setNumPages] = useState(0)

    useEffect(()=> {
        let cancelled = false

        file.arrayBuffer().then((buffer) => {
            if (cancelled) return
            return pdfjsLib.getDocument({ data: buffer}).promise
        }).then((pdf)=> {
            if (cancelled || !pdf) return
            pdfRef.current = pdf
            setNumPages(pdf.numPages)
            setCurrentPage(1)
        })

        return () => {
            cancelled = true
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel()
                renderTaskRef.current = null
            }
            if (pdfRef.current) {
                pdfRef.current.destroy()
                pdfRef.current = null
            }
        }
    }, [file])

    useEffect(() => {
        if (!pdfRef.current || !canvasRef.current || !containerRef.current) return
        if (numPages === 0) return

        const pdf = pdfRef.current
        const canvas = canvasRef.current
        const container = containerRef.current

        let cancelled = false

        pdf.getPage(currentPage).then((page) => {
            if (cancelled) return

            const unscaledViewport = page.getViewport({ scale: 1.0 })
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight
            const scaleX = containerWidth / unscaledViewport.width
            const scaleY = containerHeight / unscaledViewport.height
            const scale = Math.min(scaleX, scaleY)

            const viewport = page.getViewport({ scale })
            const dpr = window.devicePixelRatio || 1

            canvas.width = Math.floor(viewport.width * dpr)
            canvas.height = Math.floor(viewport.height * dpr)
            canvas.style.width = `${Math.floor(viewport.width)}px`
            canvas.style.height = `${Math.floor(viewport.height)}px`

            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel()
            }

            const task = page.render({
                canvas,
                canvasContext: ctx,
                viewport,
                transform,
            })
            renderTaskRef.current = task

            task.promise.then(() => {
                if (cancelled) return
                renderTaskRef.current = null
            }).catch((err) => {
                if (err?.name !== 'RenderingCancelledException') {
                    console.error('PDF render error: ',err)
                }
            })
        })

        return () => {
            cancelled = true
        }
    }, [currentPage, numPages])

    useEffect(() => {
        if (numPages === 0) return
        onLocationChange({
            label: `Page ${currentPage} of  ${numPages}`,
            canGoPrev: currentPage > 1,
            canGoNext: currentPage < numPages,
        })
    }, [currentPage, numPages, onLocationChange])

    useEffect(() => {
        if (!navCommand) return

        if (navCommand === 'prev' && currentPage > 1) {
            setCurrentPage((p) => p - 1)
        } else if (navCommand === 'next' && currentPage < numPages) {
            setCurrentPage((p) => p + 1)
        }

        onCommandConsumed()
    }, [navCommand, currentPage, numPages, onCommandConsumed])

    return (
        <div ref={containerRef} className="pdf-container">
        <canvas ref={canvasRef} className = "pdf-canvas" />
            </div>
    )
}