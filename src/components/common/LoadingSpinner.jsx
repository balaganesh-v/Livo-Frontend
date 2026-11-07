export default function LoadingSpinner({ label = 'Loading…', small = false }) {
  return <span className={`spinner${small ? ' small' : ''}`} role="status" aria-label={label} />
}
