import { useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useToast } from '@/hooks/toast'
import { APP, DEFAULTS, REMIND_METHODS, THEMES, type RemindMethod, type ThemeId } from '@/config'
import * as db from '@/data/db'
import { useStore } from '@/data/store'
import { downloadBlob } from '@/lib/ics'
import { todayKey } from '@/lib/date'

export function SettingsView() {
  const store = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const importMode = useRef<'merge' | 'replace'>('merge')
  const [accentDraft, setAccentDraft] = useState(store.settings.accent ?? '#31594b')

  const pickFile = (mode: 'merge' | 'replace') => {
    importMode.current = mode
    fileRef.current?.click()
  }

  const onFile = async (file: File) => {
    try {
      const backup = JSON.parse(await file.text())
      await db.importBackup(backup, importMode.current)
      await store.reload()
      toast(importMode.current === 'merge' ? '已合并导入' : '已覆盖导入')
    } catch (e) {
      toast(e instanceof Error ? e.message : '导入失败：文件不是知时的备份')
    }
  }

  const exportJson = async () => {
    const backup = await db.exportBackup()
    downloadBlob(`kairos-backup-${todayKey()}.json`, new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    toast('备份已下载，请妥善保存')
  }

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 650, marginBottom: 10 }}>外观</div>
        <div className="segment">
          {(Object.keys(THEMES) as ThemeId[]).map((t) => (
            <button
              key={t}
              className={store.settings.theme === t ? 'on' : ''}
              onClick={() => void store.saveSettings({ theme: t })}
            >
              {THEMES[t]}
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <div>
            <div style={{ fontWeight: 550, fontSize: 14 }}>自定义主色</div>
            <div className="small muted">只换强调色，其余跟随主题</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <input
              type="color"
              value={accentDraft}
              onChange={(e) => {
                setAccentDraft(e.target.value)
                void store.saveSettings({ accent: e.target.value })
              }}
              style={{ width: 44, height: 32, border: 'none', background: 'none', padding: 0 }}
              aria-label="自定义主色"
            />
            {store.settings.accent && (
              <button className="btn small" onClick={() => void store.saveSettings({ accent: null })}>
                恢复
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 650, marginBottom: 10 }}>提醒默认值</div>
        {(Object.keys(REMIND_METHODS) as RemindMethod[]).map((m) => (
          <div className="row" key={m} style={{ padding: '8px 0' }}>
            <span style={{ fontSize: 14 }}>{REMIND_METHODS[m]}</span>
            <button
              className={`switch${store.settings.defaultRemind.includes(m) ? ' on' : ''}`}
              aria-label={REMIND_METHODS[m]}
              onClick={() => {
                const has = store.settings.defaultRemind.includes(m)
                void store.saveSettings({
                  defaultRemind: has
                    ? store.settings.defaultRemind.filter((r) => r !== m)
                    : [...store.settings.defaultRemind, m],
                })
              }}
            />
          </div>
        ))}
        <div className="row" style={{ padding: '8px 0' }}>
          <span style={{ fontSize: 14 }}>默认提前提醒（分钟）</span>
          <input
            className="input"
            type="number"
            min={0}
            step={5}
            style={{ width: 90 }}
            value={store.settings.defaultLeadMin}
            onChange={(e) => void store.saveSettings({ defaultLeadMin: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
        <div className="row" style={{ padding: '8px 0' }}>
          <span style={{ fontSize: 14 }}>强提醒声音</span>
          <button
            className={`switch${store.settings.soundEnabled ? ' on' : ''}`}
            aria-label="声音"
            onClick={() => void store.saveSettings({ soundEnabled: !store.settings.soundEnabled })}
          />
        </div>
        <div className="row" style={{ padding: '8px 0' }}>
          <span style={{ fontSize: 14 }}>手机震动</span>
          <button
            className={`switch${store.settings.vibrateEnabled ? ' on' : ''}`}
            aria-label="震动"
            onClick={() => void store.saveSettings({ vibrateEnabled: !store.settings.vibrateEnabled })}
          />
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>导出图片上的署名</label>
          <input
            className="input"
            value={store.settings.displayName}
            placeholder="你的名字或昵称"
            onChange={(e) => void store.saveSettings({ displayName: e.target.value })}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 650, marginBottom: 6 }}>数据与备份</div>
        <p className="small muted" style={{ margin: '0 0 12px' }}>
          所有数据只存在你这台设备的浏览器里，不上传任何服务器。
          换设备或清理浏览器前，请先导出备份。
        </p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => void exportJson()}>
            <Icon name="download" size={16} />
            导出备份
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={() => pickFile('merge')}>
            <Icon name="share" size={16} />
            导入合并
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={() => pickFile('replace')}>
            <Icon name="share" size={16} />
            导入覆盖
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
      </div>

      <div className="card">
        <div style={{ fontWeight: 650, marginBottom: 6 }}>关于 {APP.nameZh} {APP.nameEn}</div>
        <p className="small muted" style={{ margin: 0, lineHeight: 1.8 }}>
          版本 {APP.version} · 开源项目 {APP.repo}
          <br />
          在手机上用浏览器打开后「添加到主屏幕」，就能像 App 一样全屏使用，离线也能打开。
          <br />
          完成度 ≥ {Math.round(DEFAULTS.streakThreshold * 100)}% 记为达标一天。
        </p>
      </div>
    </>
  )
}
