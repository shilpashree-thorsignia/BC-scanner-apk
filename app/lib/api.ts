import { API_BASE_URL } from '../config';

export interface BusinessCard {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  image: string | null;
  created_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  type?: string; // 'qr_business_card' for QR scanned cards
}

export interface EmailConfig {
  id: number;
  is_enabled: boolean;
  sender_email: string;
  sender_password: string;
  sender_password_saved: boolean;     // Indicates if password is saved
  sender_password_masked: string;     // Masked password for display
  recipient_email: string;
  smtp_host: string;
  smtp_port: string;
  email_subject: string;
  email_template: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCardData {
  name: string;
  email?: string;
  mobile?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  address?: string;
  notes?: string;
}

export interface CreateEmailConfigData {
  is_enabled: boolean;
  sender_email: string;
  sender_password: string;
  recipient_email: string;
  smtp_host: string;
  smtp_port: string;
  email_subject: string;
  email_template: string;
}

export const scanBusinessCard = async (imageUri: string): Promise<BusinessCard> => {
  try {
    const formData = new FormData();
    
    // Create a file object from the image URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/business-cards/scan_card/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to scan business card');
    }

    return response.json();
  } catch (error) {
    console.error('Error scanning business card:', error);
    throw error;
  }
};

export const scanQRCode = async (imageUri: string): Promise<BusinessCard> => {
  try {
    const formData = new FormData();
    
    // Create a file object from the image URI
    const filename = imageUri.split('/').pop() || 'scan_image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/business-cards/scan_qr/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to scan image');
    }

    return response.json();
  } catch (error) {
    console.error('Error scanning image:', error);
    throw error;
  }
};

export const scanBusinessCardDualSide = async (frontImageUri: string, backImageUri: string): Promise<BusinessCard> => {
  try {
    const formData = new FormData();
    
    // Create file objects for both images
    const frontFilename = frontImageUri.split('/').pop() || 'front_image.jpg';
    const frontMatch = /\.(\w+)$/.exec(frontFilename);
    const frontType = frontMatch ? `image/${frontMatch[1]}` : 'image/jpeg';
    
    const backFilename = backImageUri.split('/').pop() || 'back_image.jpg';
    const backMatch = /\.(\w+)$/.exec(backFilename);
    const backType = backMatch ? `image/${backMatch[1]}` : 'image/jpeg';
    
    formData.append('front_image', {
      uri: frontImageUri,
      name: frontFilename,
      type: frontType,
    } as any);
    
    formData.append('back_image', {
      uri: backImageUri,
      name: backFilename,
      type: backType,
    } as any);

    const response = await fetch(`${API_BASE_URL}/business-cards/scan_card_dual_side/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to scan business card (dual-side)');
    }

    return response.json();
  } catch (error) {
    console.error('Error scanning dual-side business card:', error);
    throw error;
  }
};

export const createBusinessCard = async (data: CreateCardData): Promise<BusinessCard> => {
  try {
    // Format data for backend (backend expects snake_case field names)
    const formattedData = {
      name: data.name || '',
      email: data.email || null,
      mobile: data.mobile || null,
      company: data.company || null,
      job_title: data.jobTitle || null, // Convert camelCase to snake_case
      website: data.website || null,
      address: data.address || null,
      notes: data.notes || null,
    };

    console.log('🚀 Attempting to create business card with data:', formattedData);

    const response = await fetch(`${API_BASE_URL}/business-cards/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error response:', errorData);
      
      // Extract detailed validation errors if available
      if (errorData.validation_errors) {
        const validationMessages = Object.entries(errorData.validation_errors)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        throw new Error(`Validation failed:\n${validationMessages}`);
      }
      
      throw new Error(errorData.error || errorData.message || 'Failed to create business card');
    }

    const result = await response.json();
    console.log('✅ Success response:', result);
    return result.business_card || result; // Handle both response formats
  } catch (error) {
    console.error('Error creating business card:', error);
    throw error;
  }
};

