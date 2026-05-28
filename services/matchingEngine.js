// ═══════════════════════════════════════════════════════════
// GavaJobs Matching Engine
// In production, this runs SERVER-SIDE ONLY.
// Remove from frontend bundle after backend is connected.
// ═══════════════════════════════════════════════════════════

import { FIELD_FAMILIES, QUAL_EQUIVALENCES, RELATED_FIELDS } from '../constants/fieldFamilies'
import { PROF_QUALS, PROF_BODIES } from '../constants'
import { EDU_RANK } from '../constants/education'

export function computeMatch(profile, jobFields) {
  if (!profile || !jobFields) return null
  
  const checks = []
  const userEduRank = EDU_RANK[profile.education] || 0
  const jobEduRank = EDU_RANK[jobFields.edu_min] || 0
  let wrongField = false
  
  const isGraduate = userEduRank >= 3
  const jobIsNonGraduate = jobEduRank <= 1
  const jobIsDiploma = jobEduRank === 2
  const isDiplomaHolder = userEduRank === 2
  const isOverqualified = 
    (isGraduate && jobIsNonGraduate) ||
    (isGraduate && jobIsDiploma) ||
    (isDiplomaHolder && jobIsNonGraduate)

  const eduLevelMet = userEduRank >= jobEduRank
  checks.push({
    label: `${jobFields.edu_min} or higher`,
    met: eduLevelMet,
    category: "education",
    weight: 15,
  })
  
  const hasAnyFieldReq = (jobFields.edu_fields && jobFields.edu_fields.length > 0) ||
    (jobFields.edu_fields_bachelors && jobFields.edu_fields_bachelors.length > 0) ||
    (jobFields.edu_fields_masters && jobFields.edu_fields_masters.length > 0)
  if (hasAnyFieldReq) {
    const ufBach = (profile.study_fields || []).map(f => f.toLowerCase())
    const ufMast = (profile.study_fields_masters || []).map(f => f.toLowerCase())
    const ufPhd = (profile.study_fields_phd || []).map(f => f.toLowerCase())
    const ufOther = (profile.other_study_fields || []).map(f => f.toLowerCase())
    const allUserFields = [...new Set([...ufBach, ...ufMast, ...ufPhd, ...ufOther])]
    
    const userQuals = [...(profile.prof_quals || []), ...(profile.other_prof_quals || []).map(q => q.toLowerCase())]
    const expandedQuals = new Set(userQuals)
    userQuals.forEach(q => { (QUAL_EQUIVALENCES[q] || []).forEach(eq => expandedQuals.add(eq)) })
    
    const fieldMatches = (a, b) => {
      if (a === b) return true
      const shorter = a.length < b.length ? a : b
      const longer = a.length < b.length ? b : a
      if (shorter.split(" ").length >= 2 && longer.includes(shorter)) return true
      return false
    }
    
    const tryMatch = (userF, jobF) => {
      if (jobF.some(jf => userF.some(uf => fieldMatches(uf, jf)))) return { tier: "core", via: "", bridgedBy: "" }
      let tier = "none", via = "", bridgedBy = ""
      for (const jf of jobF) {
        const family = FIELD_FAMILIES[jf]
        if (!family) continue
        for (const uf of userF) { if (family.core.some(c => fieldMatches(uf, c))) { tier = "core"; via = uf; break } }
        if (tier === "core") break
        for (const uf of userF) { if (family.related.some(r => fieldMatches(uf, r))) { tier = "related"; via = uf; break } }
        if (tier === "related") break
        if (family.conditional.length > 0 && family.conditional_quals.length > 0) {
          for (const uf of userF) {
            if ((family.conditional.includes("any") || family.conditional.some(c => fieldMatches(uf, c)))) {
              const bridgeQual = family.conditional_quals.find(q => expandedQuals.has(q))
              if (bridgeQual) { tier = "conditional"; via = uf; bridgedBy = bridgeQual; break }
            }
          }
        }
        if (tier === "conditional") break
      }
      if (tier === "none") {
        for (const uf of userF) {
          for (const jf of jobF) {
            if ((RELATED_FIELDS[uf] || []).includes(jf) || (RELATED_FIELDS[jf] || []).includes(uf))
              { tier = "related"; via = uf; break }
          }
          if (tier !== "none") break
        }
      }
      if (tier === "core" && !jobF.some(jf => userF.some(uf => fieldMatches(uf, jf))) && jobF.length >= 5) tier = "related"
      return { tier, via, bridgedBy }
    }
    
    const jobFL = jobFields.edu_fields.map(f => f.toLowerCase())
    const jobFM = (jobFields.edu_fields_masters || jobFields.edu_fields).map(f => f.toLowerCase())
    const jobFB = (jobFields.edu_fields_bachelors || jobFields.edu_fields).map(f => f.toLowerCase())
    
    const levelChecks = []
    const hasSeparateMasters = !!jobFields.edu_fields_masters
    const hasSeparateBachelors = !!jobFields.edu_fields_bachelors
    
    if (jobEduRank >= 5) {
      if (jobFL.length > 0) {
        levelChecks.push({ lv:"PhD", jf:jobFL, uf:ufPhd, has:ufPhd.length>0, w: hasSeparateMasters||hasSeparateBachelors ? 12 : 25, src:jobFields.edu_fields })
      }
      if (hasSeparateMasters) {
        levelChecks.push({ lv:"Masters", jf:jobFM, uf:[...ufMast,...ufPhd], has:ufMast.length>0||ufPhd.length>0, w:7, src:jobFields.edu_fields_masters })
      }
      if (hasSeparateBachelors) {
        levelChecks.push({ lv:"Bachelors", jf:jobFB, uf:[...ufBach,...ufMast,...ufPhd], has:ufBach.length>0||ufMast.length>0||ufPhd.length>0, w: (jobFL.length > 0 ? 6 : (hasSeparateMasters ? 13 : 25)), src:jobFields.edu_fields_bachelors })
      }
    } else if (jobEduRank >= 4) {
      if (jobFL.length > 0) {
        levelChecks.push({ lv:"Masters", jf:jobFL, uf:[...ufMast,...ufPhd], has:ufMast.length>0||ufPhd.length>0, w: hasSeparateBachelors ? 15 : 25, src:jobFields.edu_fields })
      }
      if (hasSeparateBachelors) {
        levelChecks.push({ lv:"Bachelors", jf:jobFB, uf:[...ufBach,...ufMast,...ufPhd], has:ufBach.length>0||ufMast.length>0||ufPhd.length>0, w: jobFL.length > 0 ? 10 : 25, src:jobFields.edu_fields_bachelors })
      }
    } else {
      levelChecks.push({ lv:jobFields.edu_min||"Degree", jf:jobFL, uf:allUserFields, has:allUserFields.length>0, w:25, src:jobFields.edu_fields })
    }
    
    let anyFieldMatch = false
    for (const lc of levelChecks) {
      const fDisp = lc.src.length <= 3 
        ? lc.src.join(", ")
        : lc.src.slice(0,3).join(", ") + " + " + (lc.src.length - 3) + " more fields"
      
      if (!lc.has) {
        const hasLevel = (lc.lv === "PhD" && userEduRank >= 5) || (lc.lv === "Masters" && userEduRank >= 4) || (lc.lv === "Bachelors" && userEduRank >= 3) || (lc.lv === "Degree" && userEduRank >= 3) || (lc.lv === "Diploma" && userEduRank >= 2)
        const fieldMatchResult = tryMatch(allUserFields, lc.jf)
        if (fieldMatchResult.tier !== "none") anyFieldMatch = true
        checks.push({ label: lc.lv + " in " + fDisp, met: false, category: "field", weight: lc.w, maxWeight: lc.w,
          note: hasLevel ? "No " + lc.lv.toLowerCase() + "-level field recorded in your profile." : "You do not hold a " + lc.lv + "." })
        continue
      }
      
      const holdsLevel = (lc.lv === "PhD" && userEduRank >= 5) || (lc.lv === "Masters" && userEduRank >= 4) || ((lc.lv === "Bachelors" || lc.lv === "Degree") && userEduRank >= 3) || (lc.lv === "Diploma" && userEduRank >= 2) || (lc.lv === "Certificate" && userEduRank >= 1) || (lc.lv === "KCSE" && userEduRank >= 0)
      if (!holdsLevel) {
        const fieldMatchResult = tryMatch(allUserFields, lc.jf)
        if (fieldMatchResult.tier !== "none") anyFieldMatch = true
        checks.push({ label: lc.lv + " in " + fDisp, met: false, category: "field", weight: lc.w, maxWeight: lc.w,
          note: "You do not hold a " + lc.lv + ". Your " + (profile.education||"qualification") + " in " + (profile.study_fields||[]).join(", ") + " is below this level." })
        continue
      }
      
      const r = tryMatch(lc.uf, lc.jf)
      
      const hasCommerceField = lc.jf.some(f => f.toLowerCase() === "commerce")
      const commerceNote = hasCommerceField ? " Note: BCom is a wide classification — the degree option (e.g. Accounting, Marketing, HR) will determine eligibility for this role." : ""
      
      let higherLevelNote = ""
      if (r.tier !== "none") {
        const matchedField = r.via || ""
        const mfl = matchedField.toLowerCase()
        const reqLv = lc.lv
        const reqRank = reqLv === "PhD" ? 5 : reqLv === "Masters" ? 4 : 3
        if (reqRank <= 3) {
          const isFromMasters = ufMast.some(f => f === mfl || f.includes(mfl) || mfl.includes(f))
          const isFromPhd = ufPhd.some(f => f === mfl || f.includes(mfl) || mfl.includes(f))
          const isFromBach = ufBach.some(f => f === mfl || f.includes(mfl) || mfl.includes(f))
          if ((isFromMasters || isFromPhd) && !isFromBach) {
            const viaLevel = isFromPhd ? "PhD" : "Masters"
            higherLevelNote = "Matched via your " + viaLevel + " — a higher qualification in the same field satisfies this requirement."
          }
        } else if (reqRank === 4) {
          const isFromPhd = ufPhd.some(f => f === mfl || f.includes(mfl) || mfl.includes(f))
          const isFromMast = ufMast.some(f => f === mfl || f.includes(mfl) || mfl.includes(f))
          if (isFromPhd && !isFromMast) {
            higherLevelNote = "Matched via your PhD — a higher qualification in the same field satisfies this requirement."
          }
        }
        if (!matchedField) {
          const directInBach = lc.jf.some(jf => ufBach.some(uf => fieldMatches(uf, jf)))
          const directInMast = lc.jf.some(jf => ufMast.some(uf => fieldMatches(uf, jf)))
          const directInPhd = lc.jf.some(jf => ufPhd.some(uf => fieldMatches(uf, jf)))
          if (reqRank <= 3 && !directInBach && (directInMast || directInPhd)) {
            const viaLevel = directInPhd ? "PhD" : "Masters"
            const matchedF = directInPhd 
              ? ufPhd.find(uf => lc.jf.some(jf => fieldMatches(uf, jf)))
              : ufMast.find(uf => lc.jf.some(jf => fieldMatches(uf, jf)))
            const mfDisp = matchedF ? matchedF.charAt(0).toUpperCase() + matchedF.slice(1) : ""
            higherLevelNote = "Matched via your " + viaLevel + " in " + mfDisp + " — a higher qualification in the same field satisfies this requirement."
          }
        }
      }
      
      if (r.tier === "core") {
        checks.push({ label: lc.lv + " in " + fDisp, met: true, category: "field", weight: lc.w, maxWeight: lc.w, matchType: "exact",
          note: (higherLevelNote || "") + commerceNote || undefined })
        anyFieldMatch = true
      } else if (r.tier === "related") {
        const vd = r.via ? r.via.charAt(0).toUpperCase() + r.via.slice(1) : ""
        const relNote = vd ? "Your " + lc.lv.toLowerCase() + " is in " + vd + ", not the named field. It is accepted as a related field but candidates with the named degree may score higher at shortlisting."
            : "Matched as related field — not the named qualification but accepted as related."
        checks.push({ label: lc.lv + " in " + fDisp, met: true, category: "field",
          weight: Math.round(lc.w * 0.75), maxWeight: lc.w, matchType: "related",
          note: (higherLevelNote ? higherLevelNote + " " + relNote : relNote) + commerceNote })
        anyFieldMatch = true
      } else if (r.tier === "conditional") {
        const vd = r.via ? r.via.charAt(0).toUpperCase() + r.via.slice(1) : ""
        const bq = r.bridgedBy ? (PROF_QUALS.find(p => p.id === r.bridgedBy)?.label || r.bridgedBy) : "a bridging qualification"
        checks.push({ label: lc.lv + " in " + fDisp, met: true, category: "field",
          weight: Math.round(lc.w * 0.60), maxWeight: lc.w, matchType: "conditional",
          note: "Your " + lc.lv.toLowerCase() + " in " + vd + " qualifies because you hold " + bq + ". Candidates with the named degree may score higher at shortlisting." + commerceNote })
        anyFieldMatch = true
      } else {
        const ufl = lc.uf.slice(0,2).map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(", ")
        checks.push({ label: lc.lv + " in " + fDisp, met: false, category: "field", weight: lc.w, maxWeight: lc.w,
          note: (ufl ? "Your " + lc.lv.toLowerCase() + " is in " + ufl + " — not a match for this role." : "") + commerceNote || undefined })
      }
    }
    if (!anyFieldMatch) wrongField = true
  }
  
  if (jobFields.prof_quals_required && jobFields.prof_quals_required.length > 0) {
    const userQuals = [...(profile.prof_quals || []), ...(profile.other_prof_quals || []).map(q => q.toLowerCase())]
    const expandedQuals = new Set(userQuals)
    userQuals.forEach(q => {
      (QUAL_EQUIVALENCES[q] || []).forEach(eq => expandedQuals.add(eq))
    })
    
    jobFields.prof_quals_required.forEach(q => {
      const qlabel = PROF_QUALS.find(p => p.id === q)?.label || q
      let met = expandedQuals.has(q)
      if (!met) {
        const reverseEquivs = QUAL_EQUIVALENCES[q] || []
        met = reverseEquivs.some(eq => expandedQuals.has(eq))
      }
      let note = ""
      if (met && !userQuals.includes(q)) {
        const bridgedBy = userQuals.find(uq => (QUAL_EQUIVALENCES[uq] || []).includes(q)) || userQuals.find(uq => (QUAL_EQUIVALENCES[q] || []).includes(uq))
        const bridgeLabel = PROF_QUALS.find(p => p.id === bridgedBy)?.label || bridgedBy
        note = `Matched via equivalence — your ${bridgeLabel} is accepted.`
      }
      checks.push({
        label: qlabel + " (required)",
        met,
        category: "qualification",
        weight: 20,
        note: note || undefined,
      })
    })
  }
  
  if (jobFields.prof_quals_required_groups && jobFields.prof_quals_required_groups.length > 0) {
    const userQuals = [...(profile.prof_quals || []), ...(profile.other_prof_quals || []).map(q => q.toLowerCase())]
    const expandedQuals = new Set(userQuals)
    userQuals.forEach(q => { (QUAL_EQUIVALENCES[q] || []).forEach(eq => expandedQuals.add(eq)) })
    
    jobFields.prof_quals_required_groups.forEach(group => {
      const labels = group.map(q => PROF_QUALS.find(p => p.id === q)?.label || q)
      const matchedId = group.find(q => expandedQuals.has(q))
      const met = !!matchedId
      const matchedLabel = matchedId ? (PROF_QUALS.find(p => p.id === matchedId)?.label || matchedId) : ""
      checks.push({
        label: labels.join(" or ") + " (one required)",
        met,
        category: "qualification",
        weight: 20,
        note: met ? "Matched via your " + matchedLabel + "." : undefined,
      })
    })
  }
  
  if (jobFields.years_experience > 0) {
    const expMet = (profile.years_experience || 0) >= jobFields.years_experience
    checks.push({
      label: `${jobFields.years_experience}+ years experience`,
      met: expMet,
      category: "experience",
      weight: 15,
      note: expMet ? "Panels consider not just years of experience but also relevance to the role." : undefined,
    })
  }
  
  if (jobFields.years_management > 0) {
    checks.push({
      label: `${jobFields.years_management}+ years in management/supervisory role`,
      met: (profile.years_management || 0) >= jobFields.years_management,
      category: "management",
      weight: 10,
    })
  }
  
  if (jobFields.prof_bodies_required && jobFields.prof_bodies_required.length > 0) {
    const userBodies = [...(profile.prof_bodies || []), ...(profile.other_prof_bodies || []).map(b => b.toLowerCase())]
    jobFields.prof_bodies_required.forEach(b => {
      const blabel = PROF_BODIES.find(p => p.id === b)?.label || b
      checks.push({
        label: blabel + " membership (required)",
        met: userBodies.includes(b),
        category: "membership",
        weight: 10,
      })
    })
  }
  
  if (jobFields.prof_bodies_required_groups && jobFields.prof_bodies_required_groups.length > 0) {
    const userBodies = [...(profile.prof_bodies || []), ...(profile.other_prof_bodies || []).map(b => b.toLowerCase())]
    jobFields.prof_bodies_required_groups.forEach(group => {
      const labels = group.map(b => PROF_BODIES.find(p => p.id === b)?.label || b)
      const matchedId = group.find(b => userBodies.includes(b))
      const met = !!matchedId
      const matchedLabel = matchedId ? (PROF_BODIES.find(p => p.id === matchedId)?.label || matchedId) : ""
      checks.push({
        label: labels.join(" or ") + " membership (one required)",
        met,
        category: "membership",
        weight: 10,
        note: met ? "Matched via your " + matchedLabel + " membership." : undefined,
      })
    })
  }
  
  if (jobFields.leadership_course) {
    const hasLeadership = profile.leadership_course && profile.leadership_course !== "none"
    checks.push({
      label: "Leadership/management course (4+ weeks)",
      met: hasLeadership,
      category: "leadership",
      weight: 5,
      hint: "Government usually means SLDP or SMC from Kenya School of Government, but equivalent courses from other recognised institutions are accepted.",
    })
  }
  
  const totalWeight = checks.reduce((s, c) => s + (c.maxWeight || c.weight), 0)
  const metWeight = checks.reduce((s, c) => s + (c.met ? c.weight : 0), 0)
  let score = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 0
  
  if (score > 95) score = 95
  
  let overqualifiedFlag = false
  let wrongFieldFlag = false
  let underqualifiedFlag = false
  
  if (isOverqualified) {
    score = 0
    overqualifiedFlag = true
  }
  
  if (!eduLevelMet && !isOverqualified) {
    score = Math.min(score, 15)
    underqualifiedFlag = true
  }
  
  if (wrongField) {
    score = Math.min(score, 15)
    wrongFieldFlag = true
  }
  
  const metCount = checks.filter(c => c.met).length
  
  const specials = [...(jobFields.special_requirements || [])].map(r => ({
    label: r, category: "special", selfAssess: true,
  }))
  const skills = [...(jobFields.key_skills || [])].map(r => ({
    label: r, category: "skill", selfAssess: true,
  }))
  
  return { score, checks, metCount, totalCount: checks.length, overqualified: overqualifiedFlag, wrongField: wrongFieldFlag, underqualified: underqualifiedFlag, specials, skills }
}

