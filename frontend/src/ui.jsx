import React from 'react';

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
