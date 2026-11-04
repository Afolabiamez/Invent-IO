import React, {useState} from 'react';

// Only developer-authored field attributes are accepted here; user values stay React text/props.
export function attributes(source = '') {
  if (typeof source === 'object') return source;
  const result = {};
  const names = {autocomplete:'autoComplete',inputmode:'inputMode',minlength:'minLength',maxlength:'maxLength',tabindex:'tabIndex'};
  for (const match of source.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
    const name = names[match[1]] || match[1];
    result[name] = match[2] ?? true;
  }
  return result;
}
export const ico = name => <span className="icon" aria-hidden="true"><img src={`assets/${name}.svg`} alt="" /></span>;
export const brand = () => <span className="brand"><span className="brand-mark">{ico('logo')}</span><span>Invent IO</span></span>;
export const btn = (label, action, cls='primary', attrs='') => <button className={cls} data-action={action} {...attributes(attrs)}>{label}</button>;
export const link = (label, to, cls='text-btn') => <a className={cls} href={`#/${to}`}>{label}</a>;
export const field = (name,label,value='',type='text',hint='',attrs='') => <label className="field">{label}<input name={name} type={type} defaultValue={value} {...attributes(attrs)} />{hint && <span className="hint">{hint}</span>}<span className="error" data-error={name} /></label>;
export const notice = (copy,tone='') => <div className={`notice ${tone}`}>{ico('info')}<div>{copy}</div></div>;
export const empty = (title,copy,action=null) => <div className="empty">{ico('package')}<h2>{title}</h2><p>{copy}</p>{action}</div>;
export const kv = (label,value) => <div className="kv"><span>{label}</span><strong>{value}</strong></div>;
export const status = (label,kind='') => <span className={`status ${kind}`}>{label}</span>;

const eyeOpen=<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
const eyeOff=<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>;
export function PasswordField({name,label,hint='',attrs={},extra=null}) {
  const [shown,setShown] = useState(false);
  return <label className="field">{label}<span className="password-wrap"><input name={name} type={shown?'text':'password'} {...attrs} /><button type="button" className="eye-btn" aria-label={shown?'Hide password':'Show password'} aria-pressed={shown} onClick={()=>setShown(v=>!v)}>{shown?eyeOff:eyeOpen}</button></span>{hint && <span className="hint">{hint}</span>}<span className="error" data-error={name} /><span className="pw-row"><button type="button" className="text-btn pw-toggle" aria-pressed={shown} onClick={()=>setShown(v=>!v)}>{shown?'Hide password':'Show password'}</button>{extra}</span></label>;
}
