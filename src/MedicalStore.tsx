/* eslint-disable */
import React from "react";
import { Package, LogOut, CheckCircle, Eye, EyeOff, X } from "lucide-react";
// ERROR BOUNDARY - catches React render crashes
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: {children: React.ReactNode}) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:"30px",background:"#fef2f2",minHeight:"100vh",fontFamily:"monospace"}}>
          <h2 style={{color:"#dc2626",fontSize:"18px",marginBottom:"12px"}}>⚠️ App Crashed - Error:</h2>
          <pre style={{background:"#fff",padding:"16px",borderRadius:"8px",fontSize:"12px",overflowX:"auto",color:"#dc2626",border:"1px solid #fecaca",whiteSpace:"pre-wrap"}}>
            {this.state.error?.message}\n\n{this.state.error?.stack}
          </pre>
          <button onClick={()=>this.setState({error:null})} style={{marginTop:"16px",padding:"10px 20px",background:"var(--color-primary)",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px"}}>
            🔄 Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { MedicalStoreProvider, useMedicalStore, inp, lbl, btn } from "./MedicalStoreContext";
import OwnerPanel from "./OwnerPanel";

function ShivDharaApp() {
  const {
    currentUser,
    toast, confirmDialog, setConfirmDialog, printHtml, setPrintHtml,
    showShortcuts, setShowShortcuts, alertCount,
    authStatus, authInput, setAuthInput,
    showPass, setShowPass,
    handleLogin, handleSetupAccount, handleLogout,
    uiScale, zoomIn, zoomOut, setPresetScale,
  } = useMedicalStore();

  const [updaterMsg, setUpdaterMsg] = React.useState<{text:string,percent:number,ready?:boolean}|null>(null);

  React.useEffect(() => {
    // @ts-ignore
    if (window.require) {
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      const handleUpdaterMessage = (event: any, payload: any) => {
        if (payload.type === 'update-available') {
          setUpdaterMsg({ text: 'New update found! Downloading...', percent: 0 });
        } else if (payload.type === 'download-progress') {
          setUpdaterMsg({ text: 'Downloading update...', percent: Math.round(payload.progress.percent) });
        } else if (payload.type === 'update-downloaded') {
          setUpdaterMsg({ text: 'Update ready! Click to restart.', percent: 100, ready: true });
        }
      };
      ipcRenderer.on('updater-message', handleUpdaterMessage);
      return () => ipcRenderer.removeListener('updater-message', handleUpdaterMessage);
    }
  }, []);

  // ═══════════════════════════════════════════════════
  // RENDER AUTH
  // ═══════════════════════════════════════════════════
  if(!currentUser) {
    if (authStatus === "loading") {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(135deg, var(--bg-body), #e2e8f0)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
          <div style={{width:"48px",height:"48px",border:"4px solid rgba(32,201,151,0.3)",borderTop:"4px solid var(--color-primary)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
          <div style={{color:"var(--color-text-dark)",fontSize:"14px",fontWeight:"600",opacity:0.9}}>Connecting to server...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg, var(--bg-body), #e2e8f0)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Segoe UI,system-ui,sans-serif",padding:"20px"}}>
        {toast&&<div style={{position:"fixed",top:"20px",right:"20px",background:toast.type==="error"?"#fee2e2":"#d1fae5",color:toast.type==="error"?"#dc2626":"#059669",padding:"12px 18px",borderRadius:"5px",fontWeight:"600",fontSize:"13px",zIndex:9999,boxShadow:"0 4px 15px rgba(0,0,0,0.2)"}}>{toast.msg}</div>}
        <div style={{background:"white",padding:"32px",borderRadius:"8px",boxShadow:"0 20px 50px rgba(0,0,0,0.3)",width:"100%",maxWidth:"420px"}}>
          <div>
            <div style={{textAlign:"center",marginBottom:"20px"}}>
              <div style={{width:"52px",height:"52px",borderRadius:"6px",background:"linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><Package size={26} color="white"/></div>
              <h2 style={{fontSize:"20px",fontWeight:"700",color:"#1a3a5c",margin:"0 0 4px"}}>Shiv Dhara Medical</h2>
              <p style={{color:"#6c757d",fontSize:"12px",margin:0,letterSpacing:"0.3px"}}>Owner Portal</p>
            </div>

            {authStatus==="setup"&&(
              <div>
                <p style={{textAlign:"center",fontSize:"13px",color:"#dc2626",fontWeight:"bold",marginBottom:"15px"}}>First Time Setup Required</p>
                {[{k:"name",l:"Owner Name *",t:"text",ph:"Your name"},{k:"pharmacyName",l:"Pharmacy Name",t:"text",ph:"Shiv Dhara Medical Store"},{k:"email",l:"Email *",t:"email",ph:"Email"},{k:"password",l:"Password *",t:"password",ph:"Min 6 characters"},{k:"confirmPassword",l:"Confirm Password *",t:"password",ph:"Confirm password"}].map(f=>(
                  <div key={f.k} style={{marginBottom:"10px"}}><label style={lbl}>{f.l}</label><input type={f.t} value={authInput[f.k as keyof typeof authInput]} onChange={e=>setAuthInput({...authInput,[f.k]:f.t==="password"?e.target.value:e.target.value.toUpperCase()})} onKeyDown={e=>e.key==="Enter"&&handleSetupAccount()} placeholder={f.ph} style={inp}/></div>
                ))}
                <button onClick={handleSetupAccount} style={{...btn("#2563eb"),width:"100%",justifyContent:"center",padding:"11px",marginTop:"4px"}}><CheckCircle size={14}/>Complete Setup</button>
              </div>
            )}
            {authStatus==="login"&&(
              <div>
                <div style={{marginBottom:"12px"}}><label style={lbl}>Email</label><input type="email" value={authInput.email} onChange={e=>setAuthInput({...authInput,email:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Owner email" style={inp}/></div>
                <div style={{marginBottom:"20px"}}><label style={lbl}>Password</label><div style={{position:"relative"}}><input type={showPass?"text":"password"} value={authInput.password} onChange={e=>setAuthInput({...authInput,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Password" style={{...inp,paddingRight:"38px",textTransform:"none"}}/><button onClick={()=>setShowPass(!showPass)} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}>{showPass?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></div>
                <button onClick={handleLogin} style={{...btn("#2563eb"),width:"100%",justifyContent:"center",padding:"11px"}}>Login to Portal</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER MAIN APP ──────────────────────────────
  return (
    <div style={{height:"100vh",background:"#f1f5f9",fontFamily:"Segoe UI,system-ui,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
      {toast&&<div style={{position:"fixed",top:"18px",right:"18px",background:toast.type==="error"?"#fee2e2":"#d1fae5",color:toast.type==="error"?"#dc2626":"#059669",padding:"11px 16px",borderRadius:"5px",fontWeight:"600",fontSize:"13px",zIndex:9999,boxShadow:"0 4px 15px rgba(0,0,0,0.2)"}}>{toast.msg}</div>}

      {updaterMsg && (
        <div style={{position:"fixed",bottom:"20px",left:"20px",background:"#1e293b",color:"white",padding:"16px",borderRadius:"8px",zIndex:9999,boxShadow:"0 10px 25px rgba(0,0,0,0.3)",width:"300px",display:"flex",flexDirection:"column",gap:"8px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:"13px",fontWeight:"600"}}>{updaterMsg.text}</span>
            <span style={{fontSize:"12px",color:"#94a3b8"}}>{updaterMsg.percent}%</span>
          </div>
          <div style={{width:"100%",height:"4px",background:"#334155",borderRadius:"2px",overflow:"hidden"}}>
            <div style={{width:`${updaterMsg.percent}%`,height:"100%",background:"var(--color-primary)",transition:"width 0.2s ease"}}/>
          </div>
          {updaterMsg.ready && (
            <button onClick={() => { if(window.require) window.require('electron').ipcRenderer.send('install-update'); }} style={{marginTop:"8px",padding:"6px 12px",background:"var(--color-primary)",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"12px",fontWeight:"bold"}}>Install Now</button>
          )}
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div style={{background:"linear-gradient(90deg,#1a3a5c,#1e5276)",padding:"0 16px",color:"var(--color-text-dark)",display:"flex",justifyContent:"space-between",alignItems:"center",height:"50px",boxShadow:"0 2px 12px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <Package size={20} color="white"/>
          <div>
            <div style={{fontWeight:"800",fontSize:"14px",color:"white"}}>Shiv Dhara Medical Store</div>
            <div style={{fontSize:"10px",color:"#bfdbfe",display:"flex",alignItems:"center",gap:"6px"}}>
              <span>{currentUser.name} · Owner</span>
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          {/* ─── SCREEN DENSITY / FIT CONTROLLER ─── */}
          <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,0.14)",borderRadius:"8px",padding:"2px 6px",border:"1px solid rgba(255,255,255,0.25)",gap:"4px"}}>
            <button 
              onClick={zoomOut} 
              title="Zoom Out / Make More Dense (Ctrl + -)" 
              style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:"4px",width:"22px",height:"22px",cursor:"pointer",fontWeight:"bold",fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center"}}
            >
              −
            </button>
            <select
              value={Math.round((uiScale || 1.0) * 100)}
              onChange={(e) => setPresetScale(parseInt(e.target.value) / 100)}
              title="Screen Fit & UI Density"
              style={{background:"transparent",border:"none",color:"white",fontSize:"12px",fontWeight:"700",cursor:"pointer",outline:"none",padding:"2px 4px"}}
            >
              <option value="100" style={{color:"#000"}}>🖥️ Normal (100%)</option>
              <option value="90" style={{color:"#000"}}>💻 Medium (90%)</option>
              <option value="85" style={{color:"#000"}}>🏪 Shop PC (85%)</option>
              <option value="75" style={{color:"#000"}}>⚡ Dense POS (75%)</option>
              <option value="68" style={{color:"#000"}}>📦 Ultra Fit (68%)</option>
            </select>
            <button 
              onClick={zoomIn} 
              title="Zoom In / Make Bigger (Ctrl + +)" 
              style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:"4px",width:"22px",height:"22px",cursor:"pointer",fontWeight:"bold",fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center"}}
            >
              +
            </button>
          </div>

          {alertCount>0&&(
            <div style={{background:"#ef4444",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:"700",color:"white"}}>⚠️ {alertCount}</div>
          )}
          <button onClick={()=>setShowShortcuts(p=>!p)} title="Keyboard Shortcuts (?)" style={{background:"rgba(255,255,255,0.15)",border:"none",padding:"5px 10px",borderRadius:"8px",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:"700"}}>⌨️</button>

          <button onClick={handleLogout} style={{background:"rgba(255,255,255,0.15)",border:"none",padding:"6px 11px",borderRadius:"8px",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:"600",display:"flex",alignItems:"center",gap:"5px"}}><LogOut size={14} color="white"/></button>
        </div>
      </div>

      {/* ── OWNER PANEL: nav bar + all owner sections ── */}
      <OwnerPanel />

      {/* ── CONFIRM DIALOG ── */}
      {confirmDialog&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"white",borderRadius:"8px",padding:"24px",maxWidth:"380px",width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"12px",color:"#1a3a5c"}}>⚠️ Confirm</div>
            <div style={{fontSize:"14px",color:"#475569",marginBottom:"20px",lineHeight:"1.5"}}>{confirmDialog.msg}</div>
            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmDialog(null)} style={{...btn("#64748b"),padding:"8px 20px"}}>Cancel</button>
              <button onClick={()=>{confirmDialog.onOk();setConfirmDialog(null);}} style={{...btn("#ef4444"),padding:"8px 20px"}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT MODAL ── */}
      {printHtml&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div style={{background:"white",borderRadius:"8px",width:"100%",maxWidth:"720px",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 25px 60px rgba(0,0,0,0.4)"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#1a3a5c",borderRadius:"8px 8px 0 0"}}>
              <span style={{color:"white",fontWeight:"700",fontSize:"14px"}}>🖨️ Bill Preview</span>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{const iframe=document.getElementById("printFrame") as HTMLIFrameElement;if(iframe && iframe.contentWindow)iframe.contentWindow.print();}} style={{...btn("#16a34a"),padding:"6px 16px"}}>🖨️ Print</button>
                <button onClick={()=>setPrintHtml(null)} style={{...btn("#ef4444"),padding:"6px 12px"}}><X size={13}/>Close</button>
              </div>
            </div>
            <iframe id="printFrame" srcDoc={printHtml} style={{flex:1,border:"none",borderRadius:"0 0 8px 8px"}} title="Bill Preview"/>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShivDharaMedicalStore() {
  return (
    <ErrorBoundary>
      <MedicalStoreProvider>
        <ShivDharaApp />
      </MedicalStoreProvider>
    </ErrorBoundary>
  );
}
