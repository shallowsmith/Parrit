/**
 * Format phone number to +1 (XXX) XXX-XXXX
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replaceAll(/\D/g, '');
  
  // Check if it's a valid US phone number (10 or 11 digits)
  if (cleaned.length === 10) {
    // Format: (XXX) XXX-XXXX -> +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Already has country code
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not a standard US format
  return phoneNumber;
};

