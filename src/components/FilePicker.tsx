import { useRef } from 'react'
import type { ChangeEvent }from 'react'

type BookFormat = 'epub' | 'pdf'

interface Props {
    onFileSelected:(file:File, format:BookFormat, url:string)=> void
}

function detectFormat(file: File): BookFormat | null{
    const name = file.name.toLowerCase()
    if (name.endsWith('.epub')) return 'epub'
    if (name.endsWith('.pdf')) return 'pdf'
    return null
}

export function FilePicker({ onFileSelected }: Props){
    const inputRef = useRef<HTMLInputElement>(null)

    function handleChange(e:ChangeEvent<HTMLInputElement>){
        const file = e.target.files?.[0]
        if (!file) {
            return
        }

        const format = detectFormat(file)

        if (!format){
            alert('Please select an EPUB or PDF file.')
            return
        }

        const url = URL.createObjectURL(file)

        onFileSelected(file, format, url)
    }

    return (
        <div className="file-picker">
            <h1>AP E-Reader</h1>
            <p>Select an EPUB or PDF to begin reading.</p>
            <input
            ref={inputRef}
            type="file"
            accept=".epub,.pdf"
            onChange={handleChange}
            />
        </div>
    )
}