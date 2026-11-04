import React, {Component, useEffect, useRef, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {createMerchantController} from './controller.js';
import * as elements from './ui.jsx';
import Landing from './Landing.jsx';

let version=0, dialog=null, toastMessage='', toastTimer;
const listeners=new Set();
const notify=()=>{version++;listeners.forEach(listener=>listener());};
const subscribe=listener=>{listeners.add(listener);return()=>listeners.delete(listener);};
const snapshot=()=>version;
const closeModal=()=>{dialog=null;notify();};
const toast=message=>{clearTimeout(toastTimer);toastMessage=message;notify();toastTimer=setTimeout(()=>{toastMessage='';notify();},4500);};
const go=to=>{if(location.hash==='#/'+to)notify();else location.hash='/'+to;};
const controller=createMerchantController({ui:{...elements,esc:value=>String(value??''),go,toast,closeModal,
  modal:(title,body,footer=null,options={})=>{dialog={title,body,footer,...options};notify();}},rerender:notify});

function Dialog({value}) {
  const ref=useRef();
  useEffect(()=>{
    const previous=document.activeElement;
    const app=document.getElementById('merchant-app');
    if(app)app.inert=true;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';ref.current?.focus();
    return()=>{if(app)app.inert=false;document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
  },[]);
  function onKeyDown(event) {
    if(event.key==='Escape'){event.preventDefault();closeModal();}
    if(event.key!=='Tab')return;
    const items=[...ref.current.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(n=>!n.disabled);
    const first=items[0],last=items.at(-1);
    if(!first){event.preventDefault();return;}
    if(event.shiftKey && (document.activeElement===first || document.activeElement===ref.current)){event.preventDefault();last.focus();}
    else if(!event.shiftKey && (document.activeElement===last || document.activeElement===ref.current)){event.preventDefault();first.focus();}
  }
  return createPortal(<div className="modal-backdrop"><section ref={ref} className={`dialog ${value.cls || ''}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} onKeyDown={onKeyDown}><header className="dialog-header"><div><h2 id="dialog-title">{value.title}</h2>{value.subtitle && <p>{value.subtitle}</p>}</div><button className="icon-btn" data-action="close" aria-label="Close">×</button></header><div className="dialog-body">{value.body}</div>{value.footer && <footer className="dialog-footer">{React.Children.toArray(value.footer)}</footer>}</section></div>,document.getElementById('overlay'));
}
class ErrorBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<main className="auth-main"><div className="auth-form"><h1>Unable to display this page</h1><p>Please reload Invent IO and try again.</p><button className="primary" onClick={()=>location.reload()}>Reload</button></div></main>:this.props.children;}
}
export function App() {
  useSyncExternalStore(subscribe,snapshot);
  useEffect(()=>{
    const changed=()=>{closeModal();scrollTo(0,0);};
    addEventListener('hashchange',changed);
    return()=>removeEventListener('hashchange',changed);
  },[]);
  const [path,query]=location.hash.replace(/^#\/?/,'').split('?');
  const route=path || 'welcome';
  const screen=controller.render(route,new URLSearchParams(query));
  useEffect(()=>{controller.enter(route);document.title=route==='welcome'?'Invent IO · Every sale, automatically tracked.':'Invent IO';},[route]);
  return <div onClick={controller.onClick} onInput={controller.onInput} onChange={controller.onChange} onSubmit={controller.onSubmit}>
    <div id="merchant-app" key={route}>{screen ?? <Landing/>}</div>
    {dialog && <Dialog value={dialog}/>}
    {createPortal(<>{toastMessage}</>,document.getElementById('toast'))}
  </div>;
}
// The status region is outside the React app so dialogs can make only the app inert.
subscribe(()=>document.getElementById('toast').classList.toggle('show',!!toastMessage));
createRoot(document.getElementById('app')).render(<ErrorBoundary><App/></ErrorBoundary>);
