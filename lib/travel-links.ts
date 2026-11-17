import { firstSegment } from "@/lib/photo-match";

type FlightLinkInput = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
};

type HotelLinkInput = {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
};

export function googleFlightsUrl(input: FlightLinkInput): string {
  const origin = firstSegment(input.origin);
  const destination = firstSegment(input.destination);
  const query = `Flights from ${origin} to ${destination} on ${input.startDate} through ${input.endDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}&hl=id&curr=IDR`;
}

export function bookingHotelsUrl(input: HotelLinkInput): string {
  const params = new URLSearchParams({
    ss: firstSegment(input.destination),
    checkin: input.startDate,
    checkout: input.endDate,
    group_adults: String(Math.max(1, Math.min(input.travelers, 30))),
    no_rooms: "1",
    selected_currency: "IDR",
    lang: "id",
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function webSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=id`;
}

export function busSearchUrl(origin: string, destination: string): string {
  return webSearchUrl(
    `tiket bus ${firstSegment(origin)} ke ${firstSegment(destination)}`,
  );
}

export function trainSearchUrl(origin: string, destination: string): string {
  return webSearchUrl(
    `tiket kereta api ${firstSegment(origin)} ke ${firstSegment(destination)}`,
  );
}
