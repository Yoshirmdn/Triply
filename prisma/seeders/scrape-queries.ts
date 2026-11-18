import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CITIES = [
  "Banda Aceh",
  "Sabang",
  "Medan",
  "Berastagi",
  "Parapat Danau Toba",
  "Padang",
  "Bukittinggi",
  "Pekanbaru",
  "Batam",
  "Tanjung Pinang",
  "Jambi",
  "Palembang",
  "Bengkulu",
  "Bandar Lampung",
  "Tanjung Pandan Belitung",
  "Pangkal Pinang",
  "Jakarta",
  "Bogor",
  "Bandung",
  "Lembang",
  "Cirebon",
  "Sukabumi",
  "Garut",
  "Pangandaran",
  "Semarang",
  "Solo",
  "Yogyakarta",
  "Magelang",
  "Wonosobo Dieng",
  "Surabaya",
  "Malang",
  "Batu",
  "Banyuwangi",
  "Probolinggo Bromo",
  "Anyer",
  "Denpasar",
  "Ubud",
  "Kuta Bali",
  "Nusa Dua",
  "Singaraja",
  "Mataram Lombok",
  "Senggigi",
  "Labuan Bajo",
  "Kupang",
  "Waingapu Sumba",
  "Maumere",
  "Ende Flores",
  "Pontianak",
  "Balikpapan",
  "Samarinda",
  "Banjarmasin",
  "Palangkaraya",
  "Tarakan",
  "Derawan Berau",
  "Makassar",
  "Rantepao Toraja",
  "Manado",
  "Gorontalo",
  "Palu",
  "Kendari",
  "Wakatobi",
  "Ambon",
  "Ternate",
  "Banda Neira",
  "Sorong",
  "Waisai Raja Ampat",
  "Jayapura",
  "Wamena",
  "Manokwari",
];

const BASE_CATEGORIES = [
  "tempat wisata",
  "tempat wisata alam",
  "restoran",
  "kafe",
  "museum",
  "pusat perbelanjaan",
];
const EXTRA_CATEGORIES = ["hotel", "tempat hiburan"];

const BATCH_SIZE = 10;

const folder = resolve("scraper-output");
mkdirSync(folder, { recursive: true });

function buildQueries(categories: string[]): string[] {
  return CITIES.flatMap((city) =>
    categories.map((category) => `${category} di ${city}`),
  );
}

function writeBatches(queries: string[], startNumber: number): number {
  let number = startNumber;
  for (let index = 0; index < queries.length; index += BATCH_SIZE) {
    const name = `queries-${String(number).padStart(3, "0")}.txt`;
    writeFileSync(
      resolve(folder, name),
      `${queries.slice(index, index + BATCH_SIZE).join("\n")}\n`,
      "utf8",
    );
    number += 1;
  }
  return number;
}

const base = buildQueries(BASE_CATEGORIES);
const extra = buildQueries(EXTRA_CATEGORIES);
const afterBase = writeBatches(base, 1);
const afterExtra = writeBatches(extra, afterBase);

console.log(
  `${base.length + extra.length} query dalam ${afterExtra - 1} batch di ${folder}`,
);
