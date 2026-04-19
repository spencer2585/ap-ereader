import { useState } from 'react'
import { FilePicker } from './components/FilePicker'
import './App.css'
import { Reader } from './components/Reader'

type BookFormat = 'epub' | 'pdf'

interface LoadedBook {
  file: File
  format: BookFormat
  url: string
}

function App() {
  const [book,setBook] = useState<LoadedBook | null>(null)

  function handleFileSelected(file: File, format: BookFormat, url: string)
  {
    setBook({ file, format, url })
  }

  function handleCloseBook(){
    if(book){
      URL.revokeObjectURL(book.url)
      setBook(null)
    }
  }

  return (
    <div className="app">
      {book ? (
        <Reader
        file={book.file}
        format = {book.format}
        url={book.url}
        onClose={handleCloseBook}
        />
      ):(
        <FilePicker onFileSelected={handleFileSelected}/>
      )}
    </div>
  )
}

export default App
