import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const MOCK_DB_PATH = path.join(process.cwd(), 'mock-db.json');

// Helper to generate mock data if it does not exist
function generateMockStudents() {
  const groupsAndNames: Record<string, string[]> = {
    'cami-mega-crew': ['Sofía Rodríguez', 'Valentina López', 'Martina Gómez', 'Lucía Díaz', 'Florencia Álvarez', 'Camila Fernández', 'Catalina Romero'],
    'cami-mega-kids': ['Mateo Rossi', 'Thiago López', 'Benjamín García', 'Bautista Díaz', 'Felipe Alarcón', 'Olivia Fernández', 'Emma Romero'],
    'cami-bratz': ['Zoe Moreno', 'Mía Perez', 'Lola Sánchez', 'Alma Castro', 'Juana Blanco'],
    'cami-girly-team': ['Morena Torres', 'Isabella Juárez', 'Kiara Ramírez', 'Delfina Gómez', 'Jazmín Sosa'],
    'cami-mega-teens': ['Santiago Medina', 'Lucas Núñez', 'Matías Valenzuela', 'Nicolás Peralta', 'Joaquín Cabrera'],
    'cami-golden': ['Elena Ortiz', 'Margarita Rojas', 'Beatriz Herrera', 'Estela Giménez', 'Patricia Toledo'],
    'ani-reggaeton-femme': ['Ámbar Luna', 'Ludmila Godoy', 'Sol Vega', 'Luna Kardian', 'Priscila Paez'],
    'ani-reggaeton': ['Renzo Juárez', 'Enzo Benítez', 'Ignacio Morales', 'Santino Gutiérrez', 'Lautaro Flores'],
    'nasya-mix-dance': ['Ciro Vera', 'Gael Ledesma', 'Luan Silva', 'Bastián Correa', 'Noah Torres'],
    'nasya-urban-kids': ['Milo Juárez', 'Ian Peralta', 'Teo Kroll', 'Leonel Galarza', 'Valentino Rossi'],
    'nasya-street-dance': ['Dante Ortiz', 'Bruno Medina', 'Simón Espinoza', 'Fidel Arce', 'Alma Fuentes'],
    'lulu-jazz-conte': ['Victoria Quiroga', 'Clara Novoa', 'Julieta Funes', 'Paula Duarte', 'Martina Mansilla'],
    'lucas-ladys': ['Mirta Acuña', 'Susana Moyano', 'Alicia Ferreyra', 'Gladys Bustos', 'Norma Soria'],
    'lucas-latino': ['Juan Carlos', 'Alberto Gómez', 'Jorge Funes', 'Roberto Duarte', 'Daniel Peralta'],
    'marian-arabe-inicial': ['Yasmin Alí', 'Fatima Bella', 'Samira Carim', 'Soraya Daher', 'Layla Echeverría'],
    'marian-arabe-intermedio': ['Mariam Halabi', 'Zahra Issa', 'Amina Jabour', 'Salma Kanaan', 'Karima Latouf']
  };

  const list: any[] = [];
  Object.entries(groupsAndNames).forEach(([groupId, names]) => {
    names.forEach((name, idx) => {
      const id = `${groupId}-std-${idx + 1}`;
      list.push({
        id,
        groupId,
        name,
        active: true
      });
    });
  });
  return list;
}

