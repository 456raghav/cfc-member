import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

// ── MOCK MEMBER (replace with auth later) ──
const MOCK_MEMBER_PHONE = '9810001001' // Vikram Kumar

export default function MemberApp() {
  const [screen, setScreen] = useState('home')
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMember() }, [])

  async function fetchMember() {
    const { data } = await supabase
      .from('members')
      .select('*, centers(name, city)')
      .eq('phone', MOCK_MEMBER_PHONE)
      .single()
    setMember(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="m-splash">
      <div className="m-splash-logo">CFC</div>
      <div className="m-splash-sub">CROSSTRAIN FIGHT CLUB</div>
      <div className="m-splash-loading">
        <div className="m-spinner"></div>
      </div>
    </div>
  )

  const screens = { home: HomeScreen, schedule: ScheduleScreen, progress: ProgressScreen, community: CommunityScreen, leaderboard: LeaderboardScreen, membership: MembershipScreen }
  const Screen = screens[screen] || HomeScreen

  return (
    <div className="m-app">
      <div className="m-screen">
        <Screen member={member} setScreen={setScreen} />
      </div>
      <div className="m-nav">
        {[
          { id: 'home', icon: '⌂', label: 'Home' },
          { id: 'schedule', icon: '◫', label: 'Schedule' },
          { id: 'progress', icon: '◎', label: 'Progress' },
          { id: 'community', icon: '◈', label: 'Community' },
          { id: 'leaderboard', icon: '▲', label: 'Ranks' },
          { id: 'membership', icon: '◉', label: 'My Pass' },
        ].map(n => (
          <button key={n.id} className={`m-nav-btn ${screen === n.id ? 'active' : ''}`} onClick={() => setScreen(n.id)}>
            <span className="m-nav-icon">{n.icon}</span>
            <span className="m-nav-label">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── HOME SCREEN ──
function HomeScreen({ member, setScreen }) {
  const [classes, setClasses] = useState([])
  const [attendance, setAttendance] = useState([])
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    fetchClasses()
    if (member) fetchAttendance()
  }, [member])

  async function fetchClasses() {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const today = days[new Date().getDay()]
    const { data } = await supabase.from('classes')
      .select('*, centers(name, city), disciplines(name)')
      .eq('day_of_week', today).order('time_slot')
    setClasses(data || [])
  }

  async function fetchAttendance() {
    const { data } = await supabase.from('attendance')
      .select('*').eq('member_id', member.id).order('attended_at', { ascending: false })
    setAttendance(data || [])
  }

  const streak = Math.min(attendance.length, 14)
  const sessionsThisMonth = attendance.filter(a => new Date(a.attended_at).getMonth() === new Date().getMonth()).length
  const firstName = member?.name?.split(' ')[0] || 'Fighter'
  const todayClass = classes[0]
  const daysLeft = member ? Math.round((new Date(member.expiry_date) - new Date()) / (1000*60*60*24)) : 0

  return (
    <div className="m-view">
      <div className="m-home-hero">
        <div className="m-status-bar">
          <span style={{fontSize:13,fontWeight:500}}>9:41</span>
          <span style={{fontSize:12}}>●●● 🔋</span>
        </div>
        <div className="m-greeting">Good morning, Fighter</div>
        <div className="m-hero-name">{firstName.toUpperCase()} <span>{member?.name?.split(' ')[1]?.toUpperCase()}</span></div>
        <div className="m-streak-bar">
          <span className="m-fire">🔥</span>
          <div className="m-streak-info">
            <div className="m-streak-num">{streak}</div>
            <div className="m-streak-lbl">day streak</div>
          </div>
          <div className="m-streak-badge">{streak >= 7 ? 'ON FIRE' : 'KEEP GOING'}</div>
        </div>
      </div>

      {daysLeft <= 7 && daysLeft >= 0 && (
        <div className="m-alert-banner" onClick={() => setScreen('membership')}>
          ⚠️ Membership expires in {daysLeft} days — Tap to renew
        </div>
      )}

      <div className="m-today-card">
        <div className="m-today-header">
          <div className="m-today-lbl">Today's Class</div>
          {todayClass && <div className="m-live-dot">Live Now</div>}
        </div>
        {todayClass ? (
          <>
            <div className="m-class-name">{todayClass.disciplines?.name?.toUpperCase()}</div>
            <div className="m-class-meta">
              <span>🕕 {todayClass.time_slot}</span>
              <span>📍 {todayClass.centers?.city}</span>
              <span>👤 Coach {todayClass.trainer}</span>
            </div>
            <button className={`m-book-btn ${booked ? 'booked' : ''}`} onClick={() => setBooked(!booked)}>
              {booked ? '✓ BOOKED' : 'BOOK CLASS'}
            </button>
          </>
        ) : (
          <>
            <div className="m-class-name">REST DAY</div>
            <div className="m-class-meta"><span>No classes scheduled today</span></div>
            <button className="m-book-btn" onClick={() => setScreen('schedule')}>VIEW FULL SCHEDULE</button>
          </>
        )}
      </div>

      <div className="m-quick-stats">
        <div className="m-qs"><div className="m-qs-val">{attendance.length}</div><div className="m-qs-lbl">Sessions</div></div>
        <div className="m-qs"><div className="m-qs-val">{streak}🔥</div><div className="m-qs-lbl">Streak</div></div>
        <div className="m-qs"><div className="m-qs-val">{sessionsThisMonth}</div><div className="m-qs-lbl">This Month</div></div>
      </div>

      <div className="m-section">
        <div className="m-section-title">Upcoming This Week</div>
        {classes.slice(0,3).map(c => (
          <div key={c.id} className="m-list-item">
            <div className="m-list-time">{c.time_slot}</div>
            <div className="m-list-info">
              <div className="m-list-name">{c.disciplines?.name}</div>
              <div className="m-list-sub">Coach {c.trainer} · {c.centers?.city}</div>
            </div>
            <div className="m-list-cap">{c.capacity} spots</div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="m-empty" onClick={() => setScreen('schedule')}>Tap to view full schedule →</div>
        )}
      </div>
    </div>
  )
}

// ── SCHEDULE SCREEN ──
function ScheduleScreen({ member }) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay()])
  const [classes, setClasses] = useState([])
  const [booked, setBooked] = useState({})
  const [filter, setFilter] = useState('All')

  useEffect(() => { fetchClasses() }, [selectedDay])

  async function fetchClasses() {
    const { data } = await supabase.from('classes')
      .select('*, centers(name, city), disciplines(name)')
      .eq('day_of_week', selectedDay).order('time_slot')
    setClasses(data || [])
  }

  const disciplines = ['All', 'BJJ', 'MMA', 'Boxing', 'Muay Thai', 'Kickboxing', 'Wrestling']
  const filtered = classes.filter(c => filter === 'All' || c.disciplines?.name === filter)

  const toggleBook = (id) => setBooked(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="m-view">
      <div className="m-page-header">
        <div className="m-page-title">SCHEDULE</div>
      </div>
      <div className="m-day-tabs">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
          <button key={d} className={`m-day-tab ${selectedDay === days[i] ? 'active' : ''}`}
            onClick={() => setSelectedDay(days[i])}>{d}</button>
        ))}
      </div>
      <div className="m-filter-row">
        {disciplines.map(d => (
          <button key={d} className={`m-filter-btn ${filter === d ? 'active' : ''}`}
            onClick={() => setFilter(d)}>{d}</button>
        ))}
      </div>
      <div className="m-class-list">
        {filtered.map(c => {
          const isBooked = booked[c.id]
          const pct = Math.floor(Math.random() * 60 + 30)
          return (
            <div key={c.id} className="m-class-slot">
              <div className="m-slot-top">
                <span className="m-slot-time">{c.time_slot}</span>
                <span className="m-slot-center">{c.centers?.city}</span>
              </div>
              <div className="m-slot-name">{c.disciplines?.name?.toUpperCase()}</div>
              <div className="m-slot-coach">Coach {c.trainer}</div>
              <div className="m-slot-bottom">
                <div className="m-cap-bar"><div className="m-cap-fill" style={{width:`${pct}%`, background: pct > 80 ? 'var(--m-red)' : '#2D7A45'}}></div></div>
                <span className="m-cap-txt">{Math.floor(c.capacity * pct / 100)}/{c.capacity}</span>
                <button className={`m-slot-btn ${isBooked ? 'booked' : ''}`} onClick={() => toggleBook(c.id)}>
                  {isBooked ? '✓ Booked' : 'Book'}
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--m-muted)'}}>
            <div style={{fontSize:32,marginBottom:8}}>🥋</div>
            <div>No classes on {selectedDay}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── PROGRESS SCREEN ──
function ProgressScreen({ member }) {
  const [attendance, setAttendance] = useState([])

  useEffect(() => { if (member) fetchAttendance() }, [member])

  async function fetchAttendance() {
    const { data } = await supabase.from('attendance')
      .select('*').eq('member_id', member.id).order('attended_at', { ascending: false })
    setAttendance(data || [])
  }

  const total = attendance.length
  const streak = Math.min(total, 14)
  const points = total * 20
  const nextBelt = 1000
  const pct = Math.min((points / nextBelt) * 100, 100)

  const milestones = [
    { icon: '🥊', name: 'First Class', desc: 'Completed your first session', done: total >= 1 },
    { icon: '🔟', name: '10 Sessions', desc: 'Consistency is key', done: total >= 10 },
    { icon: '🔥', name: '7-Day Streak', desc: 'One full week on the mat', done: streak >= 7 },
    { icon: '💪', name: '50 Sessions', desc: `${Math.max(0, 50 - total)} sessions away`, done: total >= 50 },
    { icon: '🏅', name: '100 Sessions', desc: `${Math.max(0, 100 - total)} sessions away`, done: total >= 100 },
    { icon: '🥋', name: 'Blue Belt', desc: `${Math.max(0, 1000 - points)} points needed`, done: points >= 1000 },
  ]

  const joinedDate = member ? new Date(member.joined_date) : new Date()
  const monthsActive = Math.max(1, Math.round((new Date() - joinedDate) / (1000*60*60*24*30)))

  return (
    <div className="m-view">
      <div className="m-page-header"><div className="m-page-title">MY PROGRESS</div></div>

      <div className="m-belt-card">
        <div className="m-belt-top">
          <div className="m-belt-circle">🥋</div>
          <div>
            <div className="m-belt-name">WHITE BELT</div>
            <div className="m-belt-sub">BJJ · {member?.centers?.city || 'Delhi'}</div>
          </div>
        </div>
        <div className="m-belt-track"><div className="m-belt-fill" style={{width:`${pct}%`}}></div></div>
        <div className="m-belt-pts">{points} / {nextBelt} pts to Blue Belt</div>
      </div>

      <div className="m-stats-grid">
        <div className="m-stat-box">
          <div className="m-stat-val">{total}</div>
          <div className="m-stat-lbl">Total Sessions</div>
          <div className="m-stat-sub">+{Math.min(total,6)} this week</div>
        </div>
        <div className="m-stat-box">
          <div className="m-stat-val">🔥{streak}</div>
          <div className="m-stat-lbl">Day Streak</div>
          <div className="m-stat-sub">Best: {streak} days</div>
        </div>
        <div className="m-stat-box">
          <div className="m-stat-val">3</div>
          <div className="m-stat-lbl">Disciplines</div>
          <div className="m-stat-sub">BJJ, Boxing, MMA</div>
        </div>
        <div className="m-stat-box">
          <div className="m-stat-val">{monthsActive}M</div>
          <div className="m-stat-lbl">Member For</div>
          <div className="m-stat-sub">Since {joinedDate.toLocaleString('en-IN',{month:'short',year:'numeric'})}</div>
        </div>
      </div>

      <div className="m-section">
        <div className="m-section-title">Milestones</div>
        {milestones.map(m => (
          <div key={m.name} className="m-milestone">
            <div className={`m-ms-icon ${m.done ? 'done' : 'locked'}`}>{m.icon}</div>
            <div className="m-ms-info">
              <div className="m-ms-name">{m.name}</div>
              <div className="m-ms-desc">{m.desc}</div>
            </div>
            <div>{m.done ? <span style={{color:'#4CAF50',fontSize:16}}>✓</span> : <span style={{color:'var(--m-dim)',fontSize:12}}>🔒</span>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── COMMUNITY SCREEN ──
function CommunityScreen({ member }) {
  const [posts, setPosts] = useState([])
  const [liked, setLiked] = useState({})
  const [posting, setPosting] = useState(false)
  const [newPost, setNewPost] = useState('')

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    const { data } = await supabase.from('posts')
      .select('*, members(name)').order('created_at', { ascending: false }).limit(20)
    setPosts(data || [])
  }

  async function submitPost() {
    if (!newPost.trim() || !member) return
    await supabase.from('posts').insert({ member_id: member.id, content: newPost, likes: 0 })
    setNewPost('')
    setPosting(false)
    fetchPosts()
  }

  const toggleLike = async (post) => {
    const isLiked = liked[post.id]
    setLiked(prev => ({ ...prev, [post.id]: !isLiked }))
    await supabase.from('posts').update({ likes: post.likes + (isLiked ? -1 : 1) }).eq('id', post.id)
    fetchPosts()
  }

  const getInitials = name => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'
  const timeAgo = (date) => {
    const diff = (new Date() - new Date(date)) / 1000
    if (diff < 3600) return `${Math.round(diff/60)}m ago`
    if (diff < 86400) return `${Math.round(diff/3600)}h ago`
    return `${Math.round(diff/86400)}d ago`
  }

  const postImages = {
    "BJJ": ["https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&q=80","https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=600&q=80"],
    "MMA": ["https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80"],
    "Boxing": ["https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&q=80"],
    "Kickboxing": ["https://images.unsplash.com/photo-1616805765352-bde6f67be72c?w=600&q=80"],
    "Muay Thai": ["https://images.unsplash.com/photo-1615117972428-28de67cda58e?w=600&q=80"],
    "default": ["https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&q=80"]
  }
  const getPostImage = (post, idx) => { const imgs = postImages[post.discipline_tag] || postImages["default"]; return imgs[idx % imgs.length] }
  const emojis = ['🥋','🥊','🤼','💪','🔥','🏅']

  return (
    <div className="m-view">
      <div className="m-page-header">
        <div className="m-page-title">COMMUNITY</div>
        <button className="m-post-btn" onClick={() => setPosting(!posting)}>+ Post</button>
      </div>

      {posting && (
        <div className="m-post-composer">
          <textarea className="m-post-input" placeholder="Share your training win..." value={newPost}
            onChange={e => setNewPost(e.target.value)} rows={3} />
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <div style={{display:'flex',gap:6,flex:1}}>
              {emojis.map(e => <span key={e} style={{fontSize:20,cursor:'pointer'}} onClick={() => setNewPost(p => p + e)}>{e}</span>)}
            </div>
            <button className="m-submit-btn" onClick={submitPost}>Post</button>
          </div>
        </div>
      )}

      <div className="m-motw">
        <span style={{fontSize:24}}>🏆</span>
        <div>
          <div className="m-motw-tag">Member of the Week</div>
          <div className="m-motw-name">Priya Joshi</div>
          <div className="m-motw-disc">21-day streak · Kickboxing · Delhi</div>
        </div>
      </div>

      {posts.length === 0 && (
        <div style={{textAlign:'center',padding:'40px 20px',color:'var(--m-muted)'}}>
          <div style={{fontSize:32,marginBottom:8}}>👊</div>
          <div>No posts yet. Be the first to share!</div>
        </div>
      )}

      {posts.map((post, idx) => (
        <div key={post.id} className="m-post-card">
          <div className="m-post-top">
            <div className="m-post-avatar">{getInitials(post.members?.name)}</div>
            <div className="m-post-meta">
              <div className="m-post-name">{post.members?.name || 'Fighter'}</div>
              <div className="m-post-time">{timeAgo(post.created_at)}</div>
            </div>
            {post.discipline_tag && <div className="m-post-tag">{post.discipline_tag}</div>}
          </div>
          <div className="m-post-image">
            <img src={getPostImage(post, idx)} alt="training" style={{width:'100%',height:'100%',objectFit:'cover'}} />
          </div>
          <div className="m-post-body">{post.content}</div>
          <div className="m-post-actions">
            <div className={`m-post-act ${liked[post.id] ? 'liked' : ''}`} onClick={() => toggleLike(post)}>
              {liked[post.id] ? '❤️' : '🤍'} {post.likes + (liked[post.id] ? 1 : 0)}
            </div>
            <div className="m-post-act">💬 Comment</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── LEADERBOARD SCREEN ──
function LeaderboardScreen({ member }) {
  const [members, setMembers] = useState([])
  const [tab, setTab] = useState('attendance')

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    const { data } = await supabase.from('members')
      .select('*, centers(city)').eq('status', 'active').limit(20)
    // Add mock scores for demo
    const withScores = (data || []).map((m, i) => ({
      ...m,
      score: Math.floor(Math.random() * 5) + 2,
      streak: Math.floor(Math.random() * 20) + 1
    })).sort((a, b) => b.score - a.score)
    setMembers(withScores)
  }

  const getInitials = name => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'
  const top3 = members.slice(0, 3)
  const rest = members.slice(3)

  return (
    <div className="m-view">
      <div className="m-page-header">
        <div className="m-page-title">LEADERBOARD</div>
        <div className="m-page-sub">Week of Apr 21 — 27</div>
      </div>

      <div className="m-lb-tabs">
        {['attendance','streak','all time'].map(t => (
          <button key={t} className={`m-lb-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)} style={{textTransform:'capitalize'}}>{t}</button>
        ))}
      </div>

      {top3.length > 0 && (
        <div className="m-top3">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((m, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3
            const medals = ['🥇','🥈','🥉']
            const sizes = [52, 44, 40]
            const heights = [60, 44, 32]
            return (
              <div key={m.id} className="m-podium">
                <div className="m-pod-avatar" style={{width:sizes[i===1?0:i===0?1:2],height:sizes[i===1?0:i===0?1:2],borderColor:rank===1?'var(--m-gold)':rank===2?'#9E9E9E':'#CD7F32'}}>
                  {getInitials(m.name)}
                </div>
                <div className="m-pod-name">{m.name?.split(' ')[0]}</div>
                <div className="m-pod-score">{m.score} sessions</div>
                <div className="m-pod-block" style={{height:heights[i===1?0:i===0?1:2]}}>{medals[rank-1]}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="m-lb-list">
        {rest.map((m, i) => {
          const isMe = m.phone === MOCK_MEMBER_PHONE
          return (
            <div key={m.id} className={`m-lb-row ${isMe ? 'me' : ''}`}>
              <div className="m-lb-pos">{i + 4}</div>
              <div className="m-lb-avatar" style={{borderColor: isMe ? 'var(--m-red)' : 'transparent'}}>{getInitials(m.name)}</div>
              <div className="m-lb-info">
                <div className="m-lb-name" style={{color: isMe ? 'var(--m-red)' : ''}}>{m.name}{isMe ? ' (You)' : ''}</div>
                <div className="m-lb-disc">{m.centers?.city}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="m-lb-score">{m.score}</div>
                <div className="m-lb-streak">🔥 {m.streak} days</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MEMBERSHIP SCREEN ──
function MembershipScreen({ member }) {
  if (!member) return <div className="m-loading">Loading...</div>

  const daysLeft = Math.round((new Date(member.expiry_date) - new Date()) / (1000*60*60*24))
  const totalDays = member.plan === '3-Month' ? 90 : member.plan === '6-Month' ? 180 : 30
  const usedPct = Math.max(0, Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)))

  const history = [
    { plan: member.plan, date: new Date(member.joined_date).toLocaleDateString('en-IN'), price: member.plan_price },
    { plan: '1-Month', date: '1/10/2024', price: 3500 },
    { plan: '1-Month', date: '1/9/2024', price: 3500 },
  ]

  return (
    <div className="m-view">
      <div className="m-page-header"><div className="m-page-title">MEMBERSHIP</div></div>

      <div className="m-mem-card">
        <div className="m-mem-plan">{member.plan} Plan · {daysLeft > 0 ? 'Active' : 'Expired'}</div>
        <div className="m-mem-name">{member.name?.toUpperCase()}</div>
        <div className="m-mem-center">📍 {member.centers?.name} · BJJ + MMA</div>
        <div className="m-mem-row">
          <div>
            <div className="m-mem-lbl">Member Since</div>
            <div className="m-mem-val">{new Date(member.joined_date).toLocaleDateString('en-IN')}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div className="m-mem-lbl">Expires</div>
            <div className="m-mem-val" style={{color: daysLeft <= 7 ? 'var(--m-gold)' : ''}}>{new Date(member.expiry_date).toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        <div className="m-expiry-bar"><div className="m-expiry-fill" style={{width:`${usedPct}%`}}></div></div>
        <div className="m-expiry-txt">{usedPct}% used · {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}</div>
        <button className="m-renew-btn">RENEW MEMBERSHIP</button>
      </div>

      <div className="m-section">
        <div className="m-section-title">Payment History</div>
        {history.map((h, i) => (
          <div key={i} className="m-hist-item">
            <div className="m-hist-dot"></div>
            <div className="m-hist-info">
              <div className="m-hist-name">{h.plan}</div>
              <div className="m-hist-date">{h.date}</div>
            </div>
            <div className="m-hist-amt">₹{h.price?.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
