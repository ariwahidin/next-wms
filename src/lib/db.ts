// lib/db.ts
import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER || "localhost",
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

export async function queryDB(query: string) {
  const pool = await getPool();
  const result = await pool.request().query(query);
  return result.recordset;
}



// import { openDB } from 'idb';

// const DB_NAME = 'stocktake-db';
// const STORE_NAME = 'aktivitas';

// export async function getDB() {
//   return openDB(DB_NAME, 1, {
//     upgrade(db) {
//       if (!db.objectStoreNames.contains(STORE_NAME)) {
//         db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
//       }
//     },
//   });
// }

// export async function addAktivitas(data) {
//   const db = await getDB();
//   await db.add(STORE_NAME, data);
// }

// export async function getAllAktivitas() {
//   const db = await getDB();
//   return db.getAll(STORE_NAME);
// }

// export async function deleteAktivitas(id) {
//   const db = await getDB();
//   await db.delete(STORE_NAME, id);
// }

// export async function updateAktivitas(data) {
//   const db = await getDB();
//   await db.put(STORE_NAME, data);
// }
