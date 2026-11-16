import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CASH_CUSTOMER, formatBookingCustomerName, isCashCustomer, searchMatchesCashCustomer } from './cash-customer'

describe('cash customer', () => {
  it('recognizes the fixed cash customer and not other customers', () => {
    assert.equal(isCashCustomer({ email: CASH_CUSTOMER.email }), true)
    assert.equal(isCashCustomer({
      firstName: 'Kontantkunde',
      lastName: '\u200b',
    }), true)
    assert.equal(formatBookingCustomerName('Kontantkunde', '\u200b'), 'Kontantkunde')
    assert.equal(formatBookingCustomerName('Ola', 'Nordmann'), 'Ola Nordmann')
    assert.equal(isCashCustomer({
      firstName: 'Ola',
      lastName: 'Nordmann',
      email: 'ola@example.com',
    }), false)
  })

  it('matches search for car4sale and kontantkunde', () => {
    assert.equal(searchMatchesCashCustomer('car4'), true)
    assert.equal(searchMatchesCashCustomer('Kontant'), true)
    assert.equal(searchMatchesCashCustomer('ola'), false)
  })
})
