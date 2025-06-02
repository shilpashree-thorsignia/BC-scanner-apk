/**
 * Parse QR code data into business card information
 * Supports MECARD and vCard formats
 * 
 * MECARD format example: MECARD:N:John Doe;TEL:123456789;EMAIL:john@example.com;URL:https://example.com;NOTE:Software Engineer;
 * vCard format example: BEGIN:VCARD\nVERSION:3.0\nN:Doe;John;;;\nFN:John Doe\nORG:Company\nTITLE:Software Engineer\nTEL:123456789\nEMAIL:john@example.com\nURL:https://example.com\nEND:VCARD
 */
export interface ParsedBusinessCard {
  name: string;
  mobile?: string;
  email?: string;
  website?: string;
  job_title?: string;
  company?: string;
  address?: string;
}

/**
 * Main parser function that detects format and calls appropriate parser
 */
export const parseQRCode = (data: string): ParsedBusinessCard | null => {
  // Safety check for null or undefined data
  if (!data) {
    console.error('QR code parser received null or undefined data');
    return null;
  }

  // Trim the data to remove any leading/trailing whitespace
  const trimmedData = data.trim();
  
  // Log the format detection attempt
  console.log('QR format detection - Data starts with:', trimmedData.substring(0, 20));
  
  // Check if it's a MECARD format
  if (trimmedData.startsWith('MECARD:')) {
    console.log('Detected MECARD format');
    return parseMECARD(trimmedData);
  }
  
  // Check if it's a vCard format (case insensitive)
  if (trimmedData.toUpperCase().startsWith('BEGIN:VCARD')) {
    console.log('Detected vCard format');
    return parseVCard(trimmedData);
  }
  
  // Try to detect if it's a plain text contact info without formal format
  // This is a fallback for non-standard QR codes
  if (trimmedData.includes('@') || trimmedData.includes('tel:') || trimmedData.includes('phone:')) {
    console.log('Attempting to parse as plain text contact');
    return parseSimpleText(trimmedData);
  }
  
  // If it's just a simple text (like a name), create a basic card with just the name
  if (trimmedData.length > 0 && trimmedData.length < 100) {
    console.log('Treating as simple name text');
    return {
      name: trimmedData
    };
  }
  
  // Unknown format
  console.log('Unknown QR code format');
  return null;
};

/**
 * Parse MECARD format QR code data
 */
export const parseMECARD = (data: string): ParsedBusinessCard | null => {
  // Initialize the business card object
  const businessCard: ParsedBusinessCard = {
    name: '',
  };

  // Extract the data portion after "MECARD:"
  const cardData = data.substring(7);
  
  // Split the data by semicolons to get individual fields
  const fields = cardData.split(';').filter(field => field.trim() !== '');
  
  // Process each field
  fields.forEach(field => {
    // Some MECARD formats might have fields without values
    if (!field.includes(':')) return;
    
    const [key, ...valueParts] = field.split(':');
    const value = valueParts.join(':'); // Handle values that might contain colons
    
    if (!key || !value) return;
    
    switch (key) {
      case 'N':
        businessCard.name = value;
        break;
      case 'TEL':
        businessCard.mobile = value;
        break;
      case 'EMAIL':
        businessCard.email = value;
        break;
      case 'URL':
        businessCard.website = value;
        break;
      case 'NOTE':
        // NOTE field is used for job title in our app
        businessCard.job_title = value;
        break;
      case 'ORG':
        businessCard.company = value;
        break;
      case 'ADR':
        businessCard.address = value;
        break;
      case 'TITLE':
        // Some MECARD variants use TITLE instead of NOTE for job title
        businessCard.job_title = value;
        break;
    }
  });
  
  // Ensure we have at least a name
  if (!businessCard.name) {
    return null;
  }
  
  return businessCard;
};

/**
 * Parse vCard format QR code data
 */
