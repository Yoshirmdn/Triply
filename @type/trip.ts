import type { TripStatusValue } from "@/data/trip";

export type TripDTO = {
  id: string;
  title: string;
  destination: string;
  description: string | null;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: string;
  coverImage: string | null;
  status: TripStatusValue;
  isPublic: boolean;
  isOwner: boolean;
  canEdit: boolean;
};

export type TripDayDTO = {
  id: string;
  date: string;
  dayNumber: number;
  itemCount: number;
};

export type TripDetailDTO = TripDTO & {
  days: TripDayDTO[];
};

export type TripListResult = {
  items: TripDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type UserDashboardData = {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalBudget: string;
  recentTrips: TripDTO[];
};

export type AdminOverview = {
  totalUsers: number;
  activeUsers: number;
  totalTrips: number;
  upcomingTrips: number;
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    role: "SUPER_ADMIN" | "USER";
    isActive: boolean;
    createdAt: Date;
  }[];
  recentActivities: {
    id: string;
    action: string;
    description: string;
    createdAt: Date;
    userLabel: string | null;
  }[];
};