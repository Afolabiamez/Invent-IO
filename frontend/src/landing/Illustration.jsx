import React,{useLayoutEffect,useRef,useState} from 'react';
export default function Illustration({width,height,children}) {
 const ref=useRef(),[scale,setScale]=useState(1);
 useLayoutEffect(()=>{const observer=new ResizeObserver(([entry])=>setScale(Math.min(1,entry.contentRect.width/width)));observer.observe(ref.current);return()=>observer.disconnect();},[width]);
 return <div ref={ref} className="lp-illustration" style={{width:'100%',maxWidth:width,height:height*scale,position:'relative'}} aria-label="Product illustration"><div style={{position:'absolute',width,height,transform:`scale(${scale})`,transformOrigin:'top left'}}>{children}</div></div>;
}
