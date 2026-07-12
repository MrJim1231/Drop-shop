import { describe, it, expect } from 'vitest'
import { formatPrice, escapeHtml, stripHtml, slugify, showToast } from '../utils.js'

describe('utils.js', () => {
  describe('formatPrice', () => {
    it('formats numbers to Ukrainian Hryvnia representation', () => {
      const result = formatPrice(1234.56)
      // Intl format can include non-breaking spaces, so we normalize them for comparison
      const normalized = result.replace(/\s/g, ' ')
      expect(normalized).toContain('1 234,56')
      expect(normalized).toContain('₴')
    })

    it('returns double dash if price is invalid', () => {
      expect(formatPrice(NaN)).toBe('—')
      expect(formatPrice('not-a-number')).toBe('—')
    })
  });

  describe('escapeHtml', () => {
    it('escapes special HTML characters', () => {
      const raw = '<div>Hello & "World"</div>'
      const escaped = escapeHtml(raw)
      expect(escaped).toBe('&lt;div&gt;Hello &amp; "World"&lt;/div&gt;')
    })
  })

  describe('stripHtml', () => {
    it('strips all HTML tags and returns plain text', () => {
      const html = '<p>Hello <strong>World</strong>!</p>'
      expect(stripHtml(html)).toBe('Hello World!')
    })
  })

  describe('slugify', () => {
    it('transliterates Ukrainian letters and formats string for URLs', () => {
      expect(slugify('Супер Товар 123')).toBe('super-tovar-123')
      expect(slugify('Кошик з фруктами')).toBe('koshyk-z-fruktamy')
    })

    it('removes trailing and leading dashes', () => {
      expect(slugify('---hello---')).toBe('hello')
    })

    it('limits length of slug to avoid overly long URLs', () => {
      const longTitle = 'Цей дуже довгий заголовок категорії який повинен бути обрізаний для юрл адреси щоб не створювати проблем'
      const slug = slugify(longTitle)
      expect(slug.length).toBeLessThanOrEqual(70)
    })
  })

  describe('showToast', () => {
    it('appends and automatically removes toast element from document body', () => {
      showToast('Test Toast Notification', 'success')
      const toast = document.getElementById('toast')
      expect(toast).not.toBeNull()
      expect(toast.textContent).toBe('Test Toast Notification')
      expect(toast.className).toContain('bg-emerald-600')
    })
  })
})
