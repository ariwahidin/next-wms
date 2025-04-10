import { openDB } from 'idb';

const DB_NAME = 'stocktake-db';
const STORE_NAME = 'aktivitas';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function addAktivitas(data) {
  const db = await getDB();
  await db.add(STORE_NAME, data);
}

export async function getAllAktivitas() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function deleteAktivitas(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function updateAktivitas(data) {
  const db = await getDB();
  await db.put(STORE_NAME, data);
}
