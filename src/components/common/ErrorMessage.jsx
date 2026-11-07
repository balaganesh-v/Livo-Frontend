export default function ErrorMessage({ children, success = false }) {
  return <div role={success ? 'status' : 'alert'} className={`notice ${success ? 'success' : 'error'}`}>{children}</div>
}
