'use client'

import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div 
      className="link-item" 
      onClick={toggleTheme} 
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%', userSelect: 'none' }}
    >
      <div 
        className="link-icon" 
        style={{ 
          background: theme === 'dark' ? '#334155' : '#fffbeb', 
          color: theme === 'dark' ? '#f1f5f9' : '#f59e0b',
          transition: 'background 0.25s, color 0.25s'
        }}
      >
        {theme === 'dark' ? <Moon size={24} strokeWidth={2.5} /> : <Sun size={24} strokeWidth={2.5} />}
      </div>
      <p className="link-label" style={{ flex: 1 }}>Dark Mode</p>
      
      <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={theme === 'dark'} 
          onChange={toggleTheme} 
          style={{ display: 'none' }} 
          id="theme-toggle-checkbox"
        />
        <label 
          htmlFor="theme-toggle-checkbox" 
          style={{
            width: '44px',
            height: '24px',
            backgroundColor: theme === 'dark' ? '#25d366' : '#cbd5e1',
            borderRadius: '12px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 0.25s',
            display: 'block'
          }}
        >
          <span 
            style={{
              width: '18px',
              height: '18px',
              backgroundColor: '#fff',
              borderRadius: '50%',
              position: 'absolute',
              top: '3px',
              left: theme === 'dark' ? '23px' : '3px',
              transition: 'left 0.25s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} 
          />
        </label>
      </div>
    </div>
  )
}
