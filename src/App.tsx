import { useState } from 'react'
import { FilePicker } from './components/FilePicker'
import { Reader } from './components/Reader'
import { ApClient } from './ap/ApClient'
import './App.css'

type BookFormat = 'epub' | 'pdf'
type View = 'reader' | 'ap'

interface LoadedBook {
  file: File
  format: BookFormat
  url: string
}

function App() {
  const [view, setView] = useState<View>('ap')
  const [book, setBook] = useState<LoadedBook | null>(null)

  function handleFileSelected(file: File, format: BookFormat, url: string) {
    setBook({ file, format, url })
  }

  function handleCloseBook() {
    if (book) {
      URL.revokeObjectURL(book.url)
      setBook(null)
    }
  }

  return (
      <div className="app">
        <nav className="view-nav">
          <button
              onClick={() => setView('reader')}
              className={view === 'reader' ? 'active' : ''}
          >
            Reader
          </button>
          <button
              onClick={() => setView('ap')}
              className={view === 'ap' ? 'active' : ''}
          >
            AP Connection
          </button>
        </nav>

        <div className="view-content">
          {view === 'reader' ? (
              book ? (
                  <Reader
                      file={book.file}
                      format={book.format}
                      url={book.url}
                      onClose={handleCloseBook}
                  />
              ) : (
                  <FilePicker onFileSelected={handleFileSelected} />
              )
          ) : (
              <ApClient />
          )}
        </div>
      </div>
  )
}

export default App