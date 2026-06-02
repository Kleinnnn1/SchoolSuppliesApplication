export const generateBarcode = () => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const code = `${timestamp}${random}`.slice(0, 12);
  
  // Calculate EAN-13 check digit
  const digits = code.split('').map(Number);
  const sum = digits.reduce((acc, digit, i) => {
    return acc + digit * (i % 2 === 0 ? 1 : 3);
  }, 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return `${code}${checkDigit}`;
};