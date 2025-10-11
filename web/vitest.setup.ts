import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from 'jest-axe/dist/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

