const envsubst = require('../envsubst')

test('envsubst — replace env', () => {
	expect(envsubst('123_${TEST}_234', { TEST: 456 })).toBe('123_456_234')
})

test('envsubst — replace not existing env', () => {
	expect(envsubst('123_${TEST}_234', { TEST1: 456 })).toBe('123_${TEST}_234')
})

test('envsubst — empty context', () => {
	expect(envsubst('123_${TEST}_234', {})).toBe('123_${TEST}_234')
})

test('envsubst — undefined context', () => {
	expect(envsubst('123_${TEST}_234')).toBe('123_${TEST}_234')
})