function generateMockAttendance() {
  const students = generateMockStudents();
  const attendance: any[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  
  const GROUPS_DATA = [
    { id: 'cami-mega-crew', days: [3] }, // Wed
    { id: 'cami-mega-kids', days: [3] },
    { id: 'cami-bratz', days: [1] }, // Mon
    { id: 'cami-girly-team', days: [1] },
    { id: 'cami-mega-teens', days: [5] }, // Fri
    { id: 'cami-golden', days: [5] },
    { id: 'ani-reggaeton-femme', days: [2, 4] }, // Tue, Thu
    { id: 'ani-reggaeton', days: [2, 4] },
    { id: 'nasya-mix-dance', days: [2, 4] },
    { id: 'nasya-urban-kids', days: [2, 4] },
    { id: 'nasya-street-dance', days: [2, 4] },
    { id: 'lulu-jazz-conte', days: [5] },
    { id: 'lucas-ladys', days: [2, 4] },
    { id: 'lucas-latino', days: [2, 4] },
    { id: 'marian-arabe-inicial', days: [1, 3] }, // Mon, Wed
    { id: 'marian-arabe-intermedio', days: [1, 3] }
  ];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    GROUPS_DATA.forEach(g => {
      if (g.days.includes(dayOfWeek)) {
        const groupStudents = students.filter(s => s.groupId === g.id);
        groupStudents.forEach(student => {
          const present = Math.random() < 0.85;
          const id = `${g.id}-${dateStr}-${student.id}-mock`;
          attendance.push({
            id,
            groupId: g.id,
            date: dateStr,
            studentId: student.id,
            studentName: student.name,
            present
          });
        });
      }
    });
  }
  
  return attendance;
}

function generateMockNotes() {
  return [
    {
      choreoId: 'cami-mega-crew-coreo1',
      content: 'Anotaciones de la coreo 1 para Mega Crew:\n- Entrada por los laterales en el segundo 15.\n- El grupo A va a la derecha, el grupo B a la izquierda.\n- Practicar la sincronización en el estribillo lento (0.75x).\n- Agregar acentos con los brazos en la cuenta 4.',
      updatedAt: new Date().toISOString()
    }
  ];
}

function readMockDb() {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    const initialDb = {
      students: generateMockStudents(),
      attendance: generateMockAttendance(),
      notes: generateMockNotes()
    };
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(MOCK_DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading mock db file:', err);
    return { students: [], attendance: [], notes: [] };
  }
}

function writeMockDb(data: any) {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing mock db file:', err);
  }
}

const isMockMode = !SHEET_ID || SHEET_ID === 'placeholder';

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────
function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return auth;
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────────────────────────────────────
async function readSheet(range: string): Promise<string[][]> {
  if (isMockMode) return [];
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });
    return (res.data.values as string[][]) || [];
  } catch (err) {
    console.error('Sheets read error:', err);
    return [];
  }
}

