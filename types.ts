
export type Role = 'user' | 'model';

export interface MessagePart {
    text: string;
}

export interface Doctor {
    name: string;
    specialty: string;
    address: string;
    rating: number;
    hospitalName?: string;
    phone?: string;
}

export interface WebSource {
    uri: string;
    title: string;
}

export interface MapSource {
    uri: string;
    title: string;
}

export interface GroundingChunk {
    web?: WebSource;
    maps?: MapSource;
}

export interface Message {
  id: string;
  role: Role;
  parts: MessagePart[];
  timestamp: Date;
  file?: File;
  doctors?: Doctor[];
  isLoading?: boolean;
  translatedText?: string;
  isTranslating?: boolean;
  groundingChunks?: GroundingChunk[];
  comparisonImage?: string;
  isPermissionError?: boolean;
}

export interface FilterCriteria {
  specialty: string;
  availableNow: boolean;
  location: string;
  doctorName: string;
  hospitalName: string;
}
