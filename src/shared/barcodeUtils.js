// EAN-13 check digit: sum odd positions x1 + even positions x3 (1-indexed,
// excluding the check digit itself), check digit = (10 - sum % 10) % 10.
const computeEan13CheckDigit = (digits12) => {
  let sum = 0
  for (let i = 0; i < 12; i += 1) {
    const digit = Number(digits12[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  return (10 - (sum % 10)) % 10
}

// UPC-A shares the EAN-13 algorithm once treated as a 13-digit code with a
// leading 0, so it's validated by delegating to the same check-digit logic.
const toEan13Digits = (value) => {
  if (value.length === 13) return value
  if (value.length === 12) return `0${value}`
  return null
}

// Only purely numeric 12 (UPC-A) or 13 (EAN-13) digit codes are standard
// retail barcodes. Anything else (alphanumeric, other lengths) is treated as
// a free-form internal code and is not checksum-validated.
export const isStandardBarcodeLength = (value) => {
  const trimmed = String(value || "").trim()
  return /^\d{12}$/.test(trimmed) || /^\d{13}$/.test(trimmed)
}

export const isValidBarcodeChecksum = (value) => {
  const trimmed = String(value || "").trim()
  const ean13 = toEan13Digits(trimmed)
  if (!ean13) return true

  const expected = computeEan13CheckDigit(ean13.slice(0, 12))
  return expected === Number(ean13[12])
}

// Builds a candidate internal barcode using the GS1 "in-store" prefix range
// (20-29), which is reserved for retailer-assigned codes on unbarcoded
// goods (e.g. produce, bakery items sold by weight).
export const generateInternalEan13 = () => {
  const prefix = String(20 + Math.floor(Math.random() * 10))
  let body = ""
  for (let i = 0; i < 10; i += 1) {
    body += Math.floor(Math.random() * 10)
  }
  const digits12 = `${prefix}${body}`
  const checkDigit = computeEan13CheckDigit(digits12)
  return `${digits12}${checkDigit}`
}