export function isManagement(title) {
  if (/CEO['\u2019]s\s+Office/i.test(title)) return false
  return /\b(manager|director|ceo|chief executive|commissioner|head of|principal secretary|chancellor|chairperson|registrar)\b/i.test(title)
}

export function jobSeniority(job) {
  const t = job.title.toLowerCase()
  if (/\b(ceo|chief executive|managing director|director general|registrar\/chief executive)\b/.test(t)) return 100
  if (/\b(commissioner|chancellor|principal secretary|chairperson|registrar)\b/.test(t)) return 95
  if (/\bprofessor\b/.test(t) && !/\bassociate\b|\bassistant\b/.test(t)) return 90
  if (/\bassociate professor\b/.test(t)) return 85
  if (/\bdeputy director\b/.test(t)) return 75
  if (/\bdirector\b/.test(t)) return 80
  if (/\bsenior manager\b/.test(t)) return 70
  if (/\bsenior lecturer\b/.test(t)) return 65
  if (/\bmanager\b/.test(t) && !/\bassistant\b|\bdeputy\b/.test(t)) return 65
  if (/\bassistant director\b/.test(t)) return 63
  if (/\bprincipal\b/.test(t) && !/\bprincipal secretary\b/.test(t)) return 60
  if (/\bdeputy manager\b/.test(t)) return 58
  if (/\bassistant manager\b/.test(t)) return 55
  if (/\blecturer\b/.test(t)) return 50
  if (/\bsenior\b/.test(t)) return 50
  if (/\baccountant i\b|\baccountant$/.test(t)) return 42
  if (/\bofficer i\b|\bofficer 1\b/.test(t)) return 40
  if (/\bofficer\b/.test(t)) return 38
  if (/\bofficer ii\b|\bofficer 2\b|\bofficer iii\b|\bofficer 3\b/.test(t)) return 35
  if (/\bassistant\b/.test(t)) return 30
  if (/\byoung professional\b|\bintern\b|\btrainee\b/.test(t)) return 25
  if (/\bdriver\b|\bcleaner\b|\bmessenger\b/.test(t)) return 10
  if (job.edu === "PhD") return 70
  if (job.edu === "Masters") return 55
  if (job.edu === "Degree") return 40
  if (job.edu === "Diploma") return 25
  return 20
}