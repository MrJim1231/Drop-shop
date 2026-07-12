import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cartStore } from '../store/cart.js'
import { api } from '../api/client.js'

vi.mock('../api/client.js', () => {
  return {
    api: {
      generateUserId: vi.fn(() => Promise.resolve({ userId: 'auto-user-777' }))
    }
  }
})

describe('store/cart.js', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty cart and count = 0', () => {
    expect(cartStore.getItems()).toEqual([])
    expect(cartStore.getCount()).toBe(0)
    expect(cartStore.getTotal()).toBe(0)
  })

  it('adds items correctly via addItem()', () => {
    const product = {
      id: 'prod-1',
      name: 'Test Gadget',
      price: 1500,
      image: '/img.png',
      size: 'M',
      quantity: 1
    }

    cartStore.addItem(product)

    const items = cartStore.getItems()
    expect(items.length).toBe(1)
    expect(items[0].id).toBe('prod-1')
    expect(items[0].quantity).toBe(1)
    expect(cartStore.getCount()).toBe(1)
    expect(cartStore.getTotal()).toBe(1500)
  })

  it('increments quantity when adding same product again', () => {
    const product = {
      id: 'prod-1',
      name: 'Test Gadget',
      price: 1500,
      image: '/img.png',
      size: 'M'
    }

    cartStore.addItem(product)
    cartStore.addItem({ ...product, quantity: 2 })

    const items = cartStore.getItems()
    expect(items.length).toBe(1)
    expect(items[0].quantity).toBe(3)
    expect(cartStore.getCount()).toBe(3)
    expect(cartStore.getTotal()).toBe(4500)
  })

  it('updates quantity via updateQuantity()', () => {
    const product = { id: 'prod-1', name: 'Gadget', price: 100 }
    cartStore.addItem(product)

    cartStore.updateQuantity('prod-1', 5)

    expect(cartStore.getItems()[0].quantity).toBe(5)
    expect(cartStore.getCount()).toBe(5)
  })

  it('removes item via removeItem()', () => {
    cartStore.addItem({ id: 'prod-1', name: 'G1', price: 100 })
    cartStore.addItem({ id: 'prod-2', name: 'G2', price: 200 })

    cartStore.removeItem('prod-1')

    const items = cartStore.getItems()
    expect(items.length).toBe(1)
    expect(items[0].id).toBe('prod-2')
  })

  it('clears all items via clear()', () => {
    cartStore.addItem({ id: 'prod-1', name: 'G1', price: 100 })
    expect(cartStore.getItems().length).toBe(1)

    cartStore.clear()
    expect(cartStore.getItems().length).toBe(0)
  })

  it('manages userId and generates auto ID if missing', async () => {
    expect(cartStore.getUserId()).toBeNull()

    const userId = await cartStore.ensureUserId()
    expect(userId).toBe('auto-user-777')
    expect(cartStore.getUserId()).toBe('auto-user-777')
    expect(api.generateUserId).toHaveBeenCalledOnce()
  })
})
