import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          AI Folder Organizer
        </h1>

        <p className="mt-5 text-lg text-slate-300">
          Intelligent file management assistant
        </p>

        <button className="mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-purple-500 transition">
          Get Started
        </button>
      </div>
    </div>
  )
}

export default App