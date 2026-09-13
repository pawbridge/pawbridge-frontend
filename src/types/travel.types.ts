export interface TravelRegion {
  code: string;
  name: string;
}

export interface TravelRegions {
  items: TravelRegion[];
  fetchedAt: string | null;
  availability: 'PREPARING' | 'FAILED' | 'READY';
}

export interface TravelPlace {
  contentId: string;
  title: string;
  address: string | null;
  // API contract: provider-hosted Type1/Type3 photo, otherwise null. Do not crop.
  imageUrl: string | null;
}

export interface TravelPlaces {
  areaCode: string;
  items: TravelPlace[];
  previewOnly: boolean;
  fetchedAt: string | null;
  availability: 'PREPARING' | 'FAILED' | 'READY' | 'STALE' | 'PARTIAL';
}

export interface TravelConditions {
  areas: string | null;
  allowedAnimals: string | null;
  requirements: string | null;
  otherInformation: string | null;
  risks: string | null;
  facilities: string | null;
  providedItems: string | null;
}

export interface TravelDetail {
  place: TravelPlace;
  overview: string | null;
  conditions: TravelConditions;
  petInformationAvailable: boolean;
  petInformationStatus: 'PREPARING' | 'FAILED' | 'READY' | 'STALE';
  source: string;
  fetchedAt: string;
  petInformationFetchedAt: string | null;
}
