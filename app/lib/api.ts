const API_BASE_URL = 'http://192.168.1.30:8000/api';

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
}

export interface EmailConfig {
  id: number;
  is_enabled: boolean;
  sender_email: string;
  sender_password: string;
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

export const createBusinessCard = async (data: CreateCardData): Promise<BusinessCard> => {
  try {
    // Convert fullName to name if it exists
    const formattedData = {
      ...data,
      name: data.name || '',
    };

    const response = await fetch(`${API_BASE_URL}/business-cards/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create business card');
    }

    return response.json();
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

const api = {
  scanBusinessCard,
  createBusinessCard,
  getAllBusinessCards,
  createEmailConfig,
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig
};

export default api;