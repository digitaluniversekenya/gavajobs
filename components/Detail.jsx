'use client'

import { useState, useRef, useEffect } from 'react'
import ScoreRing from './ScoreRing'
import { C } from '../constants/theme'
import { isManagement } from '../services/matchingEngine'
import { matchColor, matchLabel, dl, ini, waShare } from '../utils/helpers'
import { PROF_QUALS } from '../constants/profQuals'
import { PROF_BODIES } from '../constants/profBodies'

export default function Detail({ job, saved, onSave, onClose, profile, onBuildProfile, getMatch, onSelect, followedEmps, onToggleFollow, premium, onUnlockPremium, allOpenJobs }) {
  const ref = useRef(null)
  const [showPayment, setShowPayment] = useState(false)
  const [phone, setPhone] = useState("")
  const [payState, setPayState] = useState("idle")
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0 }, [job?.id])
  
  if (!job) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto", scrollbarWidth:"thin" }}>
        <div style={{ padding:"40px 24px 32px", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:3, marginBottom:20 }}>
            <span style={{ fontSize:10, fontWeight:700, color:C.white, background:C.green, padding:"3px 8px", borderRadius:4, textTransform:"uppercase", letterSpacing:".05em" }}>Free</span>
            <span style={{ fontSize:11, color:C.text3 }}>No sign-up required to browse</span>
          </div>
          <h2 style={{ fontSize:24, fontWeight:800, color:C.text, lineHeight:1.25, marginBottom:10 }}>Know which jobs <span style={{ color:C.red }}>match</span><br/>your qualifications</h2>
          <p style={{ fontSize:14, color:C.text2, lineHeight:1.6, maxWidth:380, margin:"0 auto 24px" }}>
            We analyse every Kenya government job vacancy and tell you exactly which requirements you meet — so you can apply with confidence.
          </p>
          {!profile ? (
            <button onClick={onBuildProfile} style={{ fontFamily:"inherit", fontSize:15, fontWeight:700, padding:"14px 32px", borderRadius:12, background:C.red, color:C.white, border:"none", cursor:"pointer", marginBottom:8, boxShadow:"0 2px 8px rgba(200,16,46,.25)" }}>
              Build your profile — takes 2 minutes
            </button>
          ) : (
            <p style={{ fontSize:13, color:C.green, fontWeight:600 }}>✓ Profile active — tap any job to see your match</p>
          )}
        </div>
        <div style={{ padding:"0 24px 28px" }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:14 }}>How it works</p>
          {[
            { icon:"📋", title:"Build your profile", desc:"Education, qualifications, experience — 2 minutes" },
            { icon:"🎯", title:"See your match score", desc:"Every job gets a percentage score based on 7 requirements" },
            { icon:"✅", title:"Know exactly what you meet", desc:"Green checks for requirements you have, clear gaps where you don't" },
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{s.title}</div>
                <div style={{ fontSize:12, color:C.text2, lineHeight:1.4 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        {allOpenJobs && allOpenJobs.filter(j => { const d = dl(j.deadline); return !d.closed && d.daysLeft >= 0 && d.daysLeft <= 7 }).length > 0 && (
          <div style={{ padding:"0 24px 28px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:12 }}>⏰ Closing soon</p>
            {allOpenJobs
              .filter(j => { const d = dl(j.deadline); return !d.closed && d.daysLeft >= 0 && d.daysLeft <= 7 })
              .sort((a,b) => new Date(a.deadline) - new Date(b.deadline))
              .map(j => {
                const d = dl(j.deadline)
                return (
                  <div key={j.id} onClick={() => onSelect && onSelect(j)}
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"10px 14px", borderRadius:10,
                      background: d.daysLeft <= 3 ? "#FEF1F1" : "#FFF9EB",
                      border: `1px solid ${d.daysLeft <= 3 ? "#FECACA" : "#FDE68A"}`,
                      marginBottom:8, cursor:"pointer" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{j.title}</div>
                      <div style={{ fontSize:11, color:C.text3 }}>{j.employer}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:d.daysLeft <= 3 ? C.red : C.amber, flexShrink:0, marginLeft:12 }}>{d.text}</span>
                  </div>
                )
              })
            }
          </div>
        )}
      </div>
    )
  }

  const d = dl(job.deadline)
  const match = getMatch ? getMatch(job.id) : null
  const isSaved = saved.includes(job.id)

  return (
    <div ref={ref} style={{ height:"100%", overflowY:"auto", scrollbarWidth:"thin" }}>
      <div style={{ maxWidth:680, padding:"20px 0 40px" }}>
        <button onClick={onClose} className="mob-back" style={{ display:"none", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:C.text2, fontSize:13, fontWeight:500, marginBottom:14, fontFamily:"inherit" }}>← Back</button>
        
        <div style={{ display:"flex", gap:14, alignItems:"flex-start", paddingBottom:18, borderBottom:`1px solid ${C.border}`, marginBottom:18 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:C.black, color:C.white, fontSize:16, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{ini(job.employer)}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:6 }}>
              {job.isNew && !d.closed && d.daysLeft > 7 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:C.greenSoft, color:C.green, textTransform:"uppercase" }}>New</span>}
              {isManagement(job.title) && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#EDE9FE", color:"#6D28D9", textTransform:"uppercase" }}>Management</span>}
              {job.posts >= 20 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#DBEAFE", color:"#1D4ED8", textTransform:"uppercase" }}>Mass Recruitment</span>}
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.text, lineHeight:1.25, marginBottom:5 }}>{job.title}</h2>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <p style={{ fontSize:14, color:C.text2, margin:0 }}>{job.employer}</p>
              {profile && <button onClick={() => onToggleFollow && onToggleFollow(job.employer)} style={{ background:"none", border:"none", cursor:"pointer", padding:2, fontSize:16, lineHeight:1, color:followedEmps?.includes(job.employer)?"#F59E0B":"#D1D5DB" }}>
                {followedEmps?.includes(job.employer) ? "★" : "☆"}
              </button>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.text2, flexWrap:"wrap" }}>
              <span>{job.county}</span>
              <span style={{ color:C.border }}>·</span>
              <span>{job.edu}</span>
              {job.posts>1 && <><span style={{ color:C.border }}>·</span><span>{job.posts} posts</span></>}
              <span style={{ color:C.border }}>·</span>
              <span style={{ fontWeight:600, color:d.urgent?C.white:d.color, background:d.urgent?C.red:"transparent", padding:d.urgent?"2px 8px":"0", borderRadius:d.urgent?4:0 }}>{d.text}</span>
            </div>
          </div>
        </div>

        {job.ai_summary && (
          <div style={{ background:C.blueSoft, border:`1px solid #BFDBFE`, borderRadius:10, padding:16, marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:C.blue }}/>
              <span style={{ fontSize:11, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:".04em" }}>The Job At A Glance</span>
            </div>
            <p style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{job.ai_summary}</p>
          </div>
        )}

        {match ? (
          <div style={{ background:matchColor(match.score)+"10", border:`1.5px solid ${matchColor(match.score)}30`, borderRadius:12, padding:18, marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
              <ScoreRing score={match.score} size={56}/>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:matchColor(match.score) }}>{matchLabel(match.score)}</div>
                <div style={{ fontSize:13, color:C.text2 }}>You meet {match.metCount} of {match.totalCount} requirements</div>
              </div>
            </div>
            {premium ? (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {match.overqualified && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.red, background:C.redSoft, padding:"8px 10px", borderRadius:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>✗</span>
                  <span style={{ lineHeight:"20px" }}>This role requires {match.checks[0]?.label || "a lower qualification level"} — it's intended for a different qualification band than yours.</span>
                </div>
              )}
              {match.wrongField && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"#92400E", background:"#FEF3C7", padding:"10px 12px", borderRadius:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>⚠</span>
                  <span style={{ lineHeight:"20px" }}>Your degree field differs from this role's requirements. Government panels filter by field of study first.</span>
                </div>
              )}
              {match.underqualified && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.red, background:C.redSoft, padding:"8px 10px", borderRadius:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>✗</span>
                  <span style={{ lineHeight:"20px" }}>This role requires {match.checks[0]?.label || "a higher qualification"} — your current education level does not meet the minimum.</span>
                </div>
              )}
              {match.checks.map((c, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.text2 }}>
                  <span style={{ color:c.met?C.green:C.red, fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{c.met?"✓":"✗"}</span>
                  <div>
                    <span style={{ lineHeight:"20px" }}>{c.label}</span>
                    {c.note && <p style={{ fontSize:11, color:C.amber, marginTop:2, fontStyle:"italic" }}>↳ {c.note}</p>}
                    {c.hint && <p style={{ fontSize:11, color:C.amber, marginTop:2, fontStyle:"italic" }}>💡 {c.hint}</p>}
                  </div>
                </div>
              ))}
              {match.specials && match.specials.length > 0 && (
                <>
                  <div style={{ fontSize:11, fontWeight:700, color:job.edu === "KCSE" || job.edu === "Certificate" ? C.red : C.amber, textTransform:"uppercase", letterSpacing:".04em", marginTop:8 }}>
                    {job.edu === "KCSE" || job.edu === "Certificate" ? "You must also have (not scored)" : "Also required (self-assess)"}
                  </div>
                  {match.specials.map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color: job.edu === "KCSE" || job.edu === "Certificate" ? C.red : C.amber }}>
                      <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{job.edu === "KCSE" || job.edu === "Certificate" ? "⚠" : "⚡"}</span>
                      <span style={{ lineHeight:"20px" }}>{s.label}</span>
                    </div>
                  ))}
                </>
              )}
              {match.skills && match.skills.length > 0 && (
                <>
                  <div style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".04em", marginTop:8 }}>This role also requires</div>
                  {match.skills.map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.text3 }}>
                      <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>📋</span>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            ) : (
            <div style={{ position:"relative", marginTop:8 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {match.checks.slice(0, 2).map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.text2 }}>
                    <span style={{ color:c.met?C.green:C.red, fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{c.met?"✓":"✗"}</span>
                    <span style={{ lineHeight:"20px" }}>{c.label}</span>
                  </div>
                ))}
              </div>
              {match.checks.length > 2 && (
                <div style={{ position:"relative", marginTop:4 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, filter:"blur(6px)", opacity:0.5, pointerEvents:"none", userSelect:"none" }}>
                    {match.checks.slice(2, 5).map((c, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.text2 }}>
                        <span style={{ color:c.met?C.green:C.red, fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{c.met?"✓":"✗"}</span>
                        <span style={{ lineHeight:"20px" }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div onClick={() => setShowPayment(true)} style={{ background:C.white, border:`2px solid ${C.red}`, borderRadius:12, padding:"14px 20px", cursor:"pointer", textAlign:"center", boxShadow:"0 4px 20px rgba(0,0,0,.1)" }}>
                      <div style={{ fontSize:18, marginBottom:6 }}>🔓</div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>See full match breakdown</div>
                      <div style={{ fontSize:12, color:C.text2, marginBottom:10, lineHeight:1.4 }}>Find out exactly which requirements you meet and what you're missing</div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.white, background:C.red, padding:"8px 20px", borderRadius:8, display:"inline-block" }}>Unlock — KES 199/mo</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        ) : profile && !job.ai_match_fields ? (
          <div style={{ background:C.borderLight, border:`1.5px dashed ${C.border}`, borderRadius:12, padding:18, marginBottom:18, textAlign:"center" }}>
            <ScoreRing score={0} size={48} unscored={true}/>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, marginTop:10 }}>This job can't be scored yet</p>
            <p style={{ fontSize:12, color:C.text3, marginTop:4, lineHeight:1.5 }}>Read the full requirements below to assess your fit.</p>
          </div>
        ) : (
          <div onClick={onBuildProfile} style={{ background:C.borderLight, border:`1.5px dashed ${C.border}`, borderRadius:12, padding:18, marginBottom:18, cursor:"pointer", textAlign:"center" }}>
            <ScoreRing score={0} size={48} locked={true}/>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, marginTop:10 }}>Build your profile to see your match score</p>
            <p style={{ fontSize:12, color:C.text3, marginTop:4 }}>Takes 2 minutes · See which requirements you meet</p>
            <button style={{ marginTop:12, fontFamily:"inherit", fontSize:13, fontWeight:600, padding:"10px 24px", borderRadius:8, background:C.red, color:C.white, border:"none", cursor:"pointer" }}>Build Profile</button>
          </div>
        )}
        
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {!d.closed && (() => {
            const urlMatch = (job.howToApply||"").match(/https?:\/\/[^\s,)]+|www\.[^\s,)]+/)
            const emailMatch = (job.howToApply||"").match(/[\w.-]+@[\w.-]+\.\w+/)
            const applyUrl = urlMatch ? (urlMatch[0].startsWith("http") ? urlMatch[0] : "https://"+urlMatch[0]) : null
            const applyEmail = !applyUrl && emailMatch ? emailMatch[0] : null
            const domain = applyUrl ? applyUrl.replace(/https?:\/\/(www\.)?/,"").split("/")[0] : null
            return (
              <div style={{ flex:"1 1 auto" }}>
                <a href={applyUrl || (applyEmail ? `mailto:${applyEmail}?subject=Application: ${job.ref||job.title}` : "#how-to-apply")} target={applyUrl?"_blank":"_self"} rel="noreferrer" style={{ display:"block", background:C.red, color:C.white, fontFamily:"inherit", fontSize:14, fontWeight:600, padding:"12px 20px", borderRadius:10, cursor:"pointer", textDecoration:"none", textAlign:"center" }}>
                  {domain ? `Apply at ${domain}` : applyEmail ? `Email ${applyEmail}` : "See how to apply"}
                </a>
                {domain && <p style={{ fontSize:11, color:C.text3, marginTop:4, textAlign:"center", wordBreak:"break-all" }}>{applyUrl}</p>}
              </div>
            )
          })()}
          <button onClick={() => onSave(job.id)} style={{ background:isSaved?C.redSoft:C.borderLight, color:isSaved?C.red:C.text2, border:`1.5px solid ${isSaved?C.red:C.border}`, fontFamily:"inherit", fontSize:13, fontWeight:500, padding:"12px 16px", borderRadius:10, cursor:"pointer" }}>{isSaved?"✓ Saved":"Save"}</button>
       <button onClick={() => {
  const url = job.slug ? `${window.location.origin}/jobs/${job.slug}` : window.location.href
  const deadline = job.deadline ? `Deadline: ${job.deadline}` : ''
 const text = `🎯 *${job.title}*\n🏛️ ${job.employer}\n⏰ ${deadline}\n\nCheck if you qualify 👇\n${url}\n\n_Find Kenya government jobs that match your qualifications 👉 gavajobs.co.ke_`
  if (navigator.share) {
    navigator.share({ title: job.title, text, url })
  } else {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }
}} style={{ background:C.borderLight, color:C.text2, border:`1.5px solid ${C.border}`, fontFamily:"inherit", fontSize:13, fontWeight:500, padding:"12px 14px", borderRadius:10, cursor:"pointer" }}>Share</button>
        </div>
        
        <div style={{ marginBottom:20 }}>
          <h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Quick facts</h4>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
            {[["Grade",job.grade],["Sector",job.sector],["Reference",job.ref]].filter(([k,v]) => v && v !== "" && v !== "See advert").map(([k,v],i,a) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderBottom:i<a.length-1?`1px solid ${C.border}`:"none", fontSize:13 }}>
                <span style={{ color:C.text2 }}>{k}</span>
                <span style={{ color:C.text, fontWeight:500, textAlign:"right", maxWidth:"60%" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {job.about && <div style={{ marginBottom:20 }}><h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>About</h4><p style={{ fontSize:14, color:C.text2, lineHeight:1.7 }}>{job.about}</p></div>}

        {job.responsibilities?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Key responsibilities</h4>
            {job.responsibilities.map((r,i) => (
              <div key={i} style={{ fontSize:13, color:C.text2, lineHeight:1.6, paddingLeft:16, position:"relative", marginBottom:6 }}>
                <span style={{ position:"absolute", left:0, color:C.text3 }}>•</span>{r}
              </div>
            ))}
          </div>
        )}

        {job.requirements?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Requirements</h4>
            {job.requirements.map((r,i) => (
              <div key={i} style={{ fontSize:13, color:C.text2, lineHeight:1.6, paddingLeft:16, position:"relative", marginBottom:6 }}>
                <span style={{ position:"absolute", left:0, color:C.green }}>✓</span>{r}
              </div>
            ))}
          </div>
        )}

        {job.chapterSix && (
          <div style={{ background:C.amberSoft, border:`1px solid #F0D9A0`, borderRadius:10, padding:14, marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.amberDark, marginBottom:6 }}>CHAPTER SIX</div>
            <p style={{ fontSize:12, color:C.amberDark, lineHeight:1.5 }}>This role requires Chapter Six compliance — but proof is only needed <b>once you're offered the job</b>, not at application time.</p>
          </div>
        )}
        
        {job.howToApply && <div id="how-to-apply" style={{ marginBottom:20 }}><h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>How to apply</h4><p style={{ fontSize:14, color:C.text2, lineHeight:1.7 }}>{job.howToApply}</p></div>}
      </div>

      {showPayment && (
        <div onClick={() => payState === "idle" && setShowPayment(false)} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:C.white, borderRadius:16, width:"100%", maxWidth:380, maxHeight:"90vh", overflow:"auto" }}>
            <div style={{ height:4, background:`linear-gradient(90deg,${C.black} 33%,${C.red} 33% 66%,${C.green} 66%)` }}/>
            <div style={{ padding:"24px 20px" }}>
              {payState === "success" ? (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:18, fontWeight:700, color:C.green, marginBottom:6 }}>Payment received!</div>
                  <div style={{ fontSize:14, color:C.text2, marginBottom:20 }}>GavaJobs Pro is now active.</div>
                  <button onClick={() => { setShowPayment(false); setPayState("idle"); onUnlockPremium && onUnlockPremium() }} style={{ fontFamily:"inherit", fontSize:14, fontWeight:600, padding:"12px 32px", borderRadius:10, background:C.green, color:C.white, border:"none", cursor:"pointer" }}>Start exploring</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:C.text2 }}>Ksh</span>
                      <span style={{ fontSize:36, fontWeight:800, color:C.text, lineHeight:1 }}>200</span>
                    </div>
                    <div style={{ fontSize:13, color:C.text3, marginTop:2 }}>Per month · Cancel anytime</div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>M-Pesa phone number</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4, background:C.borderLight, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", flexShrink:0, fontSize:14, fontWeight:600, color:C.text }}>
                        🇰🇪 +254
                      </div>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,9))} placeholder="7XX XXX XXX" disabled={payState !== "idle"}
                        style={{ flex:1, fontFamily:"inherit", fontSize:16, fontWeight:500, padding:"10px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, outline:"none", color:C.text }}/>
                    </div>
                  </div>
                  {payState === "idle" && (
                    <button onClick={() => { if (phone.length < 9) return; setPayState("sending"); setTimeout(() => setPayState("waiting"), 1500); setTimeout(() => setPayState("success"), 5000) }}
                      disabled={phone.length < 9}
                      style={{ width:"100%", fontFamily:"inherit", fontSize:15, fontWeight:700, padding:"14px 20px", borderRadius:10, background:phone.length >= 9 ? "#E5A100" : C.border, color:phone.length >= 9 ? C.white : C.text3, border:"none", cursor:phone.length >= 9 ? "pointer" : "not-allowed" }}>
                      📱 Pay Ksh 199 via M-Pesa
                    </button>
                  )}
                  {payState === "sending" && <div style={{ textAlign:"center", padding:"12px 0", fontSize:14, fontWeight:600, color:C.text }}>Sending STK push to 0{phone}…</div>}
                  {payState === "waiting" && <div style={{ textAlign:"center", padding:"12px 0" }}><div style={{ fontSize:32, marginBottom:8 }}>📱</div><div style={{ fontSize:14, fontWeight:600, color:C.text }}>Check your phone — enter your M-Pesa PIN</div></div>}
                  {payState === "idle" && <div style={{ textAlign:"center", marginTop:12 }}><button onClick={() => setShowPayment(false)} style={{ background:"none", border:"none", fontSize:12, color:C.text3, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>Not now</button></div>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}