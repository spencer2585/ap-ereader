import { useState } from 'react'
import { FilePicker } from './components/FilePicker'
import './App.css'

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
        <div>
          <p>Book Loaded: {book.file.name} ({book.format}) </p>
          <button onClick={handleCloseBook}>Close Book</button>
        </div>
      ):(
        <FilePicker onFileSelected={handleFileSelected}/>
      )}
    </div>
  )
}

export default App
