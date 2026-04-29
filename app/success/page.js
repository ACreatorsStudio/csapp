"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();
  useEffect(function() {
    setTimeout(function() { router.push("/"); }, 4000);
  }, []);
  return (
    <div style={{ minHeight:"100vh", background:"#f0f0f0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
      <div style={{ fontSize:28, fontWeight:900, letterSpacing:-1, marginBottom:8 }}>Welcome to Creator!</div>
      <div style={{ fontSize:15, color:"#888", marginBottom:32 }}>Your account has been upgraded. Redirecting you now...</div>
      <div style={{ width:200, height:4, background:"#d8d8d8", borderRadius:4 }}>
        <div style={{ width:"100%", height:4, background:"linear-gradient(90deg,#4ecdc4,#7ed957,#f9c74f,#f4845f,#e07bb5,#c77dff)", borderRadius:4, animation:"progress 4s linear" }}/>
      </div>
    </div>
  );
}
