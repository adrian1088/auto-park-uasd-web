import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface ParkingSpace {
  id: number;
  spaceNumber: string;
  type?: string;
  status?: string;
  floor?: {
    id: number;
    floorNumber: number;
    lot?: {
      id: number;
      name: string;
    };
  };
}

export interface Reservation {
  id: number;
  startTime: string;
  endTime: string;
  status?: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  userId: number;
  parkingSpaceId?: number;
  user?: User;
  spot?: ParkingSpace;
  parkingSpace?: ParkingSpace;
  createdAt?: string;
}

export const ReservationsService = {
  getAll: async (): Promise<Reservation[]> => {
    const response = await api.get("/reservations");
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Crea la reserva con confirmación inmediata (parkingSpaceId ahora es opcional para asignación dinámica)
  createConfirmed: async (payload: {
    startTime: string;
    endTime: string;
    userId: number;
    parkingSpaceId?: number;
  }): Promise<Reservation> => {
    const response = await api.post("/reservations", payload);
    return response.data?.data || response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/reservations/${id}`);
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get("/users");
    const res = response.data?.data || response.data;
    return Array.isArray(res) ? res : res?.data || [];
  },

  getAvailableSpaces: async (): Promise<ParkingSpace[]> => {
    const response = await api.get("/parking/floors");
    const floors = response.data?.data || response.data;
    const spaces: ParkingSpace[] = [];

    if (Array.isArray(floors)) {
      floors.forEach((floor: { id: number; floorNumber: number; lot?: { id: number; name: string }; spaces?: ParkingSpace[] }) => {
        if (floor.spaces && Array.isArray(floor.spaces)) {
          floor.spaces.forEach((space: ParkingSpace) => {
            spaces.push({
              ...space,
              floor: {
                id: floor.id,
                floorNumber: floor.floorNumber,
                lot: floor.lot,
              },
            });
          });
        }
      });
    }
    return spaces;
  },

  // Simulación del módulo de entrada (LPR) para convertir reserva en ticket (COMPLETED)
  checkIn: async (payload: { reservationId?: number; userId?: number }) => {
    const response = await api.post("/tickets/check-in", payload);
    return response.data?.data || response.data;
  },
};