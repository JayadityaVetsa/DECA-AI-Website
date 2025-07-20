// DECA Performance Indicators Database
// Based on official DECA Performance Indicators distribution charts

export interface PerformanceIndicator {
  id: string;
  name: string;
  description?: string;
  district_weight: number;
  association_weight: number;
  icdc_weight: number;
}

export interface DECAEvent {
  name: string;
  cluster: string;
  performance_indicators: Record<string, PerformanceIndicator>;
}

export interface DECACluster {
  name: string;
  description: string;
  events: string[];
  common_pis: Record<string, PerformanceIndicator>;
}

// Complete Performance Indicators Database from DECA Official Charts
export const DECA_PERFORMANCE_INDICATORS = {
  'Business Administration': {
    'Business Law': { district: 1, association: 1, icdc: 4 },
    'Communications': { district: 15, association: 15, icdc: 11 },
    'Customer Relations': { district: 5, association: 5, icdc: 4 },
    'Economics': { district: 7, association: 7, icdc: 12 },
    'Emotional Intelligence': { district: 22, association: 22, icdc: 19 },
    'Entrepreneurship': { district: 0, association: 0, icdc: 1 },
    'Financial Analysis': { district: 16, association: 16, icdc: 13 },
    'Human Resources Management': { district: 1, association: 1, icdc: 1 },
    'Information Management': { district: 10, association: 10, icdc: 11 },
    'Marketing': { district: 1, association: 1, icdc: 1 },
    'Operations': { district: 11, association: 11, icdc: 13 },
    'Professional Development': { district: 11, association: 11, icdc: 9 },
    'Strategic Management': { district: 0, association: 0, icdc: 1 }
  },
  'Business Management': {
    'Business Law': { district: 5, association: 5, icdc: 5 },
    'Communications': { district: 7, association: 6, icdc: 6 },
    'Customer Relations': { district: 2, association: 2, icdc: 1 },
    'Economics': { district: 6, association: 5, icdc: 4 },
    'Emotional Intelligence': { district: 9, association: 8, icdc: 6 },
    'Entrepreneurship': { district: 1, association: 0, icdc: 0 },
    'Financial Analysis': { district: 7, association: 6, icdc: 5 },
    'Human Resources Management': { district: 1, association: 0, icdc: 0 },
    'Information Management': { district: 7, association: 6, icdc: 6 },
    'Knowledge Management': { district: 6, association: 7, icdc: 9 },
    'Marketing': { district: 1, association: 1, icdc: 1 },
    'Operations': { district: 21, association: 24, icdc: 26 },
    'Professional Development': { district: 6, association: 5, icdc: 4 },
    'Project Management': { district: 6, association: 7, icdc: 8 },
    'Quality Management': { district: 3, association: 4, icdc: 5 },
    'Risk Management': { district: 4, association: 5, icdc: 5 },
    'Strategic Management': { district: 8, association: 9, icdc: 10 }
  },
  'Entrepreneurship': {
    'Business Law': { district: 4, association: 4, icdc: 3 },
    'Channel Management': { district: 3, association: 3, icdc: 3 },
    'Communications': { district: 1, association: 0, icdc: 1 },
    'Customer Relations': { district: 1, association: 1, icdc: 1 },
    'Economics': { district: 3, association: 3, icdc: 2 },
    'Emotional Intelligence': { district: 6, association: 6, icdc: 4 },
    'Entrepreneurship': { district: 14, association: 13, icdc: 14 },
    'Financial Analysis': { district: 10, association: 9, icdc: 11 },
    'Human Resources Management': { district: 5, association: 4, icdc: 4 },
    'Information Management': { district: 4, association: 3, icdc: 2 },
    'Market Planning': { district: 5, association: 6, icdc: 6 },
    'Marketing': { district: 8, association: 9, icdc: 9 },
    'Operations': { district: 9, association: 9, icdc: 9 },
    'Professional Development': { district: 4, association: 4, icdc: 4 },
    'Product/Service Management': { district: 7, association: 8, icdc: 8 },
    'Promotion': { district: 5, association: 5, icdc: 5 },
    'Selling': { district: 5, association: 5, icdc: 5 },
    'Strategic Management': { district: 5, association: 5, icdc: 5 }
  },
  'Finance': {
    'Business Law': { district: 3, association: 3, icdc: 3 },
    'Communications': { district: 8, association: 8, icdc: 7 },
    'Customer Relations': { district: 3, association: 3, icdc: 3 },
    'Economics': { district: 8, association: 8, icdc: 8 },
    'Emotional Intelligence': { district: 10, association: 10, icdc: 9 },
    'Financial Analysis': { district: 25, association: 25, icdc: 26 },
    'Human Resources Management': { district: 2, association: 2, icdc: 2 },
    'Information Management': { district: 5, association: 5, icdc: 5 },
    'Operations': { district: 8, association: 8, icdc: 8 },
    'Professional Development': { district: 8, association: 8, icdc: 8 },
    'Risk Management': { district: 6, association: 6, icdc: 6 },
    'Strategic Management': { district: 4, association: 4, icdc: 4 }
  },
  'Hospitality': {
    'Business Law': { district: 2, association: 2, icdc: 2 },
    'Communications': { district: 8, association: 8, icdc: 8 },
    'Customer Relations': { district: 12, association: 12, icdc: 12 },
    'Economics': { district: 4, association: 4, icdc: 4 },
    'Emotional Intelligence': { district: 10, association: 10, icdc: 10 },
    'Human Resources Management': { district: 8, association: 8, icdc: 8 },
    'Information Management': { district: 4, association: 4, icdc: 4 },
    'Marketing': { district: 6, association: 6, icdc: 6 },
    'Operations': { district: 20, association: 20, icdc: 20 },
    'Professional Development': { district: 6, association: 6, icdc: 6 },
    'Risk Management': { district: 4, association: 4, icdc: 4 },
    'Strategic Management': { district: 6, association: 6, icdc: 6 }
  },
  'Marketing': {
    'Business Law': { district: 2, association: 2, icdc: 2 },
    'Channel Management': { district: 4, association: 4, icdc: 4 },
    'Communications': { district: 6, association: 6, icdc: 6 },
    'Customer Relations': { district: 8, association: 8, icdc: 8 },
    'Economics': { district: 4, association: 4, icdc: 4 },
    'Emotional Intelligence': { district: 6, association: 6, icdc: 6 },
    'Information Management': { district: 4, association: 4, icdc: 4 },
    'Market Planning': { district: 8, association: 8, icdc: 8 },
    'Marketing': { district: 6, association: 6, icdc: 6 },
    'Operations': { district: 4, association: 4, icdc: 4 },
    'Pricing': { district: 4, association: 4, icdc: 4 },
    'Product/Service Management': { district: 8, association: 8, icdc: 8 },
    'Professional Development': { district: 4, association: 4, icdc: 4 },
    'Promotion': { district: 10, association: 10, icdc: 10 },
    'Purchasing': { district: 2, association: 2, icdc: 2 },
    'Risk Management': { district: 2, association: 2, icdc: 2 },
    'Selling': { district: 8, association: 8, icdc: 8 },
    'Strategic Management': { district: 4, association: 4, icdc: 4 }
  }
};

