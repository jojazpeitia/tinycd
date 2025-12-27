'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import styles from './Dashboard.module.css'
import { Disc3, LibraryBig, Mail } from 'lucide-react'

type Panel = 'profile' | 'shelf' | 'contact' | 'box' | null

type Props = {
  user: User
}

function getAvatar(user: User) {
  const md: any = user.user_metadata ?? {}
  return md.avatar_url || md.picture || md.picture_url || null
}

function getName(user: User) {
  const md: any = user.user_metadata ?? {}
  return md.full_name || md.name || md.preferred_username || 'User'
}

export default function Dashboard({ user }: Props) {
  const supabase = createClient()

  const [open, setOpen] = useState<Panel>(null)

  // ✅ instead of popRef on one popover, close if click is outside the whole dashboard
  const rootRef = useRef<HTMLDivElement | null>(null)

  // profile state
  const [username, setUsername] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const avatarUrl = useMemo(() => getAvatar(user), [user])
  const displayName = useMemo(() => getName(user), [user])

  // close on outside click + Esc
  useEffect(() => {
    if (!open) return

    const onDown = (e: PointerEvent) => {
      const el = rootRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setOpen(null)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // load username from profiles table
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setError(null)
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        setError(error.message)
        return
      }
      setUsername(data?.username ?? '')
    }

    run()
    return () => {
      cancelled = true
    }
  }, [supabase, user.id])

  const saveUsername = async () => {
    const cleaned = username.trim()

    if (cleaned.length > 20) {
      setError('Username too long (max 20).')
      return
    }
    if (cleaned && !/^[a-zA-Z0-9_]+$/.test(cleaned)) {
      setError('Use letters, numbers, underscores only.')
      return
    }

    setSaving(true)
    setError(null)

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        username: cleaned || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setEditing(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const toggle = (panel: Exclude<Panel, null>) => {
    setOpen((p) => (p === panel ? null : panel))
    setEditing(false)
    setError(null)
  }

  return (
    <div ref={rootRef} className={styles.root}>
      {/* Icon stack */}
      <div className={styles.dock}>
        {/* PROFILE */}
        <div className={styles.item}>
          <button
            className={styles.avatarBtn}
            onClick={() => toggle('profile')}
            data-tip="Profile"
            data-open={open === 'profile'}
            aria-label="Profile"
          >
            {avatarUrl ? (
              <img className={styles.avatarImg} src={avatarUrl} alt="Profile avatar" />
            ) : (
              <div className={styles.avatarFallback}>
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </button>

          {open === 'profile' && (
            <div className={styles.popover} role="dialog" aria-modal="false">
              <div className={styles.card}>
                <div className={styles.header}>
                  {avatarUrl ? (
                    <img className={styles.bigAvatar} src={avatarUrl} alt="Profile avatar" />
                  ) : (
                    <div className={styles.bigAvatarFallback}>
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className={styles.userText}>
                    <div className={styles.name}>{displayName}</div>
                    <div className={styles.email}>{user.email}</div>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Username</label>

                  <div className={styles.usernameRow}>
                    <input
                      className={styles.input}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="pick a username"
                      disabled={!editing}
                    />

                    {!editing ? (
                      <button
                        className={styles.smallBtn}
                        onClick={() => setEditing(true)}
                        aria-label="Edit username"
                      >
                        ✎
                      </button>
                    ) : (
                      <button
                        className={styles.smallBtn}
                        onClick={saveUsername}
                        disabled={saving}
                        aria-label="Save username"
                      >
                        {saving ? '…' : '✓'}
                      </button>
                    )}
                  </div>

                  {error && <div className={styles.error}>{error}</div>}
                </div>

                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => alert('Manage account (coming soon)')}>
                    <span className={styles.actionIcon}>⚙</span>
                    Manage account
                  </button>

                  <button className={styles.actionBtn} onClick={signOut}>
                    <span className={styles.actionIcon}>↩</span>
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SHELF */}
        <div className={styles.item}>
          <button
            className={styles.iconBtn}
            onClick={() => toggle('shelf')}
            data-tip="Shelf"
            data-open={open === 'shelf'}
            aria-label="Shelf"
          >
            <Disc3 strokeWidth={1.2} />
          </button>

          {open === 'shelf' && (
            <div className={styles.popover} role="dialog" aria-modal="false">
              <div className={styles.card}>
                <div className={styles.placeholderTitle}>Shelf</div>
                <div className={styles.placeholderText}>Popover content goes here.</div>
              </div>
            </div>
          )}
        </div>

        {/* COLLECTION */}
        <div className={styles.item}>
          <button
            className={styles.iconBtn}
            onClick={() => toggle('box')}
            data-tip="Collection"
            data-open={open === 'box'}
            aria-label="Collection"
          >
            <LibraryBig strokeWidth={1.2} />
          </button>

          {open === 'box' && (
            <div className={styles.popover} role="dialog" aria-modal="false">
              <div className={styles.card}>
                <div className={styles.placeholderTitle}>Collection</div>
                <div className={styles.placeholderText}>Popover content goes here.</div>
              </div>
            </div>
          )}
        </div>

        {/* CONTACT */}
        <div className={styles.item}>
          <button
            className={styles.iconBtn}
            onClick={() => toggle('contact')}
            data-tip="Contact & Support"
            data-open={open === 'contact'}
            aria-label="Contact"
          >
            <Mail strokeWidth={1.2} />
          </button>

          {open === 'contact' && (
            <div className={styles.popover} role="dialog" aria-modal="false">
              <div className={styles.card}>
                <div className={styles.placeholderTitle}>Contact</div>
                <div className={styles.placeholderText}>Popover content goes here.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}