import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle, AlertCircle, ChevronRight, Lock, Calendar } from 'lucide-react';

/* ─── COLOR TOKENS ──────────────────────────────────────────────────────────
   Primary dark  : #282728
   Accent        : #282728 (same dark – used for badges, pills, buttons)
   Accent light  : rgba(40,39,40,.08)
   Gold          : #c9a84c  (kept for the second sidebar card)
   Cream bg      : #f9f6f1
   Border        : #e4e0d8
   Text muted    : #888
──────────────────────────────────────────────────────────────────────────── */

const C = {
    dark:   '#282728',
    darkL:  'rgba(40,39,40,.08)',
    darkM:  'rgba(40,39,40,.14)',
    gold:   '#c9a84c',
    goldL:  '#fdf3dc',
    cream:  '#f9f6f1',
    cream2: '#eee9e0',
    white:  '#ffffff',
    border: '#e4e0d8',
    text2:  '#4a4a4a',
    text3:  '#888',
    err:    '#c0392b',
    errBg:  '#fef2f2',
};

/* Shared field wrapper */
function Field({ label, required, children }) {
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:'0.66rem', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', color: C.text2 }}>
                {label} {required && <span style={{ color: C.err }}>*</span>}
            </label>
            {children}
        </div>
    );
}

/* Shared input style */
const inputSx = (hasErr) => ({
    width:'100%', border:`1.5px solid ${hasErr ? C.err : C.border}`,
    borderRadius:9, padding:'10px 13px',
    fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:'0.87rem',
    color: C.dark, background: hasErr ? '#fff8f8' : C.cream,
    outline:'none', transition:'border-color .18s,background .18s,box-shadow .18s',
    WebkitAppearance:'none', appearance:'none',
});

/* Pill radio group */
function Pills({ name, options, value, onChange, hasErr }) {
    return (
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {options.map(opt => (
                <React.Fragment key={opt.value}>
                    <input
                        type="radio" id={`${name}-${opt.value}`}
                        name={name} value={opt.value}
                        checked={value === opt.value}
                        onChange={() => onChange(opt.value)}
                        style={{ display:'none' }}
                    />
                    <label
                        htmlFor={`${name}-${opt.value}`}
                        style={{
                            padding:'7px 14px',
                            border:`1.5px solid ${value === opt.value ? C.dark : (hasErr ? C.err : C.border)}`,
                            borderRadius:100, fontSize:'0.78rem', fontWeight:500,
                            color: value === opt.value ? C.white : C.text2,
                            background: value === opt.value ? C.dark : 'transparent',
                            cursor:'pointer', transition:'all .16s',
                        }}
                    >
                        {opt.label}
                    </label>
                </React.Fragment>
            ))}
        </div>
    );
}

/* Section divider label */
function Sec({ children }) {
    return (
        <div style={{
            display:'flex', alignItems:'center', gap:8,
            fontSize:'0.67rem', fontWeight:700, letterSpacing:'2px',
            textTransform:'uppercase', color: C.dark, marginBottom:16,
        }}>
            {children}
            <span style={{ flex:1, height:1, background: C.border }} />
        </div>
    );
}

