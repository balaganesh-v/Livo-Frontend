import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'

export default function BackButton() {
  const navigate = useNavigate()

  function goBack() {
    const historyIndex = window.history.state?.idx
    const hasPreviousRoute = Number.isInteger(historyIndex) && historyIndex > 0

    if (hasPreviousRoute) navigate(-1)
    else navigate('/dashboard', { replace: true })
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-lg border border-[#343047] bg-[#161827] px-3 py-2 text-xs font-semibold text-[#d8d7ec] transition-colors hover:border-[#7062ca] hover:bg-[#1d1b32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7565ed]"
      aria-label="Go back"
    >
      <FiArrowLeft aria-hidden="true" />
      <span>Back</span>
    </button>
  )
}