export const getAllBusinessCards = async (): Promise<BusinessCard[]> => {
  try {
    console.log(`Fetching business cards from ${API_BASE_URL}/business-cards/`);
    
    const response = await fetch(`${API_BASE_URL}/business-cards/`);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Failed to fetch business cards: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully retrieved ${data.length} business cards`);
    return data;
  } catch (error) {
    console.error('Error fetching business cards:', error);
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('Network error - check if the server is running and accessible');
    }
    throw error;
  }
};

export const updateBusinessCard = async (id: number, data: CreateCardData): Promise<BusinessCard> => {
  try {
    // Map frontend field names to backend field names
    const formattedData = {
      name: data.name || '',
      email: data.email || null,
      mobile: data.mobile || null,
      company: data.company || null,
      job_title: data.jobTitle || null, // Convert camelCase to snake_case
      website: data.website || null,
      address: data.address || null,
      notes: data.notes || null,
    };

    const response = await fetch(`${API_BASE_URL}/business-cards/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update business card');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating business card:', error);
    throw error;
  }
};

export const deleteBusinessCard = async (id: number): Promise<{ message: string; deleted_at: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business-cards/${id}/`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete business card');
    }

    return response.json();
  } catch (error) {
    console.error('Error deleting business card:', error);
    throw error;
  }
};

export const restoreBusinessCard = async (id: number): Promise<{ message: string; data: BusinessCard }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business-cards/${id}/restore/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to restore business card');
    }

    return response.json();
  } catch (error) {
    console.error('Error restoring business card:', error);
    throw error;
  }
};

export const getDeletedBusinessCards = async (): Promise<BusinessCard[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business-cards/trash/`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch deleted business cards: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Extract business_cards array from the response object
    return data.business_cards || [];
  } catch (error) {
    console.error('Error fetching deleted business cards:', error);
    throw error;
  }
};

export const permanentDeleteBusinessCard = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business-cards/${id}/permanent_delete/`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to permanently delete business card');
    }

    return response.json();
  } catch (error) {
    console.error('Error permanently deleting business card:', error);
    throw error;
  }
};

export const emptyTrash = async (): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business-cards/empty_trash/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to empty trash');
    }

    return response.json();
  } catch (error) {
    console.error('Error emptying trash:', error);
    throw error;
  }
};

export const createEmailConfig = async (data: CreateEmailConfigData): Promise<EmailConfig> => {
  try {
    const response = await fetch(`${API_BASE_URL}/email-config/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create email configuration');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating email configuration:', error);
    throw error;
  }
};

export const getEmailConfig = async (): Promise<EmailConfig | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/email-config/`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No configuration exists yet
      }
      const errorText = await response.text();
      throw new Error(`Failed to fetch email configuration: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching email configuration:', error);
    throw error;
  }
};

export const updateEmailConfig = async (id: number, data: CreateEmailConfigData): Promise<EmailConfig> => {
  try {
    const response = await fetch(`${API_BASE_URL}/email-config/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update email configuration');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating email configuration:', error);
    throw error;
  }
};

export const testEmailConfig = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/email-config/${id}/test/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to test email configuration');
    }

    return response.json();
  } catch (error) {
    console.error('Error testing email configuration:', error);
    throw error;
  }
};

export class ApiService {
  /**
   * Test backend connectivity
   */
  static async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      console.log('🏥 Testing backend health at:', `${API_BASE_URL.replace('/api', '')}/health/`);
      
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Health check response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backend health check successful:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - backend may not be accessible');
      }
      
      throw error;
    }
  }

  /**
   * Test API base endpoint
   */
  static async testApiBase(): Promise<any> {
    try {
      console.log('🧪 Testing API base at:', `${API_BASE_URL}/`);
      
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API base response status:', response.status);
      
      const data = await response.json();
      console.log('✅ API base test successful:', data);
      
      return data;
    } catch (error) {
      console.error('❌ API base test failed:', error);
      throw error;
    }
  }
}

const api = {
  scanBusinessCard,
  createBusinessCard,
  getAllBusinessCards,
  updateBusinessCard,
  deleteBusinessCard,
  restoreBusinessCard,
  getDeletedBusinessCards,
  permanentDeleteBusinessCard,
  emptyTrash,
  createEmailConfig,
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig
};

export default api;