// All 60+ DECA Events organized by cluster
export const DECA_EVENTS_DATABASE = {
  'Business Administration': [
    'Accounting Applications',
    'Business Law',
    'Business Management',
    'Entrepreneurship',
    'Finance',
    'Human Resources Management',
    'Information Technology',
    'Operations Research'
  ],
  'Business Management': [
    'Business Ethics',
    'Business Management',
    'Hospitality Management',
    'International Business',
    'Knowledge Management',
    'Project Management',
    'Public Relations',
    'Risk Management'
  ],
  'Entrepreneurship': [
    'Entrepreneurship Event',
    'Innovation Plan',
    'Start-up Business Plan'
  ],
  'Finance': [
    'Accounting Applications',
    'Business Finance',
    'Corporate Finance',
    'Financial Consulting',
    'Financial Services',
    'Insurance Services',
    'Investment Services',
    'Personal Financial Planning'
  ],
  'Hospitality': [
    'Food Marketing',
    'Hotel and Lodging Management',
    'Quick Serve Restaurant Management',
    'Restaurant and Food Service Management',
    'Tourism and Travel Marketing'
  ],
  'Marketing': [
    'Advertising Campaign',
    'Apparel and Accessories Marketing',
    'Automotive Services Marketing',
    'Business Services Marketing',
    'Digital Marketing Campaign',
    'Fashion Marketing',
    'Food Marketing',
    'International Marketing',
    'Marketing Communications',
    'Marketing Management',
    'Product Marketing',
    'Retail Marketing',
    'Social Media Marketing',
    'Sports and Entertainment Marketing'
  ]
};

// Utility functions for working with Performance Indicators
export class PIManager {
  static getClusterPIs(cluster: string): Record<string, any> {
    return DECA_PERFORMANCE_INDICATORS[cluster as keyof typeof DECA_PERFORMANCE_INDICATORS] || {};
  }

  static getWeightedPIs(cluster: string, level: 'district' | 'association' | 'icdc' = 'district'): string[] {
    const clusterPIs = this.getClusterPIs(cluster);
    const weightedPIs: string[] = [];
    
    Object.entries(clusterPIs).forEach(([pi, weights]) => {
      const weight = weights[level] || 0;
      // Add PI multiple times based on weight for random selection
      for (let i = 0; i < weight; i++) {
        weightedPIs.push(pi);
      }
    });
    
    return weightedPIs;
  }

  static selectRandomPIs(cluster: string, count: number = 3, level: 'district' | 'association' | 'icdc' = 'district'): string[] {
    const weightedPIs = this.getWeightedPIs(cluster, level);
    const selected = new Set<string>();
    
    while (selected.size < count && selected.size < Object.keys(this.getClusterPIs(cluster)).length) {
      const randomPI = weightedPIs[Math.floor(Math.random() * weightedPIs.length)];
      selected.add(randomPI);
    }
    
    return Array.from(selected);
  }

  static getClusterEvents(cluster: string): string[] {
    return DECA_EVENTS_DATABASE[cluster as keyof typeof DECA_EVENTS_DATABASE] || [];
  }

  static getAllClusters(): string[] {
    return Object.keys(DECA_EVENTS_DATABASE);
  }

  static validateClusterEvent(cluster: string, event: string): boolean {
    const events = this.getClusterEvents(cluster);
    return events.includes(event);
  }

  static getPIDistribution(cluster: string, level: 'district' | 'association' | 'icdc' = 'district'): Record<string, number> {
    const clusterPIs = this.getClusterPIs(cluster);
    const distribution: Record<string, number> = {};
    
    Object.entries(clusterPIs).forEach(([pi, weights]) => {
      distribution[pi] = weights[level] || 0;
    });
    
    return distribution;
  }
}

export default PIManager; 