/* ─── SIDEBAR CARDS ─────────────────────────────────────────────────────── */
function FreeCard({ accent, tag, tagStyle, icon, title, desc, items, btnLabel, onBtn }) {
    return (
        <div style={{
            background: C.white, borderRadius:18,
            boxShadow:'0 2px 20px rgba(0,0,0,.06)', overflow:'hidden',
        }}>
            <div style={{ height:4, background: accent }} />
            <div style={{ padding:'22px 22px 20px' }}>
                <span style={{ ...tagStyle, display:'inline-flex', alignItems:'center', gap:5, fontSize:'0.62rem', fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', padding:'3px 10px', borderRadius:100, marginBottom:14 }}>
                    ✓ {tag}
                </span>
                <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'1.25rem', fontWeight:600, marginBottom:6, color: C.dark }}>{title}</h3>
                <p style={{ fontSize:'0.8rem', color: C.text2, lineHeight:1.55, marginBottom:16 }}>{desc}</p>
                <hr style={{ border:'none', borderTop:`1px solid ${C.border}`, margin:'4px 0 16px' }} />
                <ul style={{ listStyle:'none', marginBottom:18 }}>
                    {items.map((item, i) => (
                        <li key={i} style={{ fontSize:'0.77rem', color: C.text2, padding:'4px 0', display:'flex', alignItems:'flex-start', gap:8 }}>
                            <span style={{ color: C.dark, fontWeight:700, fontSize:'0.8rem', flexShrink:0 }}>✓</span>
                            {item}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onBtn}
                    style={{
                        display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                        width:'100%', padding:'11px', borderRadius:10, border:'none',
                        fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:'0.75rem',
                        fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase',
                        cursor:'pointer', transition:'opacity .18s,transform .18s',
                        background: accent, color: C.white,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    {btnLabel} ↗
                </button>
            </div>
        </div>
    );
}

function ContactCard() {
    const items = [
        { ico:'📍', icoStyle:{ background:'#f0efef' }, label:'Office',       val:<>2F Landco Corporate Center,<br />Davao City, Philippines</> },
        { ico:'📞', icoStyle:{ background:'#e6f1fb' }, label:'Phone',        val:<a href="tel:+63822975000" style={{ color: C.dark, textDecoration:'none' }}>+63 (82) 297-5000</a> },
        { ico:'✉️', icoStyle:{ background:'#f5f3e8' }, label:'Email',        val:<a href="mailto:hello@epathways.com.ph" style={{ color: C.dark, textDecoration:'none' }}>hello@epathways.com.ph</a> },
        { ico:'💬', icoStyle:{ background:'#efefef' }, label:'Facebook',     val:<a href="#" style={{ color: C.dark, textDecoration:'none' }}>facebook.com/epathwaysph</a> },
        { ico:'🕐', icoStyle:{ background:'#eef1f5' }, label:'Office Hours', val:<>Mon–Fri, 8:00 AM – 6:00 PM<br /><span style={{ color: C.text3, fontSize:'0.75rem' }}>Sat 9:00 AM – 1:00 PM</span></> },
    ];
    return (
        <div style={{ background: C.white, borderRadius:18, boxShadow:'0 2px 20px rgba(0,0,0,.06)', overflow:'hidden' }}>
            <div style={{ height:4, background: `linear-gradient(90deg, ${C.dark}, #444)` }} />
            <div style={{ padding:'22px 22px 20px' }}>
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'1.15rem', fontWeight:600, marginBottom:16, color: C.dark }}>Get in Touch</h3>
                {items.map((item, i) => (
                    <div key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:12,
                        padding:'10px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}>
                        <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, ...item.icoStyle }}>
                            {item.ico}
                        </div>
                        <div>
                            <div style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color: C.text3, marginBottom:2 }}>{item.label}</div>
                            <div style={{ fontSize:'0.82rem', color: C.dark, fontWeight:500 }}>{item.val}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── SUCCESS SCREEN ────────────────────────────────────────────────────── */
function SuccessScreen({ eventName }) {
    return (
        <div style={{ minHeight:'100vh', background: C.cream, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div style={{
                maxWidth:460, width:'100%', background: C.white,
                borderRadius:28, boxShadow:'0 4px 40px rgba(0,0,0,.10)',
                padding:'56px 36px', textAlign:'center',
            }}>
                <div style={{
                    width:72, height:72, borderRadius:'50%',
                    background: C.dark, display:'flex', alignItems:'center',
                    justifyContent:'center', margin:'0 auto 24px',
                    boxShadow:`0 6px 28px ${C.darkM}`,
                    animation:'pop .5s cubic-bezier(.34,1.56,.64,1) both',
                }}>
                    <CheckCircle size={36} color="#fff" strokeWidth={2} />
                </div>
                <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'2rem', fontWeight:700, marginBottom:8, color: C.dark }}>
                    You're Registered!
                </h2>
                <p style={{ color: C.text3, fontSize:'0.9rem', lineHeight:1.6, marginBottom:32 }}>
                    Thank you for registering for <strong style={{ color: C.dark }}>{eventName}</strong>.<br />
                    We look forward to your participation.<br />
                    Further updates and event details will be shared with you soon.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        width:'100%', padding:'14px 28px',
                        background: C.dark, color: '#fff',
                        border:'none', borderRadius:12, cursor:'pointer',
                        fontFamily:"'Plus Jakarta Sans', sans-serif",
                        fontSize:'0.82rem', fontWeight:700, letterSpacing:'2px',
                        textTransform:'uppercase', transition:'background .18s',
                    }}
                >
                    Back to Home
                </button>
            </div>
            <style>{`@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        </div>
    );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────────────────── */
export default function Registration({ event }) {
    console.log('Registration props:', { event });
    if (!event) return <div style={{ padding:40, textAlign:'center', color: C.text3, fontWeight:700 }}>Error: Event data missing.</div>;

    const [success, setSuccess] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        first_name: '', last_name: '', email: '', phone: '', city: '',
        employment_status: '', interest: '', education_level: '',
        field_of_study: '', planning_timeline: '', funding_source: '',
        event_session_id: '', remarks: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/register/${event.event_code}`, {
            onSuccess: () => setSuccess(true),
            preserveScroll: true,
        });
    };

    const focusFirst = () => document.getElementById('reg-first-name')?.focus();

    if (success) return <SuccessScreen eventName={event.name} />;

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", background: C.cream, minHeight:'100vh', color: C.dark }}>
            <Head title={`Register – ${event.name}`} />

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <div style={{
                background: C.dark,
                backgroundImage:`radial-gradient(ellipse 60% 80% at 10% 60%,rgba(255,255,255,.06) 0%,transparent 70%),
                                  radial-gradient(ellipse 40% 60% at 90% 10%,rgba(201,168,76,.09) 0%,transparent 60%)`,
                padding:'60px 24px 52px', textAlign:'center',
                position:'relative', overflow:'hidden',
            }}>
                <div style={{
                    content:'', position:'absolute', bottom:0, left:0, right:0, height:40,
                    background: C.cream, clipPath:'ellipse(55% 100% at 50% 100%)',
                }} />
                {/* Badge */}
                <span style={{
                    display:'inline-flex', alignItems:'center', gap:7,
                    background: C.gold, color: C.dark,
                    fontSize:'0.62rem', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase',
                    padding:'5px 16px', borderRadius:100, marginBottom:22,
                }}>
                    <Calendar size={11} /> {event.type || 'Webinar Event'}
                </span>
                <h1 style={{
                    fontFamily:"'Cormorant Garamond', serif",
                    fontSize:'clamp(2.2rem, 5.5vw, 3.6rem)',
                    fontWeight:700, color: C.white, lineHeight:1.1, margin:0,
                }}>
                    Register Now with<br /><em style={{ fontStyle:'italic', color: C.gold }}>{event.name || 'ePathways'}</em>
                </h1>
                <p style={{ marginTop:10, color:'rgba(255,255,255,.7)', fontSize:'0.95rem' }}>
                    Your New Zealand journey starts with one form
                </p>
            </div>

            {/* ── TWO-COLUMN OUTER ─────────────────────────────────────── */}
            <div style={{
                maxWidth:1060, margin:'0 auto', padding:'40px 20px 60px',
                display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start',
            }}
                className="reg-outer"
            >
                {/* ── LEFT: FORM CARD ──────────────────────────────────── */}
                <div style={{ background: C.white, borderRadius:20, boxShadow:'0 2px 24px rgba(0,0,0,.06)', overflow:'hidden' }}>
                    <div style={{ height:5, background: `linear-gradient(90deg,${C.dark},#555)` }} />

                    <div style={{ padding:'32px 32px 28px' }} id="formContent">

                        {/* Error box */}
                        {hasErrors && (
                            <div style={{
                                display:'flex', alignItems:'flex-start', gap:10,
                                background: C.errBg, border:`1.5px solid #fca5a5`,
                                borderRadius:9, padding:'14px 18px', marginBottom:28,
                            }}>
                                <AlertCircle size={18} color={C.err} style={{ flexShrink:0, marginTop:2 }} />
                                <div>
                                    <strong style={{ display:'block', color: C.err, fontSize:'0.85rem', marginBottom:6 }}>Please fix the following errors:</strong>
                                    <ul style={{ listStyle:'none' }}>
                                        {Object.values(errors).map((err, i) => (
                                            <li key={i} style={{ fontSize:'0.78rem', color:'#7f1d1d', padding:'2px 0', display:'flex', alignItems:'center', gap:5 }}>
                                                <span style={{ color: C.err }}>•</span> {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            {/* PERSONAL ─────────────────────────────────── */}
                            <div style={{ marginBottom:28 }}>
                                <Sec>Personal Information</Sec>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:13 }}>
                                    <Field label="First Name" required>
                                        <input id="reg-first-name" required type="text" placeholder="e.g. Maria"
                                            style={inputSx(!!errors.first_name)} value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; e.target.style.boxShadow=`0 0 0 3px ${C.darkM}`; }}
                                            onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; e.target.style.boxShadow='none'; }} />
                                    </Field>
                                    <Field label="Last Name" required>
                                        <input required type="text" placeholder="e.g. Santos"
                                            style={inputSx(!!errors.last_name)} value={data.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; e.target.style.boxShadow=`0 0 0 3px ${C.darkM}`; }}
                                            onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; e.target.style.boxShadow='none'; }} />
                                    </Field>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:13 }}>
                                    <Field label="Email Address" required>
                                        <input required type="email" placeholder="you@email.com"
                                            style={inputSx(!!errors.email)} value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; e.target.style.boxShadow=`0 0 0 3px ${C.darkM}`; }}
                                            onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; e.target.style.boxShadow='none'; }} />
                                    </Field>
                                    <Field label="Phone Number" required>
                                        <input required type="tel" placeholder="+63 9XX XXX XXXX"
                                            style={inputSx(!!errors.phone)} value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; e.target.style.boxShadow=`0 0 0 3px ${C.darkM}`; }}
                                            onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; e.target.style.boxShadow='none'; }} />
                                    </Field>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns: event.sessions?.length ? '1fr 1fr' : '1fr', gap:14 }}>
                                    <Field label="City" required>
                                        <input required type="text" placeholder="e.g. Davao City"
                                            style={inputSx(!!errors.city)} value={data.city}
                                            onChange={e => setData('city', e.target.value)}
                                            onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; e.target.style.boxShadow=`0 0 0 3px ${C.darkM}`; }}
                                            onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; e.target.style.boxShadow='none'; }} />
                                    </Field>
                                    {event.sessions?.length > 0 && (
                                        <Field label="Event Session">
                                            <div style={{ position:'relative' }}>
                                                <select style={{ ...inputSx(false), paddingRight:32 }}
                                                    value={data.event_session_id}
                                                    onChange={e => setData('event_session_id', e.target.value)}
                                                    onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; }}
                                                    onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; }}
                                                >
                                                    <option value="">Select session (optional)</option>
                                                    {event.sessions.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.venue_name || s.city} – {s.time_start?.slice(0,5)}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', border:'5px solid transparent', borderTopColor: C.text3, pointerEvents:'none' }} />
                                            </div>
                                        </Field>
                                    )}
                                </div>
                            </div>

                            {/* BACKGROUND ─────────────────────────────────── */}
                            <div style={{ marginBottom:28 }}>
                                <Sec>Background &amp; Education</Sec>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:13 }}>
                                    <Field label="Highest Educational Attainment" required>
                                        <div style={{ position:'relative' }}>
                                            <select required style={{ ...inputSx(!!errors.education_level), paddingRight:32 }}
                                                value={data.education_level}
                                                onChange={e => setData('education_level', e.target.value)}
                                                onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; }}
                                                onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; }}
                                            >
                                                <option value="">Select level</option>
                                                <option>High School Graduate</option>
                                                <option>Associate / Vocational</option>
                                                <option>Bachelor's Degree</option>
                                                <option>Master's Degree</option>
                                                <option>Doctorate / PhD</option>
                                            </select>
                                            <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', border:'5px solid transparent', borderTopColor: C.text3, pointerEvents:'none' }} />
                                        </div>
                                    </Field>
                                    <Field label="Field of Study / Profession" required>
                                        <input required type="text" placeholder="e.g. Nursing, IT, Business"
                                            style={inputSx(!!errors.field_of_study)} value={data.field_of_study}
                                            onChange={e => setData('field_of_study', e.target.value)}
                                            onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; e.target.style.boxShadow=`0 0 0 3px ${C.darkM}`; }}
                                            onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; e.target.style.boxShadow='none'; }} />
                                    </Field>
                                </div>
                                <Field label="Employment Status" required>
                                    <Pills name="emp"
                                        options={['Employed','Self-Employed','Unemployed','Student','OFW'].map(v=>({value:v,label:v}))}
                                        value={data.employment_status}
                                        onChange={v => setData('employment_status', v)}
                                        hasErr={!!errors.employment_status}
                                    />
                                </Field>
                            </div>

                            {/* NZ PLANS ─────────────────────────────────── */}
                            <div style={{ marginBottom:28 }}>
                                <Sec>New Zealand Plans</Sec>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:13 }}>
                                    <Field label="Pathway of Interest" required>
                                        <div style={{ position:'relative' }}>
                                            <select required style={{ ...inputSx(!!errors.interest), paddingRight:32 }}
                                                value={data.interest}
                                                onChange={e => setData('interest', e.target.value)}
                                                onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; }}
                                                onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; }}
                                            >
                                                <option value="">Select pathway</option>
                                                <option value="Work Visa / Job Support">Work Visa / Job Support</option>
                                                <option value="Student Visa">Student Visa</option>
                                                <option value="Skilled Migrant">Skilled Migrant</option>
                                                <option value="Partner / Family Visa">Partner / Family Visa</option>
                                                <option value="Investor Visa">Investor Visa</option>
                                                <option value="Not sure yet">Not sure yet</option>
                                            </select>
                                            <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', border:'5px solid transparent', borderTopColor: C.text3, pointerEvents:'none' }} />
                                        </div>
                                    </Field>
                                    <Field label="Planning Timeline" required>
                                        <div style={{ position:'relative' }}>
                                            <select required style={{ ...inputSx(!!errors.planning_timeline), paddingRight:32 }}
                                                value={data.planning_timeline}
                                                onChange={e => setData('planning_timeline', e.target.value)}
                                                onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; }}
                                                onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; }}
                                            >
                                                <option value="">When are you planning?</option>
                                                <option>Within 3 months</option>
                                                <option>3–6 months</option>
                                                <option>6–12 months</option>
                                                <option>1–2 years</option>
                                                <option>Just exploring</option>
                                            </select>
                                            <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', border:'5px solid transparent', borderTopColor: C.text3, pointerEvents:'none' }} />
                                        </div>
                                    </Field>
                                </div>
                                <Field label="How Will You Fund Your Move / Education?" required>
                                    <Pills name="fund"
                                        options={['Personal Savings','Family Support','Scholarship','Student Loan','Employer-Sponsored','Not yet decided'].map(v=>({value:v,label:v}))}
                                        value={data.funding_source}
                                        onChange={v => setData('funding_source', v)}
                                        hasErr={!!errors.funding_source}
                                    />
                                </Field>
                            </div>

                            {/* REMARKS ─────────────────────────────────── */}
                            <div style={{ marginBottom:0 }}>
                                <Sec>Additional Remarks</Sec>
                                <Field label="Any questions or goals?">
                                    <textarea rows={4}
                                        placeholder="Share your questions, goals, or specific concerns..."
                                        style={{ ...inputSx(false), resize:'vertical', minHeight:80 }}
                                        value={data.remarks}
                                        onChange={e => setData('remarks', e.target.value)}
                                        onFocus={e => { e.target.style.borderColor='#282728'; e.target.style.background=C.white; e.target.style.boxShadow=`0 0 0 3px ${C.darkM}`; }}
                                        onBlur={e  => { e.target.style.borderColor=C.border;  e.target.style.background=C.cream; e.target.style.boxShadow='none'; }}
                                    />
                                </Field>
                            </div>

                            {/* SUBMIT ───────────────────────────────────── */}
                            <div style={{
                                margin:'0 -32px -28px', padding:'20px 32px 28px',
                                background: C.cream, borderTop:`1px solid ${C.border}`,
                                marginTop:28, display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                            }}>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    style={{
                                        width:'100%', maxWidth:380,
                                        background: C.dark,
                                        color:'#fff', border:'none', borderRadius:14,
                                        padding:'15px 28px', fontFamily:"'Plus Jakarta Sans', sans-serif",
                                        fontSize:'0.82rem', fontWeight:700, letterSpacing:'2px',
                                        textTransform:'uppercase', cursor: processing ? 'not-allowed' : 'pointer',
                                        display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                                        transition:'transform .18s,box-shadow .18s',
                                        boxShadow:`0 4px 18px rgba(40,39,40,.28)`,
                                        opacity: processing ? 0.6 : 1,
                                    }}
                                    onMouseEnter={e => { if(!processing){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 26px rgba(40,39,40,.36)`; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 18px rgba(40,39,40,.28)`; }}
                                >
                                    {processing
                                        ? <div style={{ width:20, height:20, border:`2px solid rgba(255,255,255,.2)`, borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                                        : <>Submit Registration <ChevronRight size={14} /></>
                                    }
                                </button>
                                <div style={{ fontSize:'0.7rem', color: C.text3, display:'flex', alignItems:'center', gap:5 }}>
                                    <Lock size={11} /> Secure Registration · © {new Date().getFullYear()} ePathways CRM
                                </div>
                            </div>

                        </form>
                    </div>
                </div>

                {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                    <FreeCard
                        accent={C.dark}
                        tag="Complimentary"
                        tagStyle={{ background:'#eeeeed', color: C.dark }}
                        icon="📋"
                        title="Free Assessment"
                        desc="Get a personalized eligibility evaluation for your New Zealand pathway — absolutely no cost, no obligation."
                        items={['Visa eligibility check','Pathway recommendation','Qualification recognition review','Points-based assessment (if applicable)','Written summary report']}
                        btnLabel="Claim Free Assessment"
                        onBtn={focusFirst}
                    />

                    <FreeCard
                        accent={C.gold}
                        tag="No Charge"
                        tagStyle={{ background: C.goldL, color:'#7a4f00' }}
                        icon="📅"
                        title="Free Consultation Booking"
                        desc="Book a dedicated 1-on-1 session with a certified ePathways advisor at zero cost."
                        items={['30-min private session','Online via Zoom / in-person','Discuss your specific situation','Get a step-by-step action plan','No sales pressure, ever']}
                        btnLabel="Book Free Consultation"
                        onBtn={focusFirst}
                    />

                    <ContactCard />

                </div>
            </div>

            <div style={{ textAlign:'center', padding:18, fontSize:'0.7rem', color: C.text3, letterSpacing:'.5px' }}>
                ePathways · Helping Filipinos Build Their Future in New Zealand
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
                * { box-sizing: border-box; margin:0; padding:0; }
                body { font-family: 'Plus Jakarta Sans', sans-serif; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pop  { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
                .reg-outer { grid-template-columns: 1fr 320px; }
                @media (max-width: 820px) { .reg-outer { grid-template-columns: 1fr !important; } }
                @media (max-width: 560px) {
                    .reg-outer > div:first-child div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
