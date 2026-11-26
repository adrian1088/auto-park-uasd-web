import { http } from '@/app/lib/http';

export type GateEntryResult = {
  ticketId: number | null;
  ticketNumber: string;
  plateNumber: string;
  hasReservation: boolean;
  isSubscriptionPass?: boolean;
  assignedSpace: string;
  entryTime: string;
  rateAmount?: number | string | null;
  rate_amount?: number | string | null;
  rate?: { amount?: number | string | null } | null;
};

interface RateContainer {
  amount?: number | string | null;
}

interface RawGateEntryPayload {
  id?: number | null;
  ticketId?: number | null;
  ticketNumber?: string;
  code?: string;
  plateNumber?: string;
  vehiclePlateNumber?: string;
  vehicle_plate_number?: string;
  hasReservation?: boolean;
  reservationId?: number | null;
  isSubscriptionPass?: boolean;
  assignedSpace?: string;
  spaceNumber?: string | null;
  spotNumber?: string;
  spot?: {
    spaceNumber?: string;
    code?: string;
  } | null;
  entryTime?: string;
  entranceAt?: string;
  entrance_at?: string;
  rateAmount?: number | string | null;
  rate_amount?: number | string | null;
  rate?: RateContainer | null;
  ticket?: RawGateEntryPayload | null;
}

interface RawGateEntryResponse {
  success?: boolean;
  message?: string;
  data?: RawGateEntryPayload | null;
}

const DEFAULT_FALLBACK_PLATES = [
  'A-312-XYZ',
  'B-214-ABC',
  'C-923-ZZZ',
  'D-216-WWW',
  'E-581-QQQ',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyRate(value: unknown): value is number | string {
  if (value === undefined || value === null) return false;
  return String(value).trim() !== '';
}

function readRateFromObject(obj: Record<string, unknown>): number | string | null {
  const rateAmount = obj.rateAmount;
  if (isNonEmptyRate(rateAmount)) return rateAmount;

  const rateAmountSnake = obj.rate_amount;
  if (isNonEmptyRate(rateAmountSnake)) return rateAmountSnake;

  if (isRecord(obj.rate)) {
    const nestedAmount = obj.rate.amount;
    if (isNonEmptyRate(nestedAmount)) {
      return nestedAmount as number | string;
    }
  }

  return null;
}

function extractRate(payload: unknown): number | string | null {
  if (!isRecord(payload)) return null;

  if (isRecord(payload.ticket)) {
    const fromTicket = readRateFromObject(payload.ticket);
    if (fromTicket !== null) return fromTicket;
  }

  return readRateFromObject(payload);
}

function extractAssignedSpace(source: RawGateEntryPayload): string {
  const ticketObj = isRecord(source.ticket) ? (source.ticket as RawGateEntryPayload) : null;

  const candidates = [
    ticketObj?.spaceNumber,
    ticketObj?.spot?.spaceNumber,
    ticketObj?.spotNumber,
    ticketObj?.assignedSpace,
    ticketObj?.spot?.code,
    source.spaceNumber,
    source.spot?.spaceNumber,
    source.spotNumber,
    source.assignedSpace,
    source.spot?.code,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === 'string' &&
      candidate.trim() !== '' &&
      candidate.trim() !== 'N/A'
    ) {
      return candidate.trim();
    }
  }

  return 'N/A';
}

export async function getValidPlates(): Promise<string[]> {
  try {
    const res = await http.get<{ success?: boolean; data?: string[] } | string[]>(
      '/parking/gate/plates',
    );
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_FALLBACK_PLATES;
  } catch (error) {
    console.error('Error obteniendo matrículas válidas:', error);
    return DEFAULT_FALLBACK_PLATES;
  }
}

export async function processGateEntry(
  plateNumber: string,
  parkingLotId: number = 1,
  source: 'AUTOMATIC_LPR' | 'MANUAL' = 'AUTOMATIC_LPR',
  qrCode?: string,
): Promise<GateEntryResult | null> {
  try {
    const cleanPlate =
      plateNumber && plateNumber.trim() !== ''
        ? plateNumber.trim().toUpperCase()
        : 'AUTO';
    const trimmedQr = qrCode?.trim();

    const rawRes = await http.post<RawGateEntryResponse | RawGateEntryPayload>(
      '/parking/gate/entry',
      {
        plateNumber: cleanPlate,
        source,
        parkingLotId: Number(parkingLotId) || 1,
        ...(trimmedQr
          ? trimmedQr.toUpperCase().startsWith('SUB-')
            ? { reservationCode: trimmedQr }
            : { qrCode: trimmedQr }
          : {}),
      },
    );

    const data: RawGateEntryPayload | null =
      isRecord(rawRes) && 'data' in rawRes && isRecord(rawRes.data)
        ? (rawRes.data as RawGateEntryPayload)
        : isRecord(rawRes)
          ? (rawRes as RawGateEntryPayload)
          : null;

    if (!data) return null;

    const ticketObj = isRecord(data.ticket) ? (data.ticket as RawGateEntryPayload) : null;
    const resolvedRate = extractRate(data) ?? extractRate(rawRes);
    const assignedSpace = extractAssignedSpace(data);

    return {
      ticketId: ticketObj?.id ?? data.ticketId ?? data.id ?? null,
      ticketNumber:
        ticketObj?.code ?? data.ticketNumber ?? data.code ?? `TCK-${Date.now()}`,
      plateNumber:
        ticketObj?.vehiclePlateNumber ??
        ticketObj?.plateNumber ??
        data.plateNumber ??
        data.vehiclePlateNumber ??
        data.vehicle_plate_number ??
        (cleanPlate !== 'AUTO' ? cleanPlate : DEFAULT_FALLBACK_PLATES[0]),
      hasReservation: Boolean(data.hasReservation ?? data.reservationId ?? false),
      isSubscriptionPass: Boolean(data.isSubscriptionPass ?? false),
      assignedSpace,
      entryTime:
        ticketObj?.entranceAt ??
        ticketObj?.entrance_at ??
        data.entryTime ??
        data.entranceAt ??
        data.entrance_at ??
        new Date().toISOString(),
      rateAmount: resolvedRate,
      rate_amount: resolvedRate,
    };
  } catch (error) {
    console.error('Error al procesar la entrada en garita:', error);
    throw error;
  }
}