async function writeRow(range: string, values: string[][]): Promise<void> {
  if (isMockMode) return;
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } catch (err) {
    console.error('Sheets write error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS — Sheet: "students"
// Columns: id | groupId | name | active
// ─────────────────────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  groupId: string;
  name: string;
  active: boolean;
}

export async function getStudentsByGroup(groupId: string): Promise<Student[]> {
  if (isMockMode) {
    const db = readMockDb();
    return db.students.filter((s: any) => s.groupId === groupId && s.active);
  }

  const rows = await readSheet('students!A:D');
  if (!rows.length) return [];
  return rows
    .slice(1)
    .filter((r) => r[1] === groupId && r[3] !== 'false')
    .map((r) => ({
      id: r[0],
      groupId: r[1],
      name: r[2],
      active: r[3] !== 'false',
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE — Sheet: "attendance"
// Columns: id | groupId | date (YYYY-MM-DD) | studentId | studentName | present
// ─────────────────────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  groupId: string;
  date: string;
  studentId: string;
  studentName: string;
  present: boolean;
}

export async function getAttendanceForDay(
  groupId: string,
  date: string
): Promise<AttendanceRecord[]> {
  if (isMockMode) {
    const db = readMockDb();
    return db.attendance.filter((r: any) => r.groupId === groupId && r.date === date);
  }

  const rows = await readSheet('attendance!A:F');
  if (!rows.length) return [];
  return rows
    .slice(1)
    .filter((r) => r[1] === groupId && r[2] === date)
    .map((r) => ({
      id: r[0],
      groupId: r[1],
      date: r[2],
      studentId: r[3],
      studentName: r[4],
      present: r[5] === 'TRUE',
    }));
}

export async function getAttendanceForMonth(
  groupId: string,
  year: number,
  month: number
): Promise<AttendanceRecord[]> {
  if (isMockMode) {
    const db = readMockDb();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return db.attendance.filter((r: any) => r.groupId === groupId && r.date?.startsWith(prefix));
  }

  const rows = await readSheet('attendance!A:F');
  if (!rows.length) return [];
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return rows
    .slice(1)
    .filter((r) => r[1] === groupId && r[2]?.startsWith(prefix))
    .map((r) => ({
      id: r[0],
      groupId: r[1],
      date: r[2],
      studentId: r[3],
      studentName: r[4],
      present: r[5] === 'TRUE',
    }));
}

export async function saveAttendanceForDay(
  groupId: string,
  date: string,
  records: { studentId: string; studentName: string; present: boolean }[]
): Promise<void> {
  if (isMockMode) {
    const db = readMockDb();
    // Remove existing records for this day/group
    db.attendance = db.attendance.filter((r: any) => !(r.groupId === groupId && r.date === date));
    
    const timestamp = Date.now();
    for (const rec of records) {
      const id = `${groupId}-${date}-${rec.studentId}-${timestamp}`;
      db.attendance.push({
        id,
        groupId,
        date,
        studentId: rec.studentId,
        studentName: rec.studentName,
        present: rec.present
      });
    }
    writeMockDb(db);
    return;
  }

  // First read all rows to find existing ones for this day
  const rows = await readSheet('attendance!A:F');
  const allRows: string[][] = rows.length ? rows : [['id', 'groupId', 'date', 'studentId', 'studentName', 'present']];

  // Remove existing records for this day/group
  const filtered = allRows.filter((r, i) => i === 0 || !(r[1] === groupId && r[2] === date));

  // Add new records
  const timestamp = Date.now();
  for (const rec of records) {
    const id = `${groupId}-${date}-${rec.studentId}-${timestamp}`;
    filtered.push([id, groupId, date, rec.studentId, rec.studentName, rec.present ? 'TRUE' : 'FALSE']);
  }

  // Write back the full sheet
  await writeRow(`attendance!A1:F${filtered.length}`, filtered);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTES — Sheet: "notes"
// Columns: choreoId | content | updatedAt
// ─────────────────────────────────────────────────────────────────────────────
export interface ChoreoNotes {
  choreoId: string;
  content: string;
  updatedAt: string;
}

export async function getNotes(choreoId: string): Promise<ChoreoNotes | null> {
  if (isMockMode) {
    const db = readMockDb();
    const found = db.notes.find((n: any) => n.choreoId === choreoId);
    return found || null;
  }

  const rows = await readSheet('notes!A:C');
  if (!rows.length) return null;
  const found = rows.slice(1).find((r) => r[0] === choreoId);
  if (!found) return null;
  return { choreoId: found[0], content: found[1] || '', updatedAt: found[2] || '' };
}

export async function saveNotes(choreoId: string, content: string): Promise<void> {
  const updatedAt = new Date().toISOString();

  if (isMockMode) {
    const db = readMockDb();
    const foundIndex = db.notes.findIndex((n: any) => n.choreoId === choreoId);
    if (foundIndex === -1) {
      db.notes.push({ choreoId, content, updatedAt });
    } else {
      db.notes[foundIndex] = { choreoId, content, updatedAt };
    }
    writeMockDb(db);
    return;
  }

  const rows = await readSheet('notes!A:C');
  const allRows: string[][] = rows.length ? rows : [['choreoId', 'content', 'updatedAt']];

  const rowIndex = allRows.findIndex((r, i) => i > 0 && r[0] === choreoId);

  if (rowIndex === -1) {
    allRows.push([choreoId, content, updatedAt]);
  } else {
    allRows[rowIndex] = [choreoId, content, updatedAt];
  }

  await writeRow(`notes!A1:C${allRows.length}`, allRows);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Get all dates that had attendance for a group+month
// ─────────────────────────────────────────────────────────────────────────────
export async function getDatesWithAttendance(
  groupId: string,
  year: number,
  month: number
): Promise<string[]> {
  const records = await getAttendanceForMonth(groupId, year, month);
  const dates = new Set(records.map((r) => r.date));
  return Array.from(dates);
}
