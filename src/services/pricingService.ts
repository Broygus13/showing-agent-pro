import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PricingData } from './authService';

// Simple ZIP code distance calculation (stub implementation)
function calculateDistance(zip1: string, zip2: string): number {
  // This is a simplified distance calculation
  // In a real implementation, you would use a geocoding service
  const zip1Num = parseInt(zip1.replace(/\D/g, ''));
  const zip2Num = parseInt(zip2.replace(/\D/g, ''));
  return Math.abs(zip1Num - zip2Num) / 100; // Rough approximation
}

export interface AgentPricing {
  agentId: string;
  agentName: string;
  price: number;
  pricingMode: string;
  distance?: number;
  propertyValue?: number;
}

export class PricingService {
  static async calculateAgentPricing(
    agentId: string,
    propertyAddress: string,
    propertyPrice: number
  ): Promise<AgentPricing | null> {
    try {
      // Fetch agent's pricing preferences
      const agentDoc = await getDoc(doc(db, 'users', agentId));
      if (!agentDoc.exists()) {
        return null;
      }

      const agentData = agentDoc.data();
      const pricing = agentData.pricing as PricingData;

      if (!pricing) {
        return null;
      }

      let price = 0;
      let distance: number | undefined;
      let propertyValue: number | undefined;

      switch (pricing.pricingMode) {
        case 'flat':
          price = pricing.flatRate;
          break;

        case 'distance':
          // Extract ZIP code from property address (stub implementation)
          const propertyZip = propertyAddress.match(/\b\d{5}\b/)?.[0] || '';
          const agentZip = pricing.baseLocation.addressOrZip.match(/\b\d{5}\b/)?.[0] || '';
          
          if (propertyZip && agentZip) {
            distance = calculateDistance(propertyZip, agentZip);
            
            if (distance <= 5) {
              price = pricing.distanceTiers.tier1;
            } else if (distance <= 10) {
              price = pricing.distanceTiers.tier2;
            } else {
              price = pricing.distanceTiers.tier3;
            }
          }
          break;

        case 'value':
          propertyValue = propertyPrice;
          if (propertyPrice < 750000) {
            price = pricing.valueTiers.under750k;
          } else if (propertyPrice <= 1500000) {
            price = pricing.valueTiers.midRange;
          } else {
            price = pricing.valueTiers.over1_5m;
          }
          break;
      }

      return {
        agentId,
        agentName: agentData.fullName || agentData.name,
        price,
        pricingMode: pricing.pricingMode,
        distance,
        propertyValue,
      };
    } catch (error) {
      console.error('Error calculating agent pricing:', error);
      return null;
    }
  }

  static async getAvailableAgentsPricing(
    propertyAddress: string,
    propertyPrice: number,
    agentIds: string[]
  ): Promise<AgentPricing[]> {
    const pricingPromises = agentIds.map(agentId =>
      this.calculateAgentPricing(agentId, propertyAddress, propertyPrice)
    );

    const results = await Promise.all(pricingPromises);
    return results.filter((pricing): pricing is AgentPricing => pricing !== null);
  }
} 