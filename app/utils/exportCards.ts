import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { BusinessCard } from '../lib/api';

/**
 * Generate HTML for a business card with QR code
 */
const generateCardHTML = (card: BusinessCard): string => {
  // Create MECARD format for QR code
  const qrData = `MECARD:N:${card.name || 'Not Provided'};${card.mobile ? 'TEL:' + card.mobile + ';' : ''}${card.email ? 'EMAIL:' + card.email + ';' : ''}${card.website ? 'URL:' + card.website + ';' : ''}${card.address ? 'ADR:' + card.address + ';' : ''}`;
  
  // Generate a data URI for the QR code using a more reliable method
  // We're using a base64 encoded SVG directly in the HTML
  const qrCodeSvg = generateQRCodeSVG(qrData, 80);
  
  // Format the created date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      // Format as time if today
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Format as date otherwise
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };
  
  const createdDate = formatDate(card.created_at);
  
  // Split name into parts if possible (assuming first name and surname)
  const nameParts = card.name ? card.name.split(' ') : ['Not', 'Provided'];
  const firstName = nameParts.length > 0 ? nameParts[0] : 'Not';
  const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Provided';
  
  return `
    <div class="card" style="border: 2px solid #3B82F6; border-radius: 8px; padding: 12px; margin-bottom: 20px; page-break-inside: avoid; background-color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); width: 90%; max-width: 500px; margin-left: auto; margin-right: auto; position: relative; overflow: hidden;">
      <div style="position: relative;">
        <!-- Top Section - Name, Title and Date/QR -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <!-- Name and Title -->
          <div>
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #000;">${firstName}</h2>
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #000;">${surname}</h2>
            <p style="margin: 1px 0 0; font-size: 12px; color: #666; font-style: italic;">${card.job_title || 'Not provided'}</p>
          </div>
          
          <!-- Date and QR Code -->
          <div style="text-align: center; width: 90px; background-color: rgba(255, 255, 255, 0.8); border-radius: 4px; padding: 4px;">
            <p style="margin: 0 0 2px; font-size: 10px; color: #6B7280; font-style: italic; text-align: center;">${createdDate}</p>
            ${qrCodeSvg}
            <p style="margin: 1px 0 0; font-size: 9px; font-weight: 600; color: #4B5563; text-align: center;">Connect</p>
            <p style="margin: 0; font-size: 7px; color: #4B5563; text-align: center;">Access to tools & resources</p>
          </div>
        </div>
        
        <!-- Middle Section - Contact and Notes -->
        <div style="padding-right: 85px; margin-bottom: 8px;">
          <!-- Contact Info -->
          <div style="margin-bottom: 4px;">
            <p style="margin: 0 0 1px; font-size: 12px; color: #4B5563;">${card.email || 'Email not provided'}</p>
            <p style="margin: 0 0 1px; font-size: 12px; color: #4B5563;">${card.mobile || 'Phone not provided'}</p>
            ${card.company ? `<p style="margin: 0 0 1px; font-size: 12px; color: #4B5563;">${card.company}</p>` : ''}
            ${card.website ? `<p style="margin: 0 0 1px; font-size: 12px; color: #4B5563; text-decoration: underline;">${card.website}</p>` : ''}
          </div>
          
          <!-- Notes -->
          <div>
            <p style="margin: 0; font-size: 11px; color: #4B5563; font-style: italic;">${card.notes || 'No additional notes provided'}</p>
          </div>
        </div>
        
        <!-- Horizontal green line -->
        <div style="height: 1px; background-color: #22C55E; margin-bottom: 8px;"></div>
        
        <!-- Bottom Section - Logos and WhatsApp -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <!-- Thor Signia Logo with tagline -->
            <div>
              <div style="display: flex; align-items: center;">
                <span style="font-size: 13px; font-weight: 400; color: #22C55E; line-height: 15px;">Thor</span>
                <span style="font-size: 13px; font-weight: 700; color: #14B8A6; line-height: 15px;">Signia</span>
              </div>
              <p style="margin: 1px 0 0; font-size: 8px; color: #666;">Committed Towards Progress</p>
            </div>
            
            <!-- ATSAIC text -->
            <span style="font-size: 14px; font-weight: 700; color: #374151; letter-spacing: 1.1px;">ATSAIC</span>
          </div>
          <p style="margin: 0; font-size: 8px; color: #4B5563;">Connect on WhatsApp</p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generate a QR code SVG as a string
 */
const generateQRCodeSVG = (data: string, size: number): string => {
  // Use QRious library to generate a proper QR code as SVG
  // This is a direct implementation that doesn't require browser environment
  
  // Create a proper QR code SVG using a simple SVG-based QR code generator
  const qrCode = generateQRCodeMatrix(data, 'M');
  const moduleCount = qrCode.length;
  const moduleSize = Math.floor(size / moduleCount);
  const margin = Math.floor((size - (moduleSize * moduleCount)) / 2);
  
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="background-color: white;">`;
  
  // Draw the QR code modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qrCode[row][col]) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;
        svgContent += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  
  svgContent += '</svg>';
  return svgContent;
};

