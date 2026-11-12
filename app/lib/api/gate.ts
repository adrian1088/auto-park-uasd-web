// app/lib/api/gate.ts
import { http } from '@/app/lib/http';

export type GateEntryResult = {
  ticketId: number;
  ticketNumber: string;
  plateNumber: string;
  hasReservation: boolean;
  assignedSpace: string;
  entryTime: string;
};

export async function getValidPlates(): Promise<string[]> {
  try {
    const res = await http.get<{ success: boolean; data: string[] }>('/parking/gate/plates');
    return res.data && res.data.length > 0 ? res.data : ['A-892-XYZ', 'B-104-ABC', 'C-333-ZZZ', 'D-456-WWW', 'E-789-QQQ'];
  } catch (error) {
    console.error('Error obteniendo matrículas válidas:', error);
    return ['A-892-XYZ', 'B-104-ABC', 'C-333-ZZZ', 'D-456-WWW', 'E-789-QQQ'];
  }
}

export async function processGateEntry(
  plateNumber: string, 
  parkingLotId: number = 1, 
  source: 'AUTOMATIC_LPR' | 'MANUAL' = 'AUTOMATIC_LPR'
): Promise<GateEntryResult | null> {
  try {
    // Si no se escribe matrícula, enviamos "AUTO" para que el backend use las 5 por defecto o aleatorias
    const cleanPlate = plateNumber && plateNumber.trim() !== "" ? plateNumber.trim().toUpperCase() : "AUTO";
    
    const res = await http.post<{ success: boolean; message: string; data: GateEntryResult }>('/parking/gate/entry', {
      plateNumber: cleanPlate,
      source: source, 
      parkingLotId: Number(parkingLotId),
    });
    return res.data;
  } catch (error) {
    console.error('Error al procesar la entrada en garita:', error);
    throw error; 
  }
}