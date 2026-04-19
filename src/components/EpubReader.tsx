import { useEffect, useRef } from 'react'
import ePub from 'epubjs'
import type { Book, Rendition, NavItem } from 'epubjs'
import type { ReaderLocation } from './Reader'

interface Props {
  file: File
  onLocationChange: (loc: ReaderLocation) => void
  navCommand: 'prev' | 'next' | null
  onCommandConsumed: () => void
}

export function EpubReader({
  file,
  onLocationChange,
  navCommand,
  onCommandConsumed,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const tocRef = useRef<NavItem[]>([])

  useEffect(() => {
    if (!viewportRef.current) return

    let cancelled = false
    const viewport = viewportRef.current

    file.arrayBuffer().then((buffer) => {
      if (cancelled) return

      const book = ePub(buffer)
      bookRef.current = book

      const rendition = book.renderTo(viewport, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        spread: 'none',
      })
      renditionRef.current = rendition

      book.loaded.navigation.then((nav) => {
        tocRef.current = nav.toc
      })

      rendition.on('relocated', (location: any) => {
        const cfi = location.start.cfi
        const chapterLabel = findChapterLabel(tocRef.current, cfi, book)
        const atStart = location.atStart === true
        const atEnd = location.atEnd === true

        onLocationChange({
          label: chapterLabel,
          canGoPrev: !atStart,
          canGoNext: !atEnd,
        })
      })

      rendition.display()
    })

    return () => {
      cancelled = true
      if (renditionRef.current) {
        renditionRef.current.destroy()
        renditionRef.current = null
      }
      if (bookRef.current) {
        bookRef.current.destroy()
        bookRef.current = null
      }
    }
  }, [file, onLocationChange])

  useEffect(() => {
    if (!navCommand || !renditionRef.current) return

    if (navCommand === 'prev') {
      renditionRef.current.prev()
    } else if (navCommand === 'next') {
      renditionRef.current.next()
    }

    onCommandConsumed()
  }, [navCommand, onCommandConsumed])

  return <div ref={viewportRef} className="epub-viewport" />
}

function findChapterLabel(toc: NavItem[], cfi: string, book: Book): string {
  try {
    const spineItem = book.spine.get(cfi)
    if (!spineItem) return 'Reading...'
    const href = spineItem.href

    for (const item of toc) {
      if (item.href === href || href.endsWith(item.href)) {
        return item.label.trim()
      }
      if (item.subitems) {
        for (const sub of item.subitems) {
          if (sub.href === href || href.endsWith(sub.href)) {
            return sub.label.trim()
          }
        }
      }
    }
    return 'Reading...'
  } catch {
    return 'Reading...'
  }
}