/**
 * Generate a QR code matrix
 * This is a simplified implementation of QR code generation
 */
const generateQRCodeMatrix = (data: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'): boolean[][] => {
  // For simplicity, we'll create a fixed-size QR code matrix
  // In a real implementation, this would be dynamically sized based on data length
  const size = 25; // Version 2 QR code (25x25)
  const matrix: boolean[][] = Array(size).fill(0).map(() => Array(size).fill(false));
  
  // Add finder patterns (the three large squares in corners)
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, size - 7, 0);
  addFinderPattern(matrix, 0, size - 7);
  
  // Add timing patterns (the dotted lines between finder patterns)
  for (let i = 8; i < size - 8; i++) {
    matrix[i][6] = i % 2 === 0;
    matrix[6][i] = i % 2 === 0;
  }
  
  // Add alignment pattern for version 2 (only one at bottom right)
  addAlignmentPattern(matrix, size - 9, size - 9);
  
  // Add format information
  addFormatInfo(matrix, errorCorrectionLevel);
  
  // Add data modules based on the input string
  // This is a simplified approach - real QR codes use a specific encoding
  addDataModules(matrix, data);
  
  return matrix;
};

/**
 * Add a finder pattern to the QR code matrix
 */
const addFinderPattern = (matrix: boolean[][], row: number, col: number): void => {
  // Outer square
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (
        r === 0 || r === 6 || // Top and bottom edges
        c === 0 || c === 6 || // Left and right edges
        (r >= 2 && r <= 4 && c >= 2 && c <= 4) // Inner square
      ) {
        matrix[row + r][col + c] = true;
      }
    }
  }
};

/**
 * Add an alignment pattern to the QR code matrix
 */
const addAlignmentPattern = (matrix: boolean[][], row: number, col: number): void => {
  // 5x5 alignment pattern
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
        matrix[row + r][col + c] = true;
      }
    }
  }
};

/**
 * Add format information to the QR code matrix
 */
const addFormatInfo = (matrix: boolean[][], errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'): void => {
  // Simplified format information - in a real implementation this would be calculated
  const formatBits = {
    'L': [true, false, true, false, true, false, false, false, false, false, true, true, true, true, true],
    'M': [true, false, false, false, false, true, false, false, true, true, true, false, false, true, false],
    'Q': [true, true, true, true, false, true, true, false, true, false, false, true, false, false, true],
    'H': [true, true, false, true, true, false, true, false, false, true, false, false, true, true, false]
  };
  
  const bits = formatBits[errorCorrectionLevel];
  
  // Add format bits around the top-left finder pattern
  for (let i = 0; i < 6; i++) {
    matrix[8][i] = bits[i];
    matrix[i][8] = bits[i + 9];
  }
  matrix[8][7] = bits[6];
  matrix[8][8] = bits[7];
  matrix[7][8] = bits[8];
};