export const parseVCard = (data: string): ParsedBusinessCard | null => {
  // Initialize the business card object
  const businessCard: ParsedBusinessCard = {
    name: '',
  };
  
  // Split the vCard data into lines
  const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Process each line
  lines.forEach(line => {
    if (!line.includes(':')) return;
    
    const [keyPart, ...valueParts] = line.split(':');
    const value = valueParts.join(':'); 
    
    const [key] = keyPart.split(';');
    
    if (!key || !value) return;
    
    switch (key) {
      case 'FN':
        businessCard.name = value;
        break;
      case 'N':
        if (!businessCard.name) {
          const nameParts = value.split(';');
          if (nameParts.length >= 2) {
            // Format as "First Last"
            businessCard.name = `${nameParts[1].trim()} ${nameParts[0].trim()}`.trim();
          } else {
            businessCard.name = value;
          }
        }
        break;
      case 'TEL':
        businessCard.mobile = value;
        break;
      case 'EMAIL':
        businessCard.email = value;
        break;
      case 'URL':
        businessCard.website = value;
        break;
      case 'TITLE':
        businessCard.job_title = value;
        break;
      case 'ORG':
        businessCard.company = value.split(';')[0]; // First part of ORG is company name
        break;
      case 'ADR':
        // ADR format: PO Box;Extended Address;Street;City;State;Postal Code;Country
        const adrParts = value.split(';');
        const addressParts = [];
        
        // Add non-empty parts
        if (adrParts[2]) addressParts.push(adrParts[2]); // Street
        if (adrParts[3]) addressParts.push(adrParts[3]); // City
        if (adrParts[4]) addressParts.push(adrParts[4]); // State
        if (adrParts[5]) addressParts.push(adrParts[5]); // Postal Code
        if (adrParts[6]) addressParts.push(adrParts[6]); // Country
        
        businessCard.address = addressParts.join(', ');
        break;
    }
  });
  
  // Ensure we have at least a name
  if (!businessCard.name) {
    return null;
  }
  
  return businessCard;
};

/**
 * Parse simple text format that might contain contact information
 * This is a fallback for non-standard QR codes
 */
export const parseSimpleText = (data: string): ParsedBusinessCard | null => {
  // Initialize with empty card
  const businessCard: ParsedBusinessCard = {
    name: ''
  };
  
  // Split by lines or other common separators
  const lines = data.split(/[\n\r,;]/).filter(line => line.trim() !== '');
  
  // Try to extract information from each line
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Look for email addresses
    if (trimmedLine.includes('@') && !businessCard.email) {
      const emailMatch = trimmedLine.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatch) {
        businessCard.email = emailMatch[0];
      }
    }
    
    // Look for phone numbers
    if (!businessCard.mobile) {
      // Look for common phone number patterns
      const phoneMatch = trimmedLine.match(/(?:tel:|phone:|call:)?\s*([+]?[\d\s()-]{7,})/i);
      if (phoneMatch) {
        businessCard.mobile = phoneMatch[1].trim();
      }
    }
    
    // Look for URLs
    if (!businessCard.website) {
      const urlMatch = trimmedLine.match(/(?:https?:\/\/)?[\w-]+\.[\w.-]+(?:\.[a-zA-Z]{2,})?[\w\-._~:/?#[\]@!$&'()*+,;=]*/i);
      if (urlMatch && !trimmedLine.includes('@')) { // Avoid matching emails as URLs
        businessCard.website = urlMatch[0];
        if (!businessCard.website.startsWith('http')) {
          businessCard.website = 'https://' + businessCard.website;
        }
      }
    }
    
    // Try to guess the name (usually one of the first lines without special characters)
    if (!businessCard.name && lines.indexOf(line) < 3) {
      // If line doesn't look like email, URL, or phone number, it might be a name
      if (!trimmedLine.includes('@') && 
          !trimmedLine.match(/^https?:\/\//) && 
          !trimmedLine.match(/^[+]?[\d\s()-]{7,}$/)) {
        businessCard.name = trimmedLine;
      }
    }
  });
  
  // If we couldn't find a name but have other information, use a placeholder
  if (!businessCard.name && (businessCard.email || businessCard.mobile || businessCard.website)) {
    businessCard.name = businessCard.email ? 
      businessCard.email.split('@')[0] : 
      'Contact';
  }
  
  // Return null if we couldn't extract any useful information
  if (!businessCard.name && !businessCard.email && !businessCard.mobile && !businessCard.website) {
    return null;
  }
  
  return businessCard;
};
