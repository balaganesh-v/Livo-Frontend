export default function AuthField({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, trailing, minLength, maxLength }) {
  return <label className="field">
    <span className="field-label">{label}</span>
    <span className="input-wrap"><Icon className="input-icon"/><input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} minLength={minLength ?? (type === 'password' ? 1 : undefined)} maxLength={maxLength ?? (type === 'password' ? 128 : undefined)} required/>{trailing}</span>
  </label>
}