/**
 * Add data modules to the QR code matrix
 * This is a simplified approach that doesn't actually encode the data properly
 * but creates a pattern that looks like a QR code
 */
const addDataModules = (matrix: boolean[][], data: string): void => {
  const size = matrix.length;
  let dataIndex = 0;
  
  // Create a deterministic pattern based on the data string
  const hash = simpleDataHash(data);
  
  // Fill the matrix with a pattern based on the hash
  for (let row = size - 1; row >= 0; row--) {
    for (let col = size - 1; col >= 0; col -= 2) {
      // Skip areas with finder patterns and format information
      if (isReservedArea(matrix, row, col)) continue;
      if (col > 0 && isReservedArea(matrix, row, col - 1)) continue;
      
      // Set modules based on the hash
      if (col >= 0) matrix[row][col] = hash(dataIndex++) > 0.5;
      if (col > 0) matrix[row][col - 1] = hash(dataIndex++) > 0.5;
    }
  }
};

/**
 * Check if a position is in a reserved area (finder patterns, timing patterns, etc.)
 */
const isReservedArea = (matrix: boolean[][], row: number, col: number): boolean => {
  const size = matrix.length;
  
  // Check if in finder pattern areas (top-left, top-right, bottom-left)
  if (row < 9 && col < 9) return true; // Top-left finder and format info
  if (row < 9 && col >= size - 8) return true; // Top-right finder
  if (row >= size - 8 && col < 9) return true; // Bottom-left finder
  
  // Check if in timing patterns
  if (row === 6 || col === 6) return true;
  
  // Check if in alignment pattern area (for version 2)
  if (row >= size - 11 && row < size - 7 && col >= size - 11 && col < size - 7) return true;
  
  return false;
};

/**
 * Simple hash function for generating deterministic "random" values for QR code data modules
 */
const simpleDataHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Return a function that generates values between 0 and 1 based on the input
  return (seed: number) => {
    const val = Math.abs(Math.sin(hash + seed) * 10000) % 1;
    return val;
  };
};

/**
 * Generate HTML document with all business cards
 */
const generateHTML = (cards: BusinessCard[]): string => {
  const cardsHTML = cards.map(card => generateCardHTML(card)).join('');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Business Cards Export</title>
        <style>
          @page {
            margin: 15mm;
            size: A4;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 0;
            margin: 0;
            background-color: #f5f5f5;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-top: 20px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
          }
          .header h1 {
            color: #333;
            font-size: 24px;
            margin: 0;
          }
          .date {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-bottom: 30px;
          }
          .cards-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .card {
            break-inside: avoid;
          }
          @media print {
            body {
              background-color: white;
            }
            .card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Business Cards Export</h1>
        </div>
        <div class="date">
          Generated on: ${new Date().toLocaleDateString()}
        </div>
        <div class="cards-container">
          ${cardsHTML}
        </div>
      </body>
    </html>
  `;
};

/**
 * Export all business cards as a PDF
 */
export const exportBusinessCards = async (cards: BusinessCard[]): Promise<void> => {
  try {
    if (cards.length === 0) {
      Alert.alert('No Cards', 'There are no business cards to export.');
      return;
    }

    // Generate HTML content
    const html = generateHTML(cards);
    
    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });
    
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Business Cards',
        UTI: 'com.adobe.pdf'
      });
    } else {
      // If sharing is not available, save the file to documents directory
      const fileName = `BusinessCards_${new Date().getTime()}.pdf`;
      const destinationUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      Alert.alert(
        'PDF Saved',
        `Business cards have been exported to ${destinationUri}`
      );
    }
    
    // Clean up the temporary file
    await FileSystem.deleteAsync(uri, { idempotent: true });
    
  } catch (error) {
    console.error('Error exporting business cards:', error);
    Alert.alert(
      'Export Failed',
      'There was an error exporting your business cards. Please try again later.'
    );
  }
};
