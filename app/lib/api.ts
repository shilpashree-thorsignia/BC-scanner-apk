const API_BASE_URL = 'http://192.168.1.21:8000/api';

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
    const response = await fetch(`${API_BASE_URL}/business-cards/`);
    if (!response.ok) {
      throw new Error('Failed to fetch business cards');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching business cards:', error);
    throw error;
  }
}; 