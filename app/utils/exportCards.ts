import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { BusinessCard } from '../lib/api';

/**
 * Generate HTML for a business card with QR code
 */
const generateCardHTML = (card: BusinessCard): string => {
  
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
          
          <!-- Date -->
          <div style="text-align: right; padding: 4px;">
            <p style="margin: 0; font-size: 10px; color: #6B7280; font-style: italic;">${createdDate}</p>
          </div>
        </div>
        
        <!-- Middle Section - Contact and Notes -->
        <div style="margin-bottom: 8px;">